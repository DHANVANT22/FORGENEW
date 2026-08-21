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
    async signupClient(data) {
        const { name, companyName, email, password } = data;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Please enter a valid email address.');
        }
        if (!password || password.length < 8) {
            throw new Error('Password must be at least 8 characters long.');
        }
        const weakPasswords = ['password', 'password123', '12345678', 'qwertyuiop', 'admin1234'];
        if (weakPasswords.includes(password.toLowerCase())) {
            throw new Error('Password is too weak. Please choose a more secure password.');
        }
        const existing = await db_1.default.clientAccount.findUnique({
            where: { email: email.toLowerCase().trim() }
        });
        if (existing) {
            throw new Error('An account with this email already exists.');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        // Create client account record
        const account = await db_1.default.clientAccount.create({
            data: {
                email: email.toLowerCase().trim(),
                name: name || 'Client User',
                companyName: companyName || null,
                passwordHash,
                lastLoginAt: new Date()
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: account.id, email: account.email, projectId: account.projectId, sub: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return { account, token };
    }
    async inviteClient(projectId, email) {
        const inviteToken = crypto_1.default.randomBytes(32).toString('hex');
        const inviteExpires = new Date();
        inviteExpires.setDate(inviteExpires.getDate() + 7);
        return db_1.default.clientAccount.upsert({
            where: { email: email.toLowerCase().trim() },
            update: { inviteToken, inviteExpires, projectId },
            create: { email: email.toLowerCase().trim(), projectId, inviteToken, inviteExpires },
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
        if (!password || password.length < 8) {
            throw new Error('Password must be at least 8 characters long.');
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        return db_1.default.clientAccount.update({
            where: { id: account.id },
            data: {
                passwordHash,
                inviteToken: null,
                inviteExpires: null,
                lastLoginAt: new Date()
            }
        });
    }
    async loginClient(email, password) {
        if (!email || !password) {
            throw new Error('Invalid email or password');
        }
        const account = await db_1.default.clientAccount.findUnique({
            where: { email: email.toLowerCase().trim() },
            include: { project: true }
        });
        if (!account || !account.passwordHash) {
            throw new Error('Invalid email or password');
        }
        const isValid = await bcrypt_1.default.compare(password, account.passwordHash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        // Update last login timestamp
        await db_1.default.clientAccount.update({
            where: { id: account.id },
            data: { lastLoginAt: new Date() }
        });
        const token = jsonwebtoken_1.default.sign({ id: account.id, email: account.email, projectId: account.projectId, sub: 'client' }, JWT_SECRET, { expiresIn: '7d' });
        return { account, token };
    }
    async getMe(accountId) {
        const account = await db_1.default.clientAccount.findUnique({
            where: { id: accountId },
            include: {
                project: {
                    include: {
                        columns: {
                            where: { clientVisible: true },
                            include: { tasks: true },
                            orderBy: { order: 'asc' }
                        },
                        Milestone: {
                            where: { clientVisible: true },
                            orderBy: { createdAt: 'asc' }
                        },
                        PulseToken: {
                            take: 1,
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });
        if (!account) {
            throw new Error('Client account not found');
        }
        return account;
    }
}
exports.ClientAuthService = ClientAuthService;
//# sourceMappingURL=ClientAuthService.js.map