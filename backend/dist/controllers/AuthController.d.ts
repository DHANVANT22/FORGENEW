import { Request, Response } from 'express';
export declare class AuthController {
    static adminLogin(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static verifyToken(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map