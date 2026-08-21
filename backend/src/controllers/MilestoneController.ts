import { Request, Response } from 'express';
import prisma from '../utils/db';

export class MilestoneController {
  public static async createMilestone(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { title, description, dueDate, targetDate, status } = req.body;
      const dateVal = targetDate || dueDate;
      
      const milestone = await prisma.milestone.create({
        data: {
          title,
          description,
          targetDate: dateVal ? new Date(dateVal) : null,
          status: status || 'Upcoming',
          clientVisible: false,
          projectId: projectId as string
        }
      });
      
      res.status(201).json(milestone);
    } catch (error) {
      console.error('Error creating milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateMilestone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, dueDate, targetDate, status, clientVisible, requiresApproval } = req.body;
      const dateVal = targetDate || dueDate;
      
      const milestone = await prisma.milestone.update({
        where: { id: id as string },
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
    } catch (error) {
      console.error('Error updating milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async deleteMilestone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.milestone.delete({ where: { id: id as string } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
