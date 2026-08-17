import { Request, Response } from 'express';
import prisma from '../utils/db';

export class SearchController {
  public static async search(req: Request, res: Response) {
    try {
      const q = req.query.q as string || '';
      if (!q.trim()) {
        return res.status(200).json({ projects: [], clients: [], blogs: [] });
      }

      const [projects, clients, blogs] = await Promise.all([
        prisma.project.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          take: 5
        }),
        prisma.clientAccount.findMany({
          where: { email: { contains: q, mode: 'insensitive' } }, 
          take: 5
        }),
        prisma.blog.findMany({
          where: { title: { contains: q, mode: 'insensitive' } },
          take: 5
        })
      ]);

      res.status(200).json({
        projects,
        clients,
        blogs
      });
    } catch (error) {
      console.error('Error in search:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
