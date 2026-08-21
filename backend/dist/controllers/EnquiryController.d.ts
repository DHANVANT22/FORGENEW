import { Request, Response } from 'express';
export declare class EnquiryController {
    static createEnquiry(req: Request, res: Response): Promise<void>;
    static getAdminEnquiries(req: Request, res: Response): Promise<void>;
    static postAdminReply(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateEnquiryStatus(req: Request, res: Response): Promise<void>;
    static getEnquiryByToken(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static convertToProject(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=EnquiryController.d.ts.map