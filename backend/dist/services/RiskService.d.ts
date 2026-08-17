export interface RiskInputs {
    roles?: number;
    integrations?: number;
    realTime?: boolean;
    compliance?: boolean;
    timelinePressure?: string;
}
export declare class RiskService {
    /**
     * Pure function to calculate hypothetical risk based on scope inputs.
     * Does NOT write to the database.
     */
    static scoreHypothetical(inputs: RiskInputs, baseRisk?: {
        schedule: number;
        budget: number;
        communication: number;
        scopeDrift: number;
    }): {
        schedule: number;
        budget: number;
        communication: number;
        scopeDrift: number;
    };
    static computeAll(): Promise<void>;
}
//# sourceMappingURL=RiskService.d.ts.map