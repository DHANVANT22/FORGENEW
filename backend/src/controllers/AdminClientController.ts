import { Request, Response } from 'express';
import prisma from '../utils/db';
import bcrypt from 'bcrypt';

export class AdminClientController {
  public static async getClients(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const [clients, total] = await Promise.all([
        prisma.clientAccount.findMany({
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                progress: true
              }
            }
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

  public static async createClient(req: Request, res: Response) {
    try {
      const { email, password, name, companyName, projectId } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const existing = await prisma.clientAccount.findUnique({
        where: { email: email.toLowerCase().trim() }
      });

      if (existing) {
        return res.status(400).json({ error: 'Client account already exists.' });
      }

      const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('ClientPassword123!', 10);

      const client = await prisma.clientAccount.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name || 'Client User',
          companyName: companyName || null,
          passwordHash,
          projectId: projectId || null
        },
        include: {
          project: true
        }
      });

      res.status(201).json({ success: true, client });
    } catch (error: any) {
      console.error('Error creating client account:', error);
      res.status(500).json({ error: error.message || 'Failed to create client account' });
    }
  }
}
