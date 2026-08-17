import { Request, Response } from 'express';
import prisma from '../utils/db';

export class RiskOutcomeController {
  public static async logOutcome(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { snapshotId, actualOutcome, axis, impact } = req.body;

      if (!snapshotId || !actualOutcome) {
        return res.status(400).json({ error: 'snapshotId and actualOutcome are required' });
      }

      // Create the outcome
      const outcome = await prisma.riskPredictionOutcome.create({
        data: {
          projectId,
          snapshotId,
          actualOutcome,
          axis,
          impact
        }
      });

      // If axis and impact are provided, generate a new Risk Snapshot immediately
      if (axis && impact) {
        const currentSnapshot = await prisma.projectRiskSnapshot.findUnique({
          where: { id: snapshotId }
        });

        if (currentSnapshot && currentSnapshot.axisScores) {
          const scores: any = currentSnapshot.axisScores;
          
          // Apply penalty/impact to the specific axis
          if (axis === 'schedule' || axis === 'budget' || axis === 'communication' || axis === 'scopeDrift') {
            const newScore = Math.min(100, Math.max(0, (scores[axis] || 0) + impact));
            const newScores = { ...scores, [axis]: newScore };

            import('uuid').then(({ v4: uuidv4 }) => {
              prisma.projectRiskSnapshot.create({
                data: {
                  id: uuidv4(),
                  projectId,
                  axisScores: newScores,
                  causeSummary: `Adjusted by logged outcome: ${actualOutcome}`
                }
              }).catch(console.error);
            });
          }
        }
      }

      res.status(201).json(outcome);
    } catch (error) {
      console.error('Error logging outcome:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getOutcomes(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const outcomes = await prisma.riskPredictionOutcome.findMany({
        where: { projectId },
        orderBy: { recordedAt: 'desc' },
        include: {
          snapshot: true
        }
      });

      res.status(200).json(outcomes);
    } catch (error) {
      console.error('Error fetching outcomes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
