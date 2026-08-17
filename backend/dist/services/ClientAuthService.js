"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientAuthService = void 0;
const db_1 = __importDefault(require("../utils/db"));
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';
class ClientAuthService {
    async inviteClient(projectId, email) {
        const inviteToken = crypto_1.default.randomBytes(32).toString('hex');
        const inviteExpires = new Date();
        inviteExpires.setDate(inviteExpires.getDate() + 7);
        // In a real app, you would send an email here with the token
        return db_1.default.clientAccount.upsert({
            where: { email },
            update: { inviteToken, inviteExpires, projectId },
            create: { email, projectId, inviteToken, inviteExpires },
        });
    }
    async revokeAccess(accountId) {
        return db_1.default.clientAccount.update({
            where: { id: accountId },
            data: { inviteToken: null, inviteExpires: null, passwordHash: null }
        });
    }
    async setupAccount(inviteToken, password) {
        const account = await db_1.default.clientAccount.findFirst({
            where: { inviteToken }
        });
        if (!account) {
            throw new Error('Invalid invite token');
        }
        if (account.inviteExpires && new Date() > account.inviteExpires) {
            throw new Error('Invite token has expired');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        return db_1.default.clientAccount.update({
            where: { id: account.id },
            data: {
                passwordHash,
                inviteToken: null,
                inviteExpires: null
            }
        });
    }
    async loginClient(email, password) {
        const account = await db_1.default.clientAccount.findUnique({
            where: { email },
        });
        if (!account) {
            throw new Error('Invalid credentials');
        }
        if (!account.passwordHash) {
            if (account.inviteExpires && new Date() > account.inviteExpires) {
                throw new Error('Invite token has expired');
            }
            throw new Error('Account setup required');
        }
        const isValid = await bcrypt_1.default.compare(password, account.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const token = jsonwebtoken_1.default.sign({ id: account.id, email: account.email, projectId: account.projectId, sub: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return { account, token };
    }
}
exports.ClientAuthService = ClientAuthService;
//# sourceMappingURL=ClientAuthService.js.map