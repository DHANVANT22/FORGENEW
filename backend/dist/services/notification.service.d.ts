export declare class NotificationService {
    /**
     * Fans out an in-app notification to a user.
     */
    static sendNotification(params: {
        userId: string;
        type: string;
        title: string;
        message: string;
        actorId?: string;
        entityType?: string;
        entityId?: string;
        url?: string;
        groupKey?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        title: string;
        type: string;
        message: string;
        actorId: string | null;
        entityType: string | null;
        entityId: string | null;
        isRead: boolean;
        url: string | null;
        groupKey: string | null;
        emailedAt: Date | null;
        userId: string;
    }>;
    /**
     * Stub for email delivery.
     */
    static sendEmail(to: string, subject: string, body: string): Promise<void>;
}
//# sourceMappingURL=notification.service.d.ts.map