"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const db_1 = __importDefault(require("../utils/db"));
const index_1 = require("../index");
class ChatController {
    static async getMessages(req, res) {
        try {
            const { projectId } = req.params;
            const conv = await db_1.default.conversation.findFirst({
                where: { projectId: projectId }
            });
            if (!conv) {
                return res.status(200).json([]);
            }
            const messages = await db_1.default.message.findMany({
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
        }
        catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async sendMessage(req, res) {
        try {
            const { projectId } = req.params;
            const { text, body: reqBody, taskId, milestoneId } = req.body;
            const messageContent = (text || reqBody || '').trim();
            const isClientAuth = !!req.client;
            const user = req.user;
            if (!messageContent) {
                return res.status(400).json({ error: 'Message body cannot be empty' });
            }
            let conv = await db_1.default.conversation.findFirst({
                where: { projectId: projectId }
            });
            if (!conv) {
                conv = await db_1.default.conversation.create({
                    data: { projectId: projectId, type: 'project', updatedAt: new Date() }
                });
            }
            const defaultUser = await db_1.default.user.findFirst();
            const senderId = user?.id || defaultUser?.id;
            if (!senderId) {
                return res.status(500).json({ error: 'No user account available for messaging' });
            }
            const message = await db_1.default.message.create({
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
            index_1.io.to(`project_${projectId}`).emit('receive_message', formatted);
            res.status(201).json(formatted);
        }
        catch (error) {
            console.error('Error sending message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=ChatController.js.map