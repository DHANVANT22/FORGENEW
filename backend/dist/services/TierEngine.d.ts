export declare class TierEngine {
    private static readonly WEIGHTS;
    static score(answers: Record<string, any>, cutoffs: {
        simple: number;
        standard: number;
        complex: number;
    }): {
        tier: string;
        confidenceLow: boolean;
        axisScores: {
            roleComplexity: number;
            integrationLoad: number;
            realtimeDemand: number;
            complianceLoad: number;
        };
    };
}
//# sourceMappingURL=TierEngine.d.ts.map