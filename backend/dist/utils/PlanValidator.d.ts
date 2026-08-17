export declare class PlanValidator {
    /**
     * Validates that the provided JSON is a valid Postgres EXPLAIN (JSON) plan structure.
     */
    static validate(plan: any): {
        valid: boolean;
        error?: string;
    };
}
//# sourceMappingURL=PlanValidator.d.ts.map