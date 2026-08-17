import { Request, Response } from 'express';
export declare class BlogController {
    static createBlog(req: Request, res: Response): Promise<void>;
    static getBlogBySlug(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getBlogs(req: Request, res: Response): Promise<void>;
    static updateBlog(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=BlogController.d.ts.map