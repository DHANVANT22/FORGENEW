"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthController = void 0;
const ClientAuthService_1 = require("../services/ClientAuthService");
const authService = new ClientAuthService_1.ClientAuthService();
class ClientAuthController {
    static async signupClient(req, res) {
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
        }
        catch (error) {
            res.status(400).json({ error: error.message || 'Signup failed' });
        }
    }
    static async loginClient(req, res) {
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
        }
        catch (error) {
            res.status(401).json({ error: error.message || 'Invalid email or password' });
        }
    }
    static async logoutClient(req, res) {
        try {
            res.clearCookie('clientToken', { path: '/' });
            res.status(200).json({ success: true, message: 'Logged out successfully' });
        }
        catch (error) {
            res.status(500).json({ error: 'Logout failed' });
        }
    }
    static async getMe(req, res) {
        try {
            const accountId = req.user?.id || req.client?.id;
            if (!accountId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const account = await authService.getMe(accountId);
            res.status(200).json({ success: true, account });
        }
        catch (error) {
            res.status(404).json({ error: error.message || 'Account not found' });
        }
    }
    static async inviteClient(req, res) {
        try {
            const { projectId, email } = req.body;
            const account = await authService.inviteClient(projectId, email);
            res.status(201).json(account);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async resendInvite(req, res) {
        try {
            const { projectId, email } = req.body;
            const account = await authService.inviteClient(projectId, email);
            res.status(200).json(account);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async revokeAccess(req, res) {
        try {
            const { accountId } = req.params;
            await authService.revokeAccess(accountId);
            res.status(200).json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async setupAccount(req, res) {
        try {
            const { inviteToken, password } = req.body;
            await authService.setupAccount(inviteToken, password);
            res.status(200).json({ success: true });
        }
        catch (error) {
            if (error.message.includes('expired')) {
                res.status(400).json({ error: 'Invite token expired' });
            }
            else {
                res.status(400).json({ error: error.message || 'Invalid invite token' });
            }
        }
    }
}
exports.ClientAuthController = ClientAuthController;
//# sourceMappingURL=ClientAuthController.js.map