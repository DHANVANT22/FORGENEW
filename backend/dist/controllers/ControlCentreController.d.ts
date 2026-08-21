import { Request, Response } from 'express';
export declare class ControlCentreController {
    static createIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getIdeas(req: Request, res: Response): Promise<void>;
    static getIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getRevisions(req: Request, res: Response): Promise<void>;
    static getRevision(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static exportIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getProviderStatus(req: Request, res: Response): Promise<void>;
    static getIdeaChat(req: Request, res: Response): Promise<void>;
    static chatIdea(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ControlCentreController.d.ts.map