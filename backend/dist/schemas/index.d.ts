import { z } from 'zod';
export declare const BlogSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        content: z.ZodString;
        authorId: z.ZodString;
        queryPlan: z.ZodOptional<z.ZodArray<z.ZodAny>>;
        queryPlanBefore: z.ZodOptional<z.ZodArray<z.ZodAny>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ClientAuthSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const ClientInviteSchema: z.ZodObject<{
    body: z.ZodObject<{
        projectId: z.ZodString;
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=index.d.ts.map