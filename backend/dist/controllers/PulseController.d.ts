import { Request, Response } from 'express';
import { AdminAuthRequest } from '../middleware/auth';
export declare class PulseController {
    static generateToken(req: AdminAuthRequest, res: Response): Promise<void>;
    static rotateToken(req: AdminAuthRequest, res: Response): Promise<void>;
    static getSnapshot(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=PulseController.d.ts.map