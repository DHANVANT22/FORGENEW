import { Response } from 'express';
import { ClientAuthRequest } from '../middleware/auth';
import prisma from '../utils/db';
import { io } from '../index';

export class ClientProjectController {
  public static async getProject(req: ClientAuthRequest, res: Response) {
    try {
      const projectId = req.client?.projectId;
      if (!projectId) {
        return res.status(400).json({ error: 'No project associated with this client' });
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          columns: {
            where: { clientVisible: true },
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
              },
            },
          },
          Milestone: {
            where: { clientVisible: true },
            orderBy: { targetDate: 'asc' },
          }
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.status(200).json(project);
    } catch (error) {
      console.error('Error fetching client project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async approveMilestone(req: ClientAuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const clientId = req.client?.id;
      const projectId = req.client?.projectId;

      if (!clientId || !projectId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const milestone = await prisma.milestone.findFirst({
        where: { id, projectId }
      });

      if (!milestone) {
        return res.status(404).json({ error: 'Milestone not found' });
      }

      if (milestone.status !== 'Current' || !milestone.requiresApproval) {
        return res.status(400).json({ error: 'Milestone is not eligible for approval' });
      }

      const updated = await prisma.milestone.update({
        where: { id },
        data: {
          approvedAt: new Date(),
          approvedByClientId: clientId
        }
      });

      // Log to ActivityEvent
      const event = await prisma.activityEvent.create({
        data: {
          id: Date.now().toString(),
          action: 'milestone_approved',
          entityType: 'Milestone',
          entityId: milestone.id,
          entityLabel: milestone.title,
          actorId: clientId,
          actorName: 'Client',
          path: `/projects/${projectId}?tab=milestones`
        }
      });

      // Emit socket event to admin
      io.to(`project_${projectId}`).emit('milestone_approved', {
        milestoneId: id,
        event
      });

      res.status(200).json(updated);
    } catch (error) {
      console.error('Error approving milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateOnboardingStatus(req: ClientAuthRequest, res: Response) {
    try {
      const clientId = req.client?.id;
      if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

      const updated = await prisma.clientAccount.update({
        where: { id: clientId },
        data: { hasSeenOnboarding: true }
      });
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating onboarding status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateNotificationPrefs(req: ClientAuthRequest, res: Response) {
    try {
      const clientId = req.client?.id;
      const { prefs } = req.body;
      if (!clientId) return res.status(401).json({ error: 'Unauthorized' });

      const updated = await prisma.clientAccount.update({
        where: { id: clientId },
        data: { notificationPrefs: prefs }
      });
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating notification prefs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
