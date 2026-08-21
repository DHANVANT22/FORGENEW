import { Request, Response } from 'express';
import prisma from '../utils/db';

export class RiskAlertController {
  public static async snoozeAlert(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { axis, days } = req.body;

      if (!axis || typeof days !== 'number') {
        return res.status(400).json({ error: 'axis and days are required' });
      }

      const acknowledgedUntil = new Date(Date.now() + days * 24 * 3600 * 1000);

      const snooze = await prisma.riskAlertSnooze.create({
        data: {
          projectId: projectId as string,
          axis,
          acknowledgedUntil
        }
      });

      res.status(200).json(snooze);
    } catch (error) {
      console.error('Error snoozing alert:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
