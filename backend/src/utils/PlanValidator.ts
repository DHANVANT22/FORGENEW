export class PlanValidator {
  /**
   * Validates that the provided JSON is a valid Postgres EXPLAIN (JSON) plan structure.
   */
  public static validate(plan: any): { valid: boolean; error?: string } {
    if (!plan) return { valid: false, error: 'Plan is empty' };
    
    // Postgres EXPLAIN format is usually an array with one object containing a 'Plan' node
    let root = plan;
    if (Array.isArray(plan) && plan.length > 0) {
      root = plan[0];
    }
    
    if (!root || !root.Plan) {
      return { valid: false, error: 'Invalid structure: missing root Plan node' };
    }
    
    const nodeType = root.Plan['Node Type'];
    if (!nodeType || typeof nodeType !== 'string') {
      return { valid: false, error: 'Invalid structure: missing or invalid Node Type in root Plan' };
    }
    
    return { valid: true };
  }
}
