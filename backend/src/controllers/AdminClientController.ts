import { Request, Response } from 'express';
import prisma from '../utils/db';

export class AdminClientController {
  public static async getClients(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [clients, total] = await Promise.all([
        prisma.clientAccount.findMany({
          include: {
            project: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.clientAccount.count()
      ]);

      res.status(200).json({
        data: clients,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
