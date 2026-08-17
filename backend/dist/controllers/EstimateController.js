"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateController = void 0;
const EstimateService_1 = require("../services/EstimateService");
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../utils/db"));
const estimateService = new EstimateService_1.EstimateService();
class EstimateController {
    static async createEstimate(req, res) {
        try {
            const { answers, website } = req.body;
            // Honeypot check
            if (website && website.trim() !== '') {
                return res.status(400).json({ error: 'Invalid submission' });
            }
            // Hash the IP address for deduplication
            const ip = req.ip || req.connection.remoteAddress || 'unknown';
            const sourceIpHash = crypto_1.default.createHash('sha256').update(ip).digest('hex');
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            const duplicate = await db_1.default.estimate.findFirst({
                where: {
                    sourceIpHash,
                    createdAt: { gte: tenMinutesAgo }
                }
            });
            if (duplicate) {
                return res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'You recently submitted an estimate. Please wait.' } });
            }
            const estimate = await estimateService.createEstimate({ answers, sourceIpHash });
            res.status(201).json(estimate);
        }
        catch (error) {
            console.error('Error creating estimate:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getEstimates(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const estimates = await estimateService.getEstimates(page, limit);
            res.status(200).json(estimates);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async trackProgress(req, res) {
        try {
            const { sessionId, questionKey } = req.body;
            if (!sessionId || !questionKey) {
                return res.status(400).json({ error: 'Missing parameters' });
            }
            const event = await db_1.default.quizProgressEvent.create({
                data: {
                    sessionId,
                    questionKey
                }
            });
            res.status(201).json(event);
        }
        catch (error) {
            console.error('Error tracking progress:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getFunnelStats(req, res) {
        try {
            const events = await db_1.default.quizProgressEvent.findMany();
            const funnel = {};
            // Count unique sessions per question
            const seen = new Set();
            events.forEach(e => {
                const k = `${e.questionKey}-${e.sessionId}`;
                if (!seen.has(k)) {
                    seen.add(k);
                    funnel[e.questionKey] = (funnel[e.questionKey] || 0) + 1;
                }
            });
            res.status(200).json(funnel);
        }
        catch (error) {
            console.error('Error fetching funnel stats:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getStaleEstimates(req, res) {
        try {
            const days = parseInt(req.query.days) || 14;
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const staleEstimates = await db_1.default.estimate.findMany({
                where: {
                    createdAt: { lt: cutoffDate },
                    Project: { none: {} }
                },
                orderBy: { createdAt: 'asc' }
            });
            res.status(200).json(staleEstimates);
        }
        catch (error) {
            console.error('Error fetching stale estimates:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.EstimateController = EstimateController;
//# sourceMappingURL=EstimateController.js.map