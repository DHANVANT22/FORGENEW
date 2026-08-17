"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const db_1 = __importDefault(require("../utils/db"));
const uuid_1 = require("uuid");
class NotificationService {
    /**
     * Fans out an in-app notification to a user.
     */
    static async sendNotification(params) {
        try {
            const notification = await db_1.default.notification.create({
                data: {
                    id: (0, uuid_1.v4)(),
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
        }
        catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
    /**
     * Stub for email delivery.
     */
    static async sendEmail(to, subject, body) {
        console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
        // Real implementation would use Nodemailer, SendGrid, Resend, etc.
    }
}
exports.NotificationService = NotificationService;
//# sourceMappingURL=notification.service.js.map