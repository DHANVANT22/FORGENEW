import { Request, Response } from 'express';
import prisma from '../utils/db';
import { io } from '../index';

export class ChatController {
  public static async getMessages(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      
      const conv = await prisma.conversation.findFirst({
        where: { projectId: projectId as string }
      });

      if (!conv) {
        return res.status(200).json([]);
      }

      const messages = await prisma.message.findMany({
        where: { conversationId: conv.id },
        orderBy: { createdAt: 'asc' },
        include: { 
          User: true
        }
      });

      const formatted = messages.map(m => {
        const isClient = m.clientNonce === 'CLIENT_MSG' || m.body.startsWith('📋') || m.User?.role === 'DEV' && m.clientNonce === 'client';
        return {
          id: m.id,
          senderName: m.clientNonce === 'CLIENT_MSG' ? 'Client' : (m.User?.name || 'Team Admin'),
          text: m.body,
          createdAt: m.createdAt,
          taskId: m.taskId,
          milestoneId: m.milestoneId,
          attachments: []
        };
      });

      res.status(200).json(formatted);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async sendMessage(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { text, body: reqBody, taskId, milestoneId } = req.body;
      const messageContent = (text || reqBody || '').trim();
      const isClientAuth = !!(req as any).client;
      const user = (req as any).user;

      if (!messageContent) {
        return res.status(400).json({ error: 'Message body cannot be empty' });
      }

      let conv = await prisma.conversation.findFirst({
        where: { projectId: projectId as string }
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: { projectId: projectId as string, type: 'project', updatedAt: new Date() }
        });
      }

      const defaultUser = await prisma.user.findFirst();
      const senderId = user?.id || defaultUser?.id;

      if (!senderId) {
        return res.status(500).json({ error: 'No user account available for messaging' });
      }

      const message = await prisma.message.create({
        data: {
          id: Date.now().toString(),
          body: messageContent,
          conversationId: conv.id,
          senderId: senderId,
          clientNonce: isClientAuth ? 'CLIENT_MSG' : 'ADMIN_MSG',
          taskId,
          milestoneId
        },
        include: { User: true }
      });

      const formatted = {
        id: message.id,
        senderName: isClientAuth ? 'Client' : (user?.name || message.User?.name || 'Admin Team'),
        text: message.body,
        createdAt: message.createdAt.toISOString(),
        taskId: message.taskId,
        milestoneId: message.milestoneId
      };

      // Broadcast immediately to Socket.io room
      io.to(`project_${projectId}`).emit('receive_message', formatted);

      res.status(201).json(formatted);
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
