"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const routes_1 = __importDefault(require("./routes"));
require("./jobs/riskNightly");
require("./jobs/tierCountsCache");
const weeklyPulseEmail_1 = require("./jobs/weeklyPulseEmail");
const error_1 = require("./middleware/error");
dotenv_1.default.config();
(0, weeklyPulseEmail_1.startWeeklyPulseEmailJob)();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: '*',
    }
});
const prisma = new client_1.PrismaClient();
app.use((0, cors_1.default)({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use('/api', routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.use(error_1.errorHandler);
const activeClients = new Map(); // socketId -> projectId
exports.io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('join_project', (projectId) => {
        socket.join(`project_${projectId}`);
        console.log(`Socket ${socket.id} joined project_${projectId}`);
    });
    socket.on('client_online', (projectId) => {
        activeClients.set(socket.id, projectId);
        exports.io.to(`project_${projectId}`).emit('client_status', { online: true });
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
                        id: (0, crypto_1.randomUUID)(),
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
                exports.io.to(`project_${projectId}`).emit('receive_message', message);
            }
            else {
                const message = {
                    id: (0, crypto_1.randomUUID)(),
                    senderName: senderName || 'Client',
                    text,
                    createdAt: new Date().toISOString(),
                    taskId,
                    milestoneId
                };
                exports.io.to(`project_${projectId}`).emit('receive_message', message);
            }
        }
        catch (e) {
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
                    create: { id: (0, crypto_1.randomUUID)(), conversationId: conv.id, userId: data.userId, lastReadAt: now }
                });
                socket.to(`project_${data.projectId}`).emit('messages_read', { userId: data.userId, time: now.toISOString() });
            }
        }
        catch (e) {
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
                    exports.io.to(`project_${projectId}`).emit('client_status', { online: false });
                }
            }, 3000);
        }
    });
});
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=index.js.map