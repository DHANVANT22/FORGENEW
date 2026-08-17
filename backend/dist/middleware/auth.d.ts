import { Request, Response, NextFunction } from 'express';
export declare const requireAdminAuth: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export interface ClientAuthRequest extends Request {
    client?: {
        id: string;
        projectId: string;
    };
}
export declare const requireClientAuth: (req: ClientAuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map