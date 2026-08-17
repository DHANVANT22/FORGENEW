"use strict";
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
            const { snapshotId, actualOutcome } = req.body;
            if (!snapshotId || !actualOutcome) {
                return res.status(400).json({ error: 'snapshotId and actualOutcome are required' });
            }
            const outcome = await db_1.default.riskPredictionOutcome.create({
                data: {
                    projectId,
                    snapshotId,
                    actualOutcome
                }
            });
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
                where: { projectId },
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