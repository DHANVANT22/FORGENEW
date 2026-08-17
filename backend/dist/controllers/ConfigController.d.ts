import { Request, Response } from 'express';
export declare class ConfigController {
    static getTierWeights(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateTierWeights(req: Request, res: Response): Promise<void>;
    static getTierCutoffs(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateTierCutoffs(req: Request, res: Response): Promise<void>;
    static previewTierWeights(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ConfigController.d.ts.map