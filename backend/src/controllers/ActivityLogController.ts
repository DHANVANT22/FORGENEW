import { Request, Response } from 'express';
import prisma from '../utils/db';

export class ActivityLogController {
  public static async getActivityLog(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.activityEvent.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.activityEvent.count()
      ]);

      res.status(200).json({
        data: logs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching activity log:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
