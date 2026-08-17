"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class ChatController {
    static async getMessages(req, res) {
        try {
            const { projectId } = req.params;
            const conv = await db_1.default.conversation.findFirst({
                where: { projectId }
            });
            if (!conv) {
                return res.status(200).json([]);
            }
            const isClient = !!req.client;
            const messages = await db_1.default.message.findMany({
                where: { conversationId: conv.id },
                orderBy: { createdAt: 'asc' },
                include: {
                    User: true,
                    Attachment: isClient ? { where: { visibility: 'CLIENT_VISIBLE' } } : true
                }
            });
            const formatted = messages.map(m => ({
                id: m.id,
                senderName: m.User?.name || 'Unknown',
                text: m.body,
                createdAt: m.createdAt,
                taskId: m.taskId,
                milestoneId: m.milestoneId,
                attachments: m.Attachment.map(a => ({
                    id: a.id,
                    url: a.url,
                    filename: a.filename
                }))
            }));
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
            const { text, taskId, milestoneId } = req.body;
            const userId = req.user?.id || req.client?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            let conv = await db_1.default.conversation.findFirst({
                where: { projectId }
            });
            if (!conv) {
                conv = await db_1.default.conversation.create({
                    data: { projectId }
                });
            }
            const message = await db_1.default.message.create({
                data: {
                    body: text,
                    conversationId: conv.id,
                    userId: userId,
                    taskId,
                    milestoneId
                },
                include: { User: true }
            });
            const formatted = {
                id: message.id,
                senderName: message.User.name,
                text: message.body,
                createdAt: message.createdAt,
                taskId: message.taskId,
                milestoneId: message.milestoneId
            };
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