import { Request, Response } from 'express';
import { ClientAuthService } from '../services/ClientAuthService';

const authService = new ClientAuthService();

export class ClientAuthController {
  public static async signupClient(req: Request, res: Response) {
    try {
      const { name, companyName, email, password } = req.body;
      const result = await authService.signupClient({ name, companyName, email, password });

      res.cookie('clientToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.status(201).json({
        success: true,
        token: result.token,
        account: {
          id: result.account.id,
          email: result.account.email,
          name: result.account.name,
          companyName: result.account.companyName,
          projectId: result.account.projectId
        }
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Signup failed' });
    }
  }

  public static async loginClient(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.loginClient(email, password);
      
      res.cookie('clientToken', result.token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
      });

      res.status(200).json({
        success: true,
        token: result.token,
        account: {
          id: result.account.id,
          email: result.account.email,
          name: result.account.name,
          companyName: result.account.companyName,
          projectId: result.account.projectId
        }
      });
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Invalid email or password' });
    }
  }

  public static async logoutClient(req: Request, res: Response) {
    try {
      res.clearCookie('clientToken', { path: '/' });
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  public static async getMe(req: Request, res: Response) {
    try {
      const accountId = (req as any).user?.id || (req as any).client?.id;
      if (!accountId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const account = await authService.getMe(accountId);
      res.status(200).json({ success: true, account });
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Account not found' });
    }
  }

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
      const account = await authService.inviteClient(projectId, email);
      res.status(200).json(account);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async revokeAccess(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      await authService.revokeAccess(accountId as string);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async setupAccount(req: Request, res: Response) {
    try {
      const { inviteToken, password } = req.body;
      await authService.setupAccount(inviteToken, password);
      res.status(200).json({ success: true });
    } catch (error: any) {
      if (error.message.includes('expired')) {
        res.status(400).json({ error: 'Invite token expired' });
      } else {
        res.status(400).json({ error: error.message || 'Invalid invite token' });
      }
    }
  }
}
