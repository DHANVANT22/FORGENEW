import prisma from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export class NotificationService {
  /**
   * Fans out an in-app notification to a user.
   */
  static async sendNotification(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actorId?: string;
    entityType?: string;
    entityId?: string;
    url?: string;
    groupKey?: string;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(),
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          actorId: params.actorId,
          entityType: params.entityType,
          entityId: params.entityId,
          url: params.url,
          groupKey: params.groupKey,
          isRead: false
        }
      });
      
      // In a more complete implementation, we might emit this over WebSockets
      // e.g. io.to(`user_${params.userId}`).emit('notification', notification);
      
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Stub for email delivery.
   */
  static async sendEmail(to: string, subject: string, body: string) {
    console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
    // Real implementation would use Nodemailer, SendGrid, Resend, etc.
  }
}
