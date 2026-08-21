"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskOutcomeController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class RiskOutcomeController {
    static async logOutcome(req, res) {
        try {
            const { projectId } = req.params;
            const { snapshotId, actualOutcome, axis, impact } = req.body;
            if (!snapshotId || !actualOutcome) {
                return res.status(400).json({ error: 'snapshotId and actualOutcome are required' });
            }
            // Create the outcome
            const outcome = await db_1.default.riskPredictionOutcome.create({
                data: {
                    projectId: projectId,
                    snapshotId,
                    actualOutcome,
                    axis,
                    impact
                }
            });
            // If axis and impact are provided, generate a new Risk Snapshot immediately
            if (axis && impact) {
                const currentSnapshot = await db_1.default.projectRiskSnapshot.findUnique({
                    where: { id: snapshotId }
                });
                if (currentSnapshot && currentSnapshot.axisScores) {
                    const scores = currentSnapshot.axisScores;
                    // Apply penalty/impact to the specific axis
                    if (axis === 'schedule' || axis === 'budget' || axis === 'communication' || axis === 'scopeDrift') {
                        const newScore = Math.min(100, Math.max(0, (scores[axis] || 0) + impact));
                        const newScores = { ...scores, [axis]: newScore };
                        Promise.resolve().then(() => __importStar(require('uuid'))).then(({ v4: uuidv4 }) => {
                            db_1.default.projectRiskSnapshot.create({
                                data: {
                                    id: uuidv4(),
                                    projectId: projectId,
                                    axisScores: newScores,
                                    causeSummary: `Adjusted by logged outcome: ${actualOutcome}`
                                }
                            }).catch(console.error);
                        });
                    }
                }
            }
            res.status(201).json(outcome);
        }
        catch (error) {
            console.error('Error logging outcome:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getOutcomes(req, res) {
        try {
            const { projectId } = req.params;
            const outcomes = await db_1.default.riskPredictionOutcome.findMany({
                where: { projectId: projectId },
                orderBy: { recordedAt: 'desc' },
                include: {
                    snapshot: true
                }
            });
            res.status(200).json(outcomes);
        }
        catch (error) {
            console.error('Error fetching outcomes:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.RiskOutcomeController = RiskOutcomeController;
//# sourceMappingURL=RiskOutcomeController.js.map