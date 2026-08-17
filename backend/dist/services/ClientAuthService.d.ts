export declare class ClientAuthService {
    inviteClient(projectId: string, email: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        email: string;
        inviteToken: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        hasSeenOnboarding: boolean;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    revokeAccess(accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        email: string;
        inviteToken: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        hasSeenOnboarding: boolean;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    setupAccount(inviteToken: string, password: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        email: string;
        inviteToken: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        hasSeenOnboarding: boolean;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    loginClient(email: string, password: string): Promise<{
        account: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            email: string;
            inviteToken: string | null;
            passwordHash: string | null;
            inviteExpires: Date | null;
            hasSeenOnboarding: boolean;
            notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
        };
        token: string;
    }>;
}
//# sourceMappingURL=ClientAuthService.d.ts.map