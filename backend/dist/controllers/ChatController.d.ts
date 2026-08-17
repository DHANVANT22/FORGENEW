import { Request, Response } from 'express';
export declare class ChatController {
    static getMessages(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static sendMessage(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=ChatController.d.ts.map