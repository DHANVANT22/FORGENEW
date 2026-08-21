export declare class ClientAuthService {
    signupClient(data: {
        name?: string;
        companyName?: string;
        email: string;
        password: string;
    }): Promise<{
        account: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            projectId: string | null;
            email: string;
            inviteToken: string | null;
            notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
            companyName: string | null;
            passwordHash: string | null;
            inviteExpires: Date | null;
            lastLoginAt: Date | null;
            hasSeenOnboarding: boolean;
        };
        token: string;
    }>;
    inviteClient(projectId: string, email: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        projectId: string | null;
        email: string;
        inviteToken: string | null;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
        companyName: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        lastLoginAt: Date | null;
        hasSeenOnboarding: boolean;
    }>;
    revokeAccess(accountId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        projectId: string | null;
        email: string;
        inviteToken: string | null;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
        companyName: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        lastLoginAt: Date | null;
        hasSeenOnboarding: boolean;
    }>;
    setupAccount(inviteToken: string, password: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        projectId: string | null;
        email: string;
        inviteToken: string | null;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
        companyName: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        lastLoginAt: Date | null;
        hasSeenOnboarding: boolean;
    }>;
    loginClient(email: string, password: string): Promise<{
        account: {
            project: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                clientId: string | null;
                budget: string | null;
                budgetAmount: import("@prisma/client/runtime/library").Decimal | null;
                estimatedHours: number | null;
                endDate: Date | null;
                progress: number;
                startDate: Date | null;
                status: string;
                pulseFinancialsVisible: boolean;
                sourceEstimateId: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string | null;
            projectId: string | null;
            email: string;
            inviteToken: string | null;
            notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
            companyName: string | null;
            passwordHash: string | null;
            inviteExpires: Date | null;
            lastLoginAt: Date | null;
            hasSeenOnboarding: boolean;
        };
        token: string;
    }>;
    getMe(accountId: string): Promise<{
        project: {
            PulseToken: {
                id: string;
                createdAt: Date;
                projectId: string;
                token: string;
                expiresAt: Date;
                lastViewedAt: Date | null;
                createdById: string;
            }[];
            columns: ({
                tasks: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                    startDate: Date | null;
                    order: number;
                    title: string;
                    dueDate: Date | null;
                    tags: string[];
                    columnId: string;
                    assigneeId: string | null;
                    delayReason: string | null;
                    isCompleted: boolean;
                    priority: string;
                }[];
            } & {
                id: string;
                name: string;
                projectId: string;
                order: number;
                clientVisible: boolean;
            })[];
            Milestone: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                description: string | null;
                status: string;
                clientVisible: boolean;
                title: string;
                targetDate: Date | null;
                completedAt: Date | null;
                requiresApproval: boolean;
                approvedAt: Date | null;
                approvedByClientId: string | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            clientId: string | null;
            budget: string | null;
            budgetAmount: import("@prisma/client/runtime/library").Decimal | null;
            estimatedHours: number | null;
            endDate: Date | null;
            progress: number;
            startDate: Date | null;
            status: string;
            pulseFinancialsVisible: boolean;
            sourceEstimateId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string | null;
        projectId: string | null;
        email: string;
        inviteToken: string | null;
        notificationPrefs: import("@prisma/client/runtime/library").JsonValue | null;
        companyName: string | null;
        passwordHash: string | null;
        inviteExpires: Date | null;
        lastLoginAt: Date | null;
        hasSeenOnboarding: boolean;
    }>;
}
//# sourceMappingURL=ClientAuthService.d.ts.map