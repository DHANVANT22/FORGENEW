import { Request, Response } from 'express';
import { ClientAuthService } from '../services/ClientAuthService';

const authService = new ClientAuthService();

export class ClientAuthController {
  public static async inviteClient(req: Request, res: Response) {
    try {
      const { projectId, email } = req.body;
      const account = await authService.inviteClient(projectId, email);
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async resendInvite(req: Request, res: Response) {
    try {
      const { projectId, email } = req.body;
      // In a real app this would just resend the email, here we re-generate token
      const account = await authService.inviteClient(projectId, email);
      res.status(200).json(account);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async revokeAccess(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      await authService.revokeAccess(accountId);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async loginClient(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginClient(email, password);
      
      // HttpOnly cookie
      res.cookie('clientToken', result.token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
      });
      res.status(200).json({ success: true, account: { id: result.account.id, email: result.account.email, projectId: result.account.projectId } });
    } catch (error) {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  public static async setupAccount(req: Request, res: Response) {
    try {
      const { inviteToken, password } = req.body;
      const account = await authService.setupAccount(inviteToken, password);
      res.status(200).json({ success: true });
    } catch (error: any) {
      if (error.message.includes('expired')) {
        res.status(400).json({ error: 'Invite token expired' });
      } else {
        res.status(400).json({ error: 'Invalid invite token' });
      }
    }
  }
}
