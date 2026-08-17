import { Request, Response } from 'express';
import prisma from '../utils/db';

export class MilestoneController {
  public static async createMilestone(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { title, description, dueDate, status } = req.body;
      
      const milestone = await prisma.milestone.create({
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
    } catch (error) {
      console.error('Error creating milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateMilestone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, dueDate, status, clientVisible } = req.body;
      
      const milestone = await prisma.milestone.update({
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
    } catch (error) {
      console.error('Error updating milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async deleteMilestone(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.milestone.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
