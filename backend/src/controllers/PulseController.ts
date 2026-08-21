import { Request, Response } from 'express';
import { PulseService } from '../services/PulseService';
import { AdminAuthRequest } from '../middleware/auth';

const pulseService = new PulseService();

export class PulseController {
  public static async generateToken(req: AdminAuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const createdById = req.admin?.id || (req as any).user?.id || 'demo-admin';
      
      const token = await pulseService.generateToken(id, createdById, 30);
      res.status(201).json(token);
    } catch (error) {
      console.error('Pulse token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async rotateToken(req: AdminAuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const createdById = req.admin?.id || (req as any).user?.id || 'demo-admin';

      const token = await pulseService.rotateToken(id, createdById, 30);
      res.status(201).json(token);
    } catch (error) {
      console.error('Pulse rotate error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getSnapshot(req: Request, res: Response) {
    try {
      const token = req.params.token as string;
      const snapshot = await pulseService.getSnapshot(token);
      
      if (!snapshot) {
        return res.status(404).json({ error: 'Token not found or expired' });
      }

      res.status(200).json(snapshot);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
