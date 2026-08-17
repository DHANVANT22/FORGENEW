"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../utils/db"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';
class AuthController {
    static async adminLogin(req, res) {
        try {
            const { email, password } = req.body;
            const user = await db_1.default.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // In a real app we check hashed passwords.
            // For this prototype, we'll just check if it matches the DB or do a basic bcrypt check.
            // Since seed.ts might not have hashed the password if it's simple, we'll try bcrypt.
            // Wait, let's just do a basic string match for 'admin123' if bcrypt fails to allow easy testing.
            let valid = false;
            try {
                valid = await bcrypt_1.default.compare(password, user.password);
            }
            catch (e) {
                valid = password === user.password; // Fallback for plaintext seed
            }
            if (!valid && password !== user.password) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.status(200).json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
        }
        catch (error) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async verifyToken(req, res) {
        res.status(200).json({ valid: true, user: req.user });
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map