export class TierEngine {
  private static readonly WEIGHTS: Record<string, Record<number, { roleComplexity: number; integrationLoad: number; realtimeDemand: number; complianceLoad: number; }>> = {
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

  public static score(answers: Record<string, any>, cutoffs: { simple: number, standard: number, complex: number }): { tier: string; confidenceLow: boolean; axisScores: { roleComplexity: number; integrationLoad: number; realtimeDemand: number; complianceLoad: number; } } {
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
      if (matrix && matrix[answerVal as number]) {
        roleComplexity += matrix[answerVal as number].roleComplexity;
        integrationLoad += matrix[answerVal as number].integrationLoad;
        realtimeDemand += matrix[answerVal as number].realtimeDemand;
        complianceLoad += matrix[answerVal as number].complianceLoad;
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
    } else if (totalScore <= cutoffs.standard) {
      tier = 'Standard';
    } else if (totalScore <= cutoffs.complex) {
      tier = 'Complex';
    } else {
      tier = 'Enterprise';
    }

    return { tier, confidenceLow: false, axisScores };
  }
}
