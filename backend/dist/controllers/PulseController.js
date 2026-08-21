"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PulseController = void 0;
const PulseService_1 = require("../services/PulseService");
const pulseService = new PulseService_1.PulseService();
class PulseController {
    static async generateToken(req, res) {
        try {
            const id = req.params.id;
            const createdById = req.admin?.id || req.user?.id || 'demo-admin';
            const token = await pulseService.generateToken(id, createdById, 30);
            res.status(201).json(token);
        }
        catch (error) {
            console.error('Pulse token error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async rotateToken(req, res) {
        try {
            const id = req.params.id;
            const createdById = req.admin?.id || req.user?.id || 'demo-admin';
            const token = await pulseService.rotateToken(id, createdById, 30);
            res.status(201).json(token);
        }
        catch (error) {
            console.error('Pulse rotate error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getSnapshot(req, res) {
        try {
            const token = req.params.token;
            const snapshot = await pulseService.getSnapshot(token);
            if (!snapshot) {
                return res.status(404).json({ error: 'Token not found or expired' });
            }
            res.status(200).json(snapshot);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.PulseController = PulseController;
//# sourceMappingURL=PulseController.js.map