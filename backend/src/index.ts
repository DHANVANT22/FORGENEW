import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import router from './routes';
import './jobs/riskNightly';
import './jobs/tierCountsCache';
import { startWeeklyPulseEmailJob } from './jobs/weeklyPulseEmail';
import { errorHandler } from './middleware/error';

dotenv.config();

startWeeklyPulseEmailJob();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter((origin): origin is string => Boolean(origin));

export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

const prisma = new PrismaClient();

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', router);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

const activeClients = new Map<string, string>(); // socketId -> projectId

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_project', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`Socket ${socket.id} joined project_${projectId}`);
  });

  socket.on('client_online', (projectId) => {
    activeClients.set(socket.id, projectId);
    io.to(`project_${projectId}`).emit('client_status', { online: true });
  });

  socket.on('send_message', async (data) => {
    const { projectId, senderName, text, taskId, milestoneId } = data;

    try {
      // Find or create conversation for project
      let conv = await prisma.conversation.findFirst({ where: { projectId } });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: { projectId, type: 'project', updatedAt: new Date() }
        });
      }

      // Find a default user for relation
      const user = await prisma.user.findFirst();
      const isClient = senderName === 'Client';

      if (user && conv) {
        const savedMsg = await prisma.message.create({
          data: {
            id: randomUUID(),
            conversationId: conv.id,
            senderId: user.id,
            clientNonce: isClient ? 'CLIENT_MSG' : 'ADMIN_MSG',
            body: text,
            taskId,
            milestoneId
          }
        });

        const message = {
          id: savedMsg.id,
          senderName: isClient ? 'Client' : (senderName || user.name || 'Team Admin'),
          text: savedMsg.body,
          createdAt: savedMsg.createdAt.toISOString(),
          taskId,
          milestoneId
        };
        io.to(`project_${projectId}`).emit('receive_message', message);
      } else {
        const message = {
          id: randomUUID(),
          senderName: senderName || 'Client',
          text,
          createdAt: new Date().toISOString(),
          taskId,
          milestoneId
        };
        io.to(`project_${projectId}`).emit('receive_message', message);
      }
    } catch (e) {
      console.error('Failed to save message', e);
    }
  });

  socket.on('typing', (data) => {
    socket.to(`project_${data.projectId}`).emit('user_typing', { senderName: data.senderName, isTyping: data.isTyping });
  });

  socket.on('mark_read', async (data) => {
    const now = new Date();
    try {
      const conv = await prisma.conversation.findFirst({ where: { projectId: data.projectId } });
      if (conv && data.userId) {
        await prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: conv.id, userId: data.userId } },
          update: { lastReadAt: now },
          create: { id: randomUUID(), conversationId: conv.id, userId: data.userId, lastReadAt: now }
        });
        socket.to(`project_${data.projectId}`).emit('messages_read', { userId: data.userId, time: now.toISOString() });
      }
    } catch (e) {
      console.error(e);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const projectId = activeClients.get(socket.id);
    if (projectId) {
      activeClients.delete(socket.id);

      // Debounce offline status to prevent flicker on refresh
      setTimeout(() => {
        const stillOnline = Array.from(activeClients.values()).includes(projectId);
        if (!stillOnline) {
          io.to(`project_${projectId}`).emit('client_status', { online: false });
        }
      }, 3000);
    }
  });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
