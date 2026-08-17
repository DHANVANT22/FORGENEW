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
            const { title, description, dueDate, status } = req.body;
            const milestone = await db_1.default.milestone.create({
                data: {
                    title,
                    description,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    status: status || 'Pending',
                    clientVisible: false,
                    projectId
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
            const { title, description, dueDate, status, clientVisible } = req.body;
            const milestone = await db_1.default.milestone.update({
                where: { id },
                data: {
                    title,
                    description,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    status,
                    clientVisible
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
            await db_1.default.milestone.delete({ where: { id } });
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