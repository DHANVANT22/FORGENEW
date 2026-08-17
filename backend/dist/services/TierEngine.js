"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TierEngine = void 0;
class TierEngine {
    static WEIGHTS = {
        users: {
            1: { roleComplexity: 1, integrationLoad: 0, realtimeDemand: 0, complianceLoad: 0 },
            2: { roleComplexity: 2, integrationLoad: 0, realtimeDemand: 1, complianceLoad: 1 },
            3: { roleComplexity: 4, integrationLoad: 0, realtimeDemand: 2, complianceLoad: 2 }
        },
        data: {
            0: { roleComplexity: 0, integrationLoad: 0, realtimeDemand: 0, complianceLoad: 0 },
            2: { roleComplexity: 0, integrationLoad: 3, realtimeDemand: 1, complianceLoad: 1 },
            4: { roleComplexity: 1, integrationLoad: 6, realtimeDemand: 3, complianceLoad: 3 }
        },
        compliance: {
            1: { roleComplexity: 0, integrationLoad: 0, realtimeDemand: 0, complianceLoad: 1 },
            2: { roleComplexity: 1, integrationLoad: 1, realtimeDemand: 0, complianceLoad: 4 },
            4: { roleComplexity: 2, integrationLoad: 2, realtimeDemand: 0, complianceLoad: 8 }
        },
        urgency: {
            1: { roleComplexity: 0, integrationLoad: 0, realtimeDemand: 0, complianceLoad: 0 },
            2: { roleComplexity: 1, integrationLoad: 1, realtimeDemand: 1, complianceLoad: 1 },
            3: { roleComplexity: 2, integrationLoad: 2, realtimeDemand: 2, complianceLoad: 2 }
        },
        scale: {
            1: { roleComplexity: 0, integrationLoad: 0, realtimeDemand: 1, complianceLoad: 0 },
            2: { roleComplexity: 1, integrationLoad: 1, realtimeDemand: 3, complianceLoad: 1 },
            4: { roleComplexity: 2, integrationLoad: 2, realtimeDemand: 6, complianceLoad: 2 }
        }
    };
    static score(answers, cutoffs) {
        let roleComplexity = 0;
        let integrationLoad = 0;
        let realtimeDemand = 0;
        let complianceLoad = 0;
        let allNotSure = true;
        let totalScore = 0;
        for (const [questionId, answerVal] of Object.entries(answers)) {
            if (answerVal !== null && questionId !== 'integrations') {
                allNotSure = false;
            }
            if (questionId === 'integrations' && Array.isArray(answerVal)) {
                // Each integration adds weight
                integrationLoad += answerVal.length * 2;
                continue;
            }
            const matrix = this.WEIGHTS[questionId];
            if (matrix && matrix[answerVal]) {
                roleComplexity += matrix[answerVal].roleComplexity;
                integrationLoad += matrix[answerVal].integrationLoad;
                realtimeDemand += matrix[answerVal].realtimeDemand;
                complianceLoad += matrix[answerVal].complianceLoad;
            }
        }
        totalScore = roleComplexity + integrationLoad + realtimeDemand + complianceLoad;
        const axisScores = { roleComplexity, integrationLoad, realtimeDemand, complianceLoad };
        if (allNotSure) {
            return { tier: 'Unestimated', confidenceLow: true, axisScores };
        }
        let tier = 'Standard';
        if (totalScore <= cutoffs.simple) {
            tier = 'Simple';
        }
        else if (totalScore <= cutoffs.standard) {
            tier = 'Standard';
        }
        else if (totalScore <= cutoffs.complex) {
            tier = 'Complex';
        }
        else {
            tier = 'Enterprise';
        }
        return { tier, confidenceLow: false, axisScores };
    }
}
exports.TierEngine = TierEngine;
//# sourceMappingURL=TierEngine.js.map