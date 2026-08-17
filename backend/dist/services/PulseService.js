"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulseService = void 0;
const db_1 = __importDefault(require("../utils/db"));
const crypto_1 = __importDefault(require("crypto"));
class PulseService {
    async generateToken(projectId, createdById, expiresInDays = 30) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        return db_1.default.pulseToken.create({
            data: {
                token,
                expiresAt,
                projectId,
                createdById,
            },
        });
    }
    async rotateToken(projectId, createdById, expiresInDays = 30) {
        // Delete existing tokens for this project
        await db_1.default.pulseToken.deleteMany({
            where: { projectId }
        });
        // Generate a new one
        return this.generateToken(projectId, createdById, expiresInDays);
    }
    async getSnapshot(token) {
        const pulseToken = await db_1.default.pulseToken.findUnique({
            where: { token },
            include: {
                project: {
                    include: {
                        columns: {
                            include: {
                                tasks: true,
                            },
                        },
                        Milestone: true,
                        ProjectRiskSnapshot: {
                            orderBy: { computedAt: 'desc' },
                            take: 1,
                        },
                    },
                },
            },
        });
        if (!pulseToken || pulseToken.expiresAt < new Date()) {
            return null;
        }
        // Rate limiting: 5 views per minute max? Wait, simpler: check if viewed recently (anti-abuse)
        // Here we'll just update the read receipt
        await db_1.default.pulseToken.update({
            where: { id: pulseToken.id },
            data: { lastViewedAt: new Date() }
        });
        const p = pulseToken.project;
        const allTasks = p.columns.flatMap(c => c.tasks);
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.isCompleted).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        // Dynamic status computation
        const openTasks = allTasks.filter(t => !t.isCompleted);
        const overdueTasks = openTasks.filter(t => t.dueDate && t.dueDate < new Date()).length;
        let status = 'on track';
        if (overdueTasks > 0) {
            if (overdueTasks > openTasks.length * 0.2) {
                status = 'delayed';
            }
            else {
                status = 'at risk';
            }
        }
        // Find next milestone
        const upcoming = p.Milestone.filter(m => !m.completedAt).sort((a, b) => {
            if (!a.targetDate)
                return 1;
            if (!b.targetDate)
                return -1;
            return a.targetDate.getTime() - b.targetDate.getTime();
        });
        const nextMilestone = upcoming.length > 0 ? {
            title: upcoming[0].title,
            targetDate: upcoming[0].targetDate ? upcoming[0].targetDate.toLocaleDateString() : 'TBD'
        } : { title: 'None scheduled', targetDate: 'N/A' };
        // Coarse risk state (redacted numeric scores)
        let coarseState = 'Healthy';
        if (p.ProjectRiskSnapshot && p.ProjectRiskSnapshot.length > 0) {
            const scores = p.ProjectRiskSnapshot[0].axisScores;
            const maxScore = Math.max(scores.schedule ?? 0, scores.budget ?? 0, scores.communication ?? 0, scores.scopeDrift ?? 0);
            if (maxScore >= 75)
                coarseState = 'Needs Attention';
            else if (maxScore >= 40)
                coarseState = 'Monitoring';
        }
        // Changelog & Velocity (Last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentCompletedTasks = allTasks.filter(t => t.isCompleted && t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo);
        const changelog = recentCompletedTasks.map(t => ({
            title: t.title,
            completedAt: t.updatedAt
        })).sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        // Velocity sparkline (tasks per day for the last 7 days)
        const velocity = Array(7).fill(0);
        recentCompletedTasks.forEach(t => {
            const diffTime = Math.abs(new Date().getTime() - new Date(t.updatedAt).getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                velocity[6 - diffDays]++; // index 6 is today, 0 is 7 days ago
            }
        });
        return {
            projectName: p.name,
            phase: p.status,
            completionRate,
            status,
            nextMilestone,
            coarseState,
            changelog,
            velocity
        };
    }
}
exports.PulseService = PulseService;
//# sourceMappingURL=PulseService.js.map