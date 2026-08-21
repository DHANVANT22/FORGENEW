export declare class PulseService {
    generateToken(projectId: string, createdById: string, expiresInDays?: number): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        token: string;
        expiresAt: Date;
        lastViewedAt: Date | null;
        createdById: string;
    }>;
    rotateToken(projectId: string, createdById: string, expiresInDays?: number): Promise<{
        id: string;
        createdAt: Date;
        projectId: string;
        token: string;
        expiresAt: Date;
        lastViewedAt: Date | null;
        createdById: string;
    }>;
    getSnapshot(token: string): Promise<any>;
}
//# sourceMappingURL=PulseService.d.ts.map