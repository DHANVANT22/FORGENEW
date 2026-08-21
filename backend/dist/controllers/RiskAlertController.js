"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAlertController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class RiskAlertController {
    static async snoozeAlert(req, res) {
        try {
            const { projectId } = req.params;
            const { axis, days } = req.body;
            if (!axis || typeof days !== 'number') {
                return res.status(400).json({ error: 'axis and days are required' });
            }
            const acknowledgedUntil = new Date(Date.now() + days * 24 * 3600 * 1000);
            const snooze = await db_1.default.riskAlertSnooze.create({
                data: {
                    projectId: projectId,
                    axis,
                    acknowledgedUntil
                }
            });
            res.status(200).json(snooze);
        }
        catch (error) {
            console.error('Error snoozing alert:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.RiskAlertController = RiskAlertController;
//# sourceMappingURL=RiskAlertController.js.map