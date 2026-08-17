export declare class EstimateService {
    createEstimate(data: {
        answers: any;
        sourceIpHash: string;
    }): Promise<{
        axisScores: {
            roleComplexity: number;
            integrationLoad: number;
            realtimeDemand: number;
            complianceLoad: number;
        };
        similarProjectsCount: number;
        id: string;
        createdAt: Date;
        tier: string;
        confidenceLow: boolean;
        answers: import("@prisma/client/runtime/library").JsonValue;
        sourceIpHash: string;
        convertedInquiryId: string | null;
    }>;
    getEstimates(page?: number, limit?: number): Promise<{
        data: {
            id: string;
            createdAt: Date;
            tier: string;
            confidenceLow: boolean;
            answers: import("@prisma/client/runtime/library").JsonValue;
            sourceIpHash: string;
            convertedInquiryId: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}
//# sourceMappingURL=EstimateService.d.ts.map