import { Request, Response } from 'express';
import { EstimateService } from '../services/EstimateService';
import crypto from 'crypto';
import prisma from '../utils/db';

const estimateService = new EstimateService();

export class EstimateController {
  public static async createEstimate(req: Request, res: Response) {
    try {
      const { answers, website } = req.body;
      
      // Honeypot check
      if (website && website.trim() !== '') {
        return res.status(400).json({ error: 'Invalid submission' });
      }

      // Hash the IP address for deduplication
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const sourceIpHash = crypto.createHash('sha256').update(ip).digest('hex');

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const duplicate = await prisma.estimate.findFirst({
        where: {
          sourceIpHash,
          createdAt: { gte: tenMinutesAgo }
        }
      });

      if (duplicate) {
        return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'You recently submitted an estimate. Please wait.' } });
      }

      const estimate = await estimateService.createEstimate({ answers, sourceIpHash });
      res.status(201).json(estimate);
    } catch (error) {
      console.error('Error creating estimate:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getEstimates(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const estimates = await estimateService.getEstimates(page, limit);
      res.status(200).json(estimates);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async trackProgress(req: Request, res: Response) {
    try {
      const { sessionId, questionKey } = req.body;
      if (!sessionId || !questionKey) {
        return res.status(400).json({ error: 'Missing parameters' });
      }
      const event = await prisma.quizProgressEvent.create({
        data: {
          sessionId,
          questionKey
        }
      });
      res.status(201).json(event);
    } catch (error) {
      console.error('Error tracking progress:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getFunnelStats(req: Request, res: Response) {
    try {
      const events = await prisma.quizProgressEvent.findMany();
      const funnel: Record<string, number> = {};
      
      // Count unique sessions per question
      const seen = new Set<string>();
      events.forEach(e => {
        const k = `${e.questionKey}-${e.sessionId}`;
        if (!seen.has(k)) {
          seen.add(k);
          funnel[e.questionKey] = (funnel[e.questionKey] || 0) + 1;
        }
      });
      
      res.status(200).json(funnel);
    } catch (error) {
      console.error('Error fetching funnel stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getStaleEstimates(req: Request, res: Response) {
    try {
      const days = parseInt(req.query.days as string) || 14;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const staleEstimates = await prisma.estimate.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          Project: { none: {} }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      res.status(200).json(staleEstimates);
    } catch (error) {
      console.error('Error fetching stale estimates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
