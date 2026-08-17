"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskService = void 0;
const db_1 = __importDefault(require("../utils/db"));
const notification_service_1 = require("./notification.service");
const uuid_1 = require("uuid");
class RiskService {
    /**
     * Pure function to calculate hypothetical risk based on scope inputs.
     * Does NOT write to the database.
     */
    static scoreHypothetical(inputs, baseRisk = { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 }) {
        // Use slider inputs for a hypothetical score
        let schedule = baseRisk.schedule;
        let budget = baseRisk.budget;
        let communication = baseRisk.communication;
        let scopeDrift = baseRisk.scopeDrift;
        // timelinePressure -> schedule & budget
        if (inputs.timelinePressure === 'High') {
            schedule += 40;
            budget += 20;
        }
        else if (inputs.timelinePressure === 'Medium') {
            schedule += 20;
            budget += 10;
        }
        // integrations -> budget & scopeDrift
        if (inputs.integrations) {
            budget += inputs.integrations * 8;
            scopeDrift += inputs.integrations * 5;
        }
        // realTime -> schedule & budget
        if (inputs.realTime) {
            schedule += 20;
            budget += 25;
        }
        // compliance -> budget & scopeDrift
        if (inputs.compliance) {
            budget += 20;
            scopeDrift += 15;
        }
        // roles -> communication & scopeDrift
        if (inputs.roles) {
            communication += inputs.roles * 10;
            scopeDrift += inputs.roles * 4;
        }
        return {
            schedule: Math.min(100, schedule),
            budget: Math.min(100, budget),
            communication: Math.min(100, communication),
            scopeDrift: Math.min(100, scopeDrift)
        };
    }
    static async computeAll() {
        const projects = await db_1.default.project.findMany({
            where: { status: { notIn: ['Completed', 'Archived'] } },
            include: {
                columns: { include: { tasks: true } },
                conversations: { include: { Message: { orderBy: { createdAt: 'desc' }, include: { User: true } } } },
                ProjectScopeBaseline: { orderBy: { capturedAt: 'desc' }, take: 1 },
                ProjectRiskSnapshot: { orderBy: { computedAt: 'desc' }, take: 1 }
            }
        });
        for (const project of projects) {
            let scheduleRisk = 10;
            let budgetRisk = 10;
            let communicationRisk = 10;
            let scopeDriftRisk = 10;
            const allTasks = project.columns.flatMap(c => c.tasks);
            const totalTasks = allTasks.length;
            const openTasks = allTasks.filter(t => !t.isCompleted);
            const completedTasks = allTasks.filter(t => t.isCompleted);
            // --- Schedule Axis ---
            const overdueTasks = openTasks.filter(t => t.dueDate && t.dueDate < new Date());
            const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 3600 * 1000);
            const recentlyCompleted = completedTasks.filter(t => t.updatedAt >= fourteenDaysAgo).length;
            const velocityPerDay = recentlyCompleted / 14;
            if (openTasks.length > 0) {
                let schedulePenalty = (overdueTasks.length / openTasks.length) * 40;
                if (project.endDate) {
                    const daysRemaining = (project.endDate.getTime() - Date.now()) / (1000 * 3600 * 24);
                    if (daysRemaining > 0 && velocityPerDay > 0) {
                        const estimatedDaysNeeded = openTasks.length / velocityPerDay;
                        if (estimatedDaysNeeded > daysRemaining) {
                            schedulePenalty += 30 * (estimatedDaysNeeded / daysRemaining);
                        }
                    }
                    else if (daysRemaining <= 0) {
                        schedulePenalty += 50;
                    }
                }
                scheduleRisk = Math.min(100, 10 + schedulePenalty);
            }
            // --- Budget Axis ---
            if (project.budgetAmount && project.estimatedHours && project.startDate && project.endDate) {
                const totalDuration = project.endDate.getTime() - project.startDate.getTime();
                const elapsed = Math.max(0, Date.now() - project.startDate.getTime());
                const timeRatio = Math.min(1, elapsed / totalDuration);
                const completionRatio = totalTasks > 0 ? (completedTasks.length / totalTasks) : 0;
                // Burn rate against real numeric budget (using timeRatio as a proxy for burn rate if budgetSpent isn't available)
                if (timeRatio > completionRatio + 0.1) {
                    budgetRisk = Math.min(100, 10 + ((timeRatio - completionRatio) * 100));
                }
            }
            else {
                budgetRisk = 50; // Moderate unknown risk if fields missing
            }
            // --- Communication Axis ---
            let lastClientMessage = null;
            let lastStaffReply = null;
            for (const conv of project.conversations) {
                for (const msg of conv.Message) {
                    if (msg.User?.role === 'DEV' || msg.User?.role === 'SUPER_ADMIN' || msg.User?.role === 'MANAGER') {
                        if (!lastStaffReply)
                            lastStaffReply = msg.createdAt;
                    }
                    else {
                        if (!lastClientMessage)
                            lastClientMessage = msg.createdAt;
                    }
                }
            }
            if (lastClientMessage && lastStaffReply && lastClientMessage > lastStaffReply) {
                const replyLatency = (Date.now() - lastClientMessage.getTime()) / (1000 * 3600); // hours
                if (replyLatency > 48)
                    communicationRisk += 40;
                else if (replyLatency > 24)
                    communicationRisk += 20;
            }
            else if (!lastClientMessage) {
                communicationRisk += 10;
            }
            // --- Scope Drift Axis ---
            const baseline = project.ProjectScopeBaseline[0];
            if (baseline) {
                const taskDiff = totalTasks - baseline.taskCount;
                if (taskDiff > 0) {
                    scopeDriftRisk = Math.min(100, 10 + ((taskDiff / baseline.taskCount) * 100));
                }
            }
            else {
                scopeDriftRisk = 50; // Unknown
            }
            // Exponential Moving Average
            let previousScores = { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 };
            if (project.ProjectRiskSnapshot[0]) {
                previousScores = project.ProjectRiskSnapshot[0].axisScores;
            }
            const ALPHA = 0.4;
            const scores = {
                schedule: Math.round((ALPHA * scheduleRisk) + ((1 - ALPHA) * (previousScores.schedule ?? 10))),
                budget: Math.round((ALPHA * budgetRisk) + ((1 - ALPHA) * (previousScores.budget ?? 10))),
                communication: Math.round((ALPHA * communicationRisk) + ((1 - ALPHA) * (previousScores.communication ?? 10))),
                scopeDrift: Math.round((ALPHA * scopeDriftRisk) + ((1 - ALPHA) * (previousScores.scopeDrift ?? 10)))
            };
            // Determine causeSummary
            let causeSummary = null;
            let worstAxis = Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b);
            if (worstAxis[1] > 30) {
                if (worstAxis[0] === 'schedule') {
                    if (overdueTasks.length > 0) {
                        causeSummary = `${overdueTasks.length} task(s) are overdue.`;
                    }
                    else if (project.endDate) {
                        causeSummary = 'Completion velocity is too slow to meet the deadline.';
                    }
                    else {
                        causeSummary = 'Schedule risk is elevated due to pending open tasks.';
                    }
                }
                else if (worstAxis[0] === 'budget') {
                    causeSummary = 'Time elapsed significantly outpaces task completion rate.';
                }
                else if (worstAxis[0] === 'communication') {
                    causeSummary = 'Significant delay in message responses between client and staff.';
                }
                else if (worstAxis[0] === 'scopeDrift') {
                    causeSummary = 'Task count has expanded beyond the initial baseline scope.';
                }
            }
            const snapshot = await db_1.default.projectRiskSnapshot.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    projectId: project.id,
                    axisScores: scores,
                    causeSummary
                }
            });
            // Threshold check and notification
            const WARNING_THRESHOLD = 75;
            const criticalAxes = Object.entries(scores).filter(([_, score]) => score >= WARNING_THRESHOLD);
            if (criticalAxes.length > 0) {
                // Fetch snoozed alerts for this project
                const snoozedAlerts = await db_1.default.riskAlertSnooze.findMany({
                    where: { projectId: project.id }
                });
                const activeCriticalAxes = criticalAxes.filter(([axis]) => {
                    const snooze = snoozedAlerts.find(s => s.axis === axis);
                    if (snooze && snooze.acknowledgedUntil > new Date()) {
                        return false; // Snoozed
                    }
                    return true; // Not snoozed
                });
                if (activeCriticalAxes.length > 0) {
                    const admin = await db_1.default.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
                    if (admin) {
                        await notification_service_1.NotificationService.sendNotification({
                            userId: admin.id,
                            type: 'risk.threshold_crossed',
                            title: `Risk Threshold Crossed: ${project.name}`,
                            message: `Project "${project.name}" has critical risk levels in: ${activeCriticalAxes.map(a => a[0]).join(', ')}`,
                            entityType: 'Project',
                            entityId: project.id
                        });
                    }
                }
            }
        }
    }
}
exports.RiskService = RiskService;
//# sourceMappingURL=RiskService.js.map