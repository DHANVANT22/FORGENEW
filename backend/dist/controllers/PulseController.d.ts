import { Request, Response } from 'express';
export declare class PulseController {
    static generateToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static rotateToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getSnapshot(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=PulseController.d.ts.map