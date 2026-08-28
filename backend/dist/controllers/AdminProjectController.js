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
exports.AdminProjectController = void 0;
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../utils/db"));
class AdminProjectController {
    static async getProject(req, res) {
        try {
            const { id } = req.params;
            const project = await db_1.default.project.findUnique({
                where: { id: id },
                include: {
                    columns: {
                        orderBy: { order: 'asc' },
                        include: {
                            tasks: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    Milestone: {
                        orderBy: { targetDate: 'asc' },
                    },
                    PulseToken: true
                },
            });
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            res.status(200).json(project);
        }
        catch (error) {
            console.error('Error fetching admin project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async toggleColumnVisibility(req, res) {
        try {
            const { id, columnId } = req.params;
            const { clientVisible } = req.body;
            const column = await db_1.default.column.update({
                where: { id: columnId },
                data: { clientVisible }
            });
            await db_1.default.activityEvent.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    actorName: 'Admin',
                    action: clientVisible ? 'Made Column Visible' : 'Hid Column',
                    entityType: 'Column',
                    entityId: column.id,
                    entityLabel: column.name
                }
            });
            res.status(200).json(column);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async toggleMilestoneVisibility(req, res) {
        try {
            const { id, milestoneId } = req.params;
            const { clientVisible } = req.body;
            const milestone = await db_1.default.milestone.update({
                where: { id: milestoneId },
                data: { clientVisible }
            });
            await db_1.default.activityEvent.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    actorName: 'Admin',
                    action: clientVisible ? 'Made Milestone Visible' : 'Hid Milestone',
                    entityType: 'Milestone',
                    entityId: milestone.id,
                    entityLabel: milestone.title
                }
            });
            res.status(200).json(milestone);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async reorderTasks(req, res) {
        try {
            const { id } = req.params;
            const { taskId, destinationColumnId, newOrder } = req.body;
            const task = await db_1.default.task.update({
                where: { id: taskId },
                data: {
                    columnId: destinationColumnId,
                    order: newOrder
                }
            });
            // We could use a transaction to shift orders of other tasks, but for simplicity
            // in this demo we'll just update the dragged task and let clients re-sort.
            Promise.resolve().then(() => __importStar(require('../index'))).then(({ io }) => {
                io.to(`project_${id}`).emit('task_moved', {
                    taskId,
                    destinationColumnId,
                    newOrder
                });
            });
            res.status(200).json(task);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createProject(req, res) {
        try {
            const { name, tier, sourceEstimateId } = req.body;
            let initialBudgetAmount = 0;
            let initialEstimatedHours = 0;
            let projectTier = tier;
            if (sourceEstimateId) {
                const estimate = await db_1.default.estimate.findUnique({ where: { id: sourceEstimateId } });
                if (estimate) {
                    projectTier = estimate.tier;
                    // Simple heuristic for pre-filling
                    if (estimate.tier === 'Simple') {
                        initialBudgetAmount = 5000;
                        initialEstimatedHours = 40;
                    }
                    else if (estimate.tier === 'Standard') {
                        initialBudgetAmount = 15000;
                        initialEstimatedHours = 120;
                    }
                    else if (estimate.tier === 'Complex') {
                        initialBudgetAmount = 45000;
                        initialEstimatedHours = 320;
                    }
                    else if (estimate.tier === 'Enterprise') {
                        initialBudgetAmount = 100000;
                        initialEstimatedHours = 800;
                    }
                }
            }
            const project = await db_1.default.project.create({
                data: {
                    name: name || 'New AI Scoped Project',
                    status: 'Planning',
                    budgetAmount: initialBudgetAmount > 0 ? initialBudgetAmount : undefined,
                    estimatedHours: initialEstimatedHours > 0 ? initialEstimatedHours : undefined,
                    sourceEstimateId,
                    columns: {
                        create: [
                            { name: 'To Do', order: 0, clientVisible: true },
                            { name: 'In Progress', order: 1, clientVisible: true },
                            { name: 'Review', order: 2, clientVisible: false },
                            { name: 'Done', order: 3, clientVisible: true }
                        ]
                    }
                },
                include: { columns: true }
            });
            const defaultColumn = project.columns.find(c => c.order === 0);
            if (defaultColumn) {
                await db_1.default.task.create({
                    data: {
                        title: `Setup ${projectTier || 'Standard'} Environment`,
                        priority: projectTier === 'Enterprise' ? 'High' : 'Medium',
                        columnId: defaultColumn.id,
                        order: 0
                    }
                });
            }
            res.status(201).json(project);
        }
        catch (error) {
            console.error('Error creating project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getProjects(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const [projects, total] = await Promise.all([
                db_1.default.project.findMany({
                    orderBy: { updatedAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        ProjectRiskSnapshot: {
                            orderBy: { computedAt: 'desc' },
                            take: 1
                        }
                    }
                }),
                db_1.default.project.count()
            ]);
            res.status(200).json({
                data: projects,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Error fetching projects:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateProject(req, res) {
        try {
            const { id } = req.params;
            const { name, budgetAmount, estimatedHours, startDate, endDate, status } = req.body;
            const project = await db_1.default.project.update({
                where: { id: id },
                data: {
                    name,
                    budgetAmount,
                    estimatedHours,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    status
                }
            });
            res.status(200).json(project);
        }
        catch (error) {
            console.error('Error updating project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getRiskHistory(req, res) {
        try {
            const { id } = req.params;
            const history = await db_1.default.projectRiskSnapshot.findMany({
                where: { projectId: id },
                orderBy: { computedAt: 'asc' }
            });
            res.status(200).json(history);
        }
        catch (error) {
            console.error('Error fetching risk history:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async previewRisk(req, res) {
        try {
            const { id } = req.params;
            const inputs = req.body;
            const latestSnapshot = await db_1.default.projectRiskSnapshot.findFirst({
                where: { projectId: id },
                orderBy: { computedAt: 'desc' }
            });
            const baseRisk = latestSnapshot?.axisScores
                ? latestSnapshot.axisScores
                : { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 };
            // We need to import RiskService at the top of the file, but we can also do a dynamic import to avoid altering the top of the file right now
            const { RiskService } = await Promise.resolve().then(() => __importStar(require('../services/RiskService')));
            const scores = RiskService.scoreHypothetical(inputs, baseRisk);
            res.status(200).json(scores);
        }
        catch (error) {
            console.error('Error previewing risk:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updatePulseFinancialsVisibility(req, res) {
        try {
            const id = req.params.id;
            const { visible } = req.body;
            const project = await db_1.default.project.update({
                where: { id },
                data: { pulseFinancialsVisible: Boolean(visible) }
            });
            res.status(200).json(project);
        }
        catch (error) {
            console.error('Failed to update pulse financials visibility:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.AdminProjectController = AdminProjectController;
//# sourceMappingURL=AdminProjectController.js.map