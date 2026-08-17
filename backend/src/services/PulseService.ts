import prisma from '../utils/db';
import crypto from 'crypto';

const snapshotCache = new Map<string, { data: any, expiresAt: number }>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export class PulseService {
  public async generateToken(projectId: string, createdById: string, expiresInDays: number = 30) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return prisma.pulseToken.create({
      data: {
        token,
        expiresAt,
        projectId,
        createdById,
      },
    });
  }

  public async rotateToken(projectId: string, createdById: string, expiresInDays: number = 30) {
    // Delete existing tokens for this project
    await prisma.pulseToken.deleteMany({
      where: { projectId }
    });
    // Generate a new one
    return this.generateToken(projectId, createdById, expiresInDays);
  }

  public async getSnapshot(token: string) {
    const now = Date.now();
    const cached = snapshotCache.get(token);
    if (cached && cached.expiresAt > now) {
      // Async update lastViewedAt without blocking
      prisma.pulseToken.update({
        where: { token },
        data: { lastViewedAt: new Date() }
      }).catch(console.error);
      return cached.data;
    }

    const pulseToken = await prisma.pulseToken.findUnique({
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

    // We'll just update the read receipt
    await prisma.pulseToken.update({
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
      } else {
        status = 'at risk';
      }
    }

    // Find next milestone
    const upcoming = p.Milestone.filter(m => !m.completedAt).sort((a, b) => {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return a.targetDate.getTime() - b.targetDate.getTime();
    });
    
    const nextMilestone = upcoming.length > 0 ? {
      title: upcoming[0].title,
      targetDate: upcoming[0].targetDate ? upcoming[0].targetDate.toLocaleDateString() : 'TBD'
    } : { title: 'None scheduled', targetDate: 'N/A' };

    // Coarse risk state (redacted numeric scores)
    let coarseState = 'Healthy';
    if (p.ProjectRiskSnapshot && p.ProjectRiskSnapshot.length > 0) {
       const scores: any = p.ProjectRiskSnapshot[0].axisScores;
       const maxScore = Math.max(
         scores.schedule ?? 0, 
         scores.budget ?? 0, 
         scores.communication ?? 0, 
         scores.scopeDrift ?? 0
       );
       if (maxScore >= 75) coarseState = 'Needs Attention';
       else if (maxScore >= 40) coarseState = 'Monitoring';
    }

    // Changelog & Velocity (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentCompletedTasks = allTasks.filter(t => t.isCompleted && t.updatedAt && new Date(t.updatedAt) > sevenDaysAgo);
    const changelog = recentCompletedTasks.map(t => ({
      title: t.title,
      completedAt: t.updatedAt
    })).sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    // Velocity sparkline (tasks per day for the last 7 days)
    const velocity = Array(7).fill(0);
    recentCompletedTasks.forEach(t => {
      const diffTime = Math.abs(new Date().getTime() - new Date(t.updatedAt!).getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        velocity[6 - diffDays]++; // index 6 is today, 0 is 7 days ago
      }
    });

    const payload: any = {
      projectName: p.name,
      phase: p.status,
      completionRate,
      status,
      nextMilestone,
      coarseState,
      changelog,
      velocity
    };

    if (p.pulseFinancialsVisible) {
      payload.budgetAmount = p.budgetAmount;
      payload.budget = p.budget;
    }

    snapshotCache.set(token, {
      data: payload,
      expiresAt: Date.now() + CACHE_TTL_MS
    });

    return payload;
  }
}
