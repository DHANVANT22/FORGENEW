import { Response } from 'express';
import { ClientAuthRequest } from '../middleware/auth';
export declare class ClientProjectController {
    static getProject(req: ClientAuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static approveMilestone(req: ClientAuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateOnboardingStatus(req: ClientAuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateNotificationPrefs(req: ClientAuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ClientProjectController.d.ts.map