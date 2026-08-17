import { Request, Response } from 'express';
import prisma from '../utils/db';

export class ChatController {
  public static async getMessages(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      
      const conv = await prisma.conversation.findFirst({
        where: { projectId }
      });

      if (!conv) {
        return res.status(200).json([]);
      }

      const isClient = !!(req as any).client;

      const messages = await prisma.message.findMany({
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
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async sendMessage(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { text, taskId, milestoneId } = req.body;
      const userId = (req as any).user?.id || (req as any).client?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      let conv = await prisma.conversation.findFirst({
        where: { projectId }
      });

      if (!conv) {
        conv = await prisma.conversation.create({
          data: { projectId }
        });
      }

      const message = await prisma.message.create({
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
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
