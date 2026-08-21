"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilestoneController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class MilestoneController {
    static async createMilestone(req, res) {
        try {
            const { projectId } = req.params;
            const { title, description, dueDate, targetDate, status } = req.body;
            const dateVal = targetDate || dueDate;
            const milestone = await db_1.default.milestone.create({
                data: {
                    title,
                    description,
                    targetDate: dateVal ? new Date(dateVal) : null,
                    status: status || 'Upcoming',
                    clientVisible: false,
                    projectId: projectId
                }
            });
            res.status(201).json(milestone);
        }
        catch (error) {
            console.error('Error creating milestone:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateMilestone(req, res) {
        try {
            const { id } = req.params;
            const { title, description, dueDate, targetDate, status, clientVisible, requiresApproval } = req.body;
            const dateVal = targetDate || dueDate;
            const milestone = await db_1.default.milestone.update({
                where: { id: id },
                data: {
                    title,
                    description,
                    targetDate: dateVal ? new Date(dateVal) : undefined,
                    status,
                    clientVisible,
                    requiresApproval
                }
            });
            res.status(200).json(milestone);
        }
        catch (error) {
            console.error('Error updating milestone:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async deleteMilestone(req, res) {
        try {
            const { id } = req.params;
            await db_1.default.milestone.delete({ where: { id: id } });
            res.status(204).send();
        }
        catch (error) {
            console.error('Error deleting milestone:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.MilestoneController = MilestoneController;
//# sourceMappingURL=MilestoneController.js.map