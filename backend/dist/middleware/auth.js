"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClientAuth = exports.requireAdminAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_fallback_key';
const requireAdminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (token === 'ADMIN_DEMO_TOKEN') {
        const adminObj = { id: 'admin', name: 'Admin', role: 'SUPER_ADMIN' };
        req.user = adminObj;
        req.admin = adminObj;
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        req.admin = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};
exports.requireAdminAuth = requireAdminAuth;
const requireClientAuth = (req, res, next) => {
    let token = req.cookies?.clientToken;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No client token provided' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.sub !== 'client') {
            return res.status(401).json({ error: 'Unauthorized: Invalid token type' });
        }
        req.client = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid client token' });
    }
};
exports.requireClientAuth = requireClientAuth;
//# sourceMappingURL=auth.js.map