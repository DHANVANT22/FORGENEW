import { Request, Response } from 'express';
import prisma from '../utils/db';

export class BlogController {
  public static async createBlog(req: Request, res: Response) {
    try {
      const { title, content, queryPlan, queryPlanBefore, authorId, tags = [] } = req.body;
      
      let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!baseSlug) baseSlug = 'blog-post';
      let slug = baseSlug;
      let counter = 2;
      while (true) {
        const existing = await prisma.blog.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      const blog = await prisma.blog.create({
        data: {
          id: Date.now().toString(),
          title,
          content,
          queryPlan,
          queryPlanBefore,
          authorId,
          slug,
          tags,
          published: true,
          updatedAt: new Date()
        }
      });
      
      res.status(201).json(blog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getBlogBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const blog = await prisma.blog.findUnique({
        where: { slug: slug as string }
      });

      if (!blog) {
        return res.status(404).json({ error: 'Blog not found' });
      }

      res.json(blog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getBlogs(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const tag = req.query.tag as string;
      const skip = (page - 1) * limit;

      let whereClause: any = { published: true };
      
      if (search) {
        whereClause.title = { contains: search, mode: 'insensitive' };
      }
      
      if (tag) {
        whereClause.tags = { has: tag };
      }

      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.blog.count({ where: whereClause })
      ]);

      res.json({
        data: blogs,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateBlog(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, content, queryPlan, queryPlanBefore, published, tags } = req.body;
      
      const { PlanValidator } = await import('../utils/PlanValidator');
      
      if (queryPlan) {
        const validation = PlanValidator.validate(queryPlan);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
      }

      if (queryPlanBefore) {
        const validation = PlanValidator.validate(queryPlanBefore);
        if (!validation.valid) {
          return res.status(400).json({ error: validation.error });
        }
      }

      const updateData: any = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (queryPlan !== undefined) updateData.queryPlan = queryPlan;
      if (queryPlanBefore !== undefined) updateData.queryPlanBefore = queryPlanBefore;
      if (published !== undefined) updateData.published = published;
      if (tags !== undefined) updateData.tags = tags;

      const blog = await prisma.blog.update({
        where: { id: id as string },
        data: updateData
      });
      
      res.status(200).json(blog);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
