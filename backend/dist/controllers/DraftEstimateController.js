"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DraftEstimateController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class DraftEstimateController {
    static async saveDraft(req, res) {
        try {
            const { sessionId, answers, step } = req.body;
            if (!sessionId || !answers || typeof step !== 'number') {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            const draft = await db_1.default.draftEstimate.upsert({
                where: { sessionId },
                update: { answers, step },
                create: { sessionId, answers, step }
            });
            res.status(200).json(draft);
        }
        catch (error) {
            console.error('Error saving draft:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getDraft(req, res) {
        try {
            const { sessionId } = req.params;
            const draft = await db_1.default.draftEstimate.findUnique({
                where: { sessionId: sessionId }
            });
            if (!draft) {
                return res.status(404).json({ error: 'Draft not found' });
            }
            res.status(200).json(draft);
        }
        catch (error) {
            console.error('Error fetching draft:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.DraftEstimateController = DraftEstimateController;
//# sourceMappingURL=DraftEstimateController.js.map