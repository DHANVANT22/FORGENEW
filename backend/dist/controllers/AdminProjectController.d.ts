import { Request, Response } from 'express';
export declare class AdminProjectController {
    static getProject(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static toggleColumnVisibility(req: Request, res: Response): Promise<void>;
    static toggleMilestoneVisibility(req: Request, res: Response): Promise<void>;
    static reorderTasks(req: Request, res: Response): Promise<void>;
    static createProject(req: Request, res: Response): Promise<void>;
    static getProjects(req: Request, res: Response): Promise<void>;
    static updateProject(req: Request, res: Response): Promise<void>;
    static getRiskHistory(req: Request, res: Response): Promise<void>;
    static previewRisk(req: Request, res: Response): Promise<void>;
    static updatePulseFinancialsVisibility(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AdminProjectController.d.ts.map