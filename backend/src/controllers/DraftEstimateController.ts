import { Request, Response } from 'express';
import prisma from '../utils/db';

export class DraftEstimateController {
  public static async saveDraft(req: Request, res: Response) {
    try {
      const { sessionId, answers, step } = req.body;
      if (!sessionId || !answers || typeof step !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const draft = await prisma.draftEstimate.upsert({
        where: { sessionId },
        update: { answers, step },
        create: { sessionId, answers, step }
      });

      res.status(200).json(draft);
    } catch (error) {
      console.error('Error saving draft:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getDraft(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const draft = await prisma.draftEstimate.findUnique({
        where: { sessionId }
      });

      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }

      res.status(200).json(draft);
    } catch (error) {
      console.error('Error fetching draft:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
