import { z } from 'zod';

export const BlogSchema = z.object({
  body: z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    content: z.string().min(10, "Content must be at least 10 characters"),
    authorId: z.string(),
    queryPlan: z.array(z.any()).optional(),
    queryPlanBefore: z.array(z.any()).optional()
  })
});

export const ClientAuthSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
  })
});

export const ClientInviteSchema = z.object({
  body: z.object({
    projectId: z.string().uuid("Invalid Project ID"),
    email: z.string().email("Invalid email address")
  })
});
