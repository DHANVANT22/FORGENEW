import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class ControlCentreController {
    static createIdea(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static getIdeas(req: Request, res: Response): Promise<void>;
    static getIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateIdea(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static getRevisions(req: Request, res: Response): Promise<void>;
    static getRevision(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static exportIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ControlCentreController.d.ts.map