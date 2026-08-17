import { Request, Response } from 'express';
import prisma from '../utils/db';
import { TierEngine } from '../services/TierEngine';

export class ConfigController {
  static async getTierWeights(req: Request, res: Response) {
    try {
      let config = await prisma.config.findUnique({
        where: { key: 'tier-weights' }
      });
      
      if (!config) {
        // Return defaults if not set
        return res.json({
          Simple: 1,
          Standard: 2,
          Complex: 4,
          Enterprise: 8
        });
      }
      
      res.json(config.value);
    } catch (error) {
      console.error('Error fetching tier weights:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateTierWeights(req: Request, res: Response) {
    try {
      const weights = req.body;
      
      const config = await prisma.config.upsert({
        where: { key: 'tier-weights' },
        update: { value: weights },
        create: {
          key: 'tier-weights',
          value: weights
        }
      });
      
      res.json(config.value);
    } catch (error) {
      console.error('Error updating tier weights:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getTierCutoffs(req: Request, res: Response) {
    try {
      let config = await prisma.config.findUnique({
        where: { key: 'tier_cutoffs' }
      });
      
      if (!config) {
        return res.json({ simple: 8, standard: 16, complex: 26 });
      }
      
      res.json(config.value);
    } catch (error) {
      console.error('Error fetching tier cutoffs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateTierCutoffs(req: Request, res: Response) {
    try {
      const cutoffs = req.body;
      
      const config = await prisma.config.upsert({
        where: { key: 'tier_cutoffs' },
        update: { value: cutoffs },
        create: {
          key: 'tier_cutoffs',
          value: cutoffs
        }
      });
      
      res.json(config.value);
    } catch (error) {
      console.error('Error updating tier cutoffs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async previewTierWeights(req: Request, res: Response) {
    try {
      const { cutoffs } = req.body;
      
      const estimates = await prisma.estimate.findMany();
      const shifts: Record<string, number> = {};

      for (const est of estimates) {
        if (!est.answers) continue;
        
        const oldTier = est.tier;
        const result = TierEngine.score(est.answers as Record<string, any>, cutoffs);
        const newTier = result.tier;
        
        if (oldTier !== newTier) {
          const shiftKey = `${oldTier} -> ${newTier}`;
          shifts[shiftKey] = (shifts[shiftKey] || 0) + 1;
        }
      }

      res.status(200).json({ shifts });
    } catch (error) {
      console.error('Error previewing tier weights:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
