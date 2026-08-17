import { Request, Response } from 'express';
import prisma from '../utils/db';

export class AdminProjectController {
  public static async getProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await prisma.project.findUnique({
        where: { id },
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
    } catch (error) {
      console.error('Error fetching admin project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async toggleColumnVisibility(req: Request, res: Response) {
    try {
      const { id, columnId } = req.params;
      const { clientVisible } = req.body;
      
      const column = await prisma.column.update({
        where: { id: columnId },
        data: { clientVisible }
      });

      await prisma.activityEvent.create({
        data: {
          id: Date.now().toString(),
          actorName: 'Admin',
          action: clientVisible ? 'Made Column Visible' : 'Hid Column',
          entityType: 'Column',
          entityId: column.id,
          entityLabel: column.name
        }
      });
      
      res.status(200).json(column);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async toggleMilestoneVisibility(req: Request, res: Response) {
    try {
      const { id, milestoneId } = req.params;
      const { clientVisible } = req.body;
      
      const milestone = await prisma.milestone.update({
        where: { id: milestoneId },
        data: { clientVisible }
      });

      await prisma.activityEvent.create({
        data: {
          id: Date.now().toString(),
          actorName: 'Admin',
          action: clientVisible ? 'Made Milestone Visible' : 'Hid Milestone',
          entityType: 'Milestone',
          entityId: milestone.id,
          entityLabel: milestone.title
        }
      });
      
      res.status(200).json(milestone);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async reorderTasks(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { taskId, destinationColumnId, newOrder } = req.body;
      
      const task = await prisma.task.update({
        where: { id: taskId },
        data: {
          columnId: destinationColumnId,
          order: newOrder
        }
      });
      
      // We could use a transaction to shift orders of other tasks, but for simplicity
      // in this demo we'll just update the dragged task and let clients re-sort.
      
      import('../index').then(({ io }) => {
        io.to(`project_${id}`).emit('task_moved', {
          taskId,
          destinationColumnId,
          newOrder
        });
      });

      res.status(200).json(task);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async createProject(req: Request, res: Response) {
    try {
      const { name, tier, sourceEstimateId } = req.body;
      
      let initialBudgetAmount = 0;
      let initialEstimatedHours = 0;
      let projectTier = tier;

      if (sourceEstimateId) {
        const estimate = await prisma.estimate.findUnique({ where: { id: sourceEstimateId } });
        if (estimate) {
          projectTier = estimate.tier;
          // Simple heuristic for pre-filling
          if (estimate.tier === 'Simple') { initialBudgetAmount = 5000; initialEstimatedHours = 40; }
          else if (estimate.tier === 'Standard') { initialBudgetAmount = 15000; initialEstimatedHours = 120; }
          else if (estimate.tier === 'Complex') { initialBudgetAmount = 45000; initialEstimatedHours = 320; }
          else if (estimate.tier === 'Enterprise') { initialBudgetAmount = 100000; initialEstimatedHours = 800; }
        }
      }
      
      const project = await prisma.project.create({
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
        await prisma.task.create({
          data: {
            title: `Setup ${projectTier || 'Standard'} Environment`,
            priority: projectTier === 'Enterprise' ? 'High' : 'Medium',
            columnId: defaultColumn.id,
            order: 0
          }
        });
      }

      res.status(201).json(project);
    } catch (error) {
      console.error('Error creating project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getProjects(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [projects, total] = await Promise.all([
        prisma.project.findMany({
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
        prisma.project.count()
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
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, budgetAmount, estimatedHours, startDate, endDate, status } = req.body;
      
      const project = await prisma.project.update({
        where: { id },
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
    } catch (error) {
      console.error('Error updating project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getRiskHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const history = await prisma.projectRiskSnapshot.findMany({
        where: { projectId: id },
        orderBy: { computedAt: 'asc' }
      });
      res.status(200).json(history);
    } catch (error) {
      console.error('Error fetching risk history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async previewRisk(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const inputs = req.body;
      
      const latestSnapshot = await prisma.projectRiskSnapshot.findFirst({
        where: { projectId: id },
        orderBy: { computedAt: 'desc' }
      });
      
      const baseRisk = latestSnapshot?.axisScores 
        ? (latestSnapshot.axisScores as any)
        : { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 };

      // We need to import RiskService at the top of the file, but we can also do a dynamic import to avoid altering the top of the file right now
      const { RiskService } = await import('../services/RiskService');
      const scores = RiskService.scoreHypothetical(inputs, baseRisk);
      res.status(200).json(scores);
    } catch (error) {
      console.error('Error previewing risk:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  public static async updatePulseFinancialsVisibility(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { visible } = req.body;

      const project = await prisma.project.update({
        where: { id },
        data: { pulseFinancialsVisible: Boolean(visible) }
      });

      res.status(200).json(project);
    } catch (error) {
      console.error('Failed to update pulse financials visibility:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
