"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TierEngine_1 = require("../services/TierEngine");
const RiskService_1 = require("../services/RiskService");
const PlanValidator_1 = require("../utils/PlanValidator");
function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
    else {
        console.log(`✓ PASS: ${message}`);
    }
}
async function runUnitTests() {
    console.log('====================================================');
    console.log('      HAIZO WORKSPACE UNIT TEST SUITE EXECUTION     ');
    console.log('====================================================\n');
    const cutoffs = { simple: 8, standard: 16, complex: 26 };
    // --- TierEngine Unit Tests ---
    console.log('[1/3] Testing TierEngine Domain Logic...');
    // Test Unestimated fallback for all nulls
    const unestimatedRes = TierEngine_1.TierEngine.score({ users: null, data: null, compliance: null }, cutoffs);
    assert(unestimatedRes.tier === 'Unestimated', 'TierEngine returns Unestimated when all answers are null');
    assert(unestimatedRes.confidenceLow === true, 'TierEngine sets confidenceLow to true when all answers are null');
    // Test Simple Tier (< 8)
    const simpleRes = TierEngine_1.TierEngine.score({ users: 1, compliance: 1, urgency: 1 }, cutoffs);
    assert(simpleRes.tier === 'Simple', `TierEngine score for simple profile is Simple (Got: ${simpleRes.tier})`);
    // Test Standard Tier
    const standardRes = TierEngine_1.TierEngine.score({ users: 2, data: 2, compliance: 1, urgency: 2 }, cutoffs);
    assert(standardRes.tier === 'Standard' || standardRes.tier === 'Complex', `TierEngine evaluates standard workload correctly (Got: ${standardRes.tier})`);
    // Test Enterprise Tier (> 26)
    const enterpriseRes = TierEngine_1.TierEngine.score({ users: 3, data: 4, compliance: 4, scale: 4, urgency: 3, integrations: ['A', 'B', 'C'] }, cutoffs);
    assert(enterpriseRes.tier === 'Enterprise', `TierEngine evaluates high load as Enterprise (Got: ${enterpriseRes.tier})`);
    // --- RiskService Unit Tests ---
    console.log('\n[2/3] Testing RiskService Hypothetical Scoring Engine...');
    const baseRisk = { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 };
    // High pressure & integrations
    const riskRes1 = RiskService_1.RiskService.scoreHypothetical({ timelinePressure: 'High', integrations: 3 }, baseRisk);
    assert(riskRes1.schedule === 50, `Schedule risk correctly calculated with High timeline pressure (Expected 50, Got ${riskRes1.schedule})`);
    assert(riskRes1.budget === 54, `Budget risk correctly calculated with integrations load (Expected 54, Got ${riskRes1.budget})`);
    assert(riskRes1.scopeDrift === 25, `Scope drift risk correctly calculated (Expected 25, Got ${riskRes1.scopeDrift})`);
    // Capped at 100
    const riskResCapped = RiskService_1.RiskService.scoreHypothetical({ timelinePressure: 'High', integrations: 20, realTime: true, compliance: true, roles: 10 }, baseRisk);
    assert(riskResCapped.schedule <= 100, 'Risk scores are properly capped at 100');
    assert(riskResCapped.budget <= 100, 'Budget risk is properly capped at 100');
    assert(riskResCapped.communication <= 100, 'Communication risk is properly capped at 100');
    // --- PlanValidator Unit Tests ---
    console.log('\n[3/3] Testing PlanValidator EXPLAIN JSON Inspector...');
    const emptyPlan = PlanValidator_1.PlanValidator.validate(null);
    assert(emptyPlan.valid === false && emptyPlan.error === 'Plan is empty', 'PlanValidator flags empty input');
    const invalidPlan = PlanValidator_1.PlanValidator.validate({ wrongField: 123 });
    assert(invalidPlan.valid === false, 'PlanValidator flags invalid root structure');
    const validPlan = PlanValidator_1.PlanValidator.validate([{ Plan: { 'Node Type': 'Seq Scan', 'Relation Name': 'User' } }]);
    assert(validPlan.valid === true, 'PlanValidator accepts valid Postgres EXPLAIN JSON structure');
    console.log('\n====================================================');
    console.log('       🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!       ');
    console.log('====================================================');
}
runUnitTests().catch(err => {
    console.error('Unit tests crashed:', err);
    process.exit(1);
});
//# sourceMappingURL=unitRunner.js.map