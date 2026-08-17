export declare class ScenarioService {
    createScenario(data: {
        inputs: any;
        computedBand: string;
        estimateId?: string;
        inquiryId?: string;
        projectId?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        inputs: import("@prisma/client/runtime/library").JsonValue;
        computedBand: string;
        estimateId: string | null;
        inquiryId: string | null;
        projectId: string | null;
    }>;
    getScenariosByProject(projectId: string): Promise<{
        id: string;
        createdAt: Date;
        inputs: import("@prisma/client/runtime/library").JsonValue;
        computedBand: string;
        estimateId: string | null;
        inquiryId: string | null;
        projectId: string | null;
    }[]>;
}
//# sourceMappingURL=ScenarioService.d.ts.map