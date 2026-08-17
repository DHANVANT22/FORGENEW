import { Request, Response } from 'express';
export declare class ClientAuthController {
    static inviteClient(req: Request, res: Response): Promise<void>;
    static resendInvite(req: Request, res: Response): Promise<void>;
    static revokeAccess(req: Request, res: Response): Promise<void>;
    static loginClient(req: Request, res: Response): Promise<void>;
    static setupAccount(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=ClientAuthController.d.ts.map