import { Request, Response, NextFunction } from 'express';
export interface AdminAuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        role: string;
    };
    admin?: {
        id: string;
        name: string;
        role: string;
    };
}
export declare const requireAdminAuth: (req: AdminAuthRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export interface ClientAuthRequest extends Request {
    client?: {
        id: string;
        projectId: string;
    };
}
export declare const requireClientAuth: (req: ClientAuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map