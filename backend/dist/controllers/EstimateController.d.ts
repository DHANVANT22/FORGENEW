import { Request, Response } from 'express';
export declare class EstimateController {
    static createEstimate(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getEstimates(req: Request, res: Response): Promise<void>;
    static trackProgress(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getFunnelStats(req: Request, res: Response): Promise<void>;
    static getStaleEstimates(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=EstimateController.d.ts.map