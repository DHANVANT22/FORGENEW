"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
const db_1 = __importDefault(require("../utils/db"));
const TierEngine_1 = require("../services/TierEngine");
class ConfigController {
    static async getTierWeights(req, res) {
        try {
            let config = await db_1.default.config.findUnique({
                where: { key: 'tier-weights' }
            });
            if (!config) {
                // Return defaults if not set
                return res.json({
                    Simple: 1,
                    Standard: 2,
                    Complex: 4,
                    Enterprise: 8
                });
            }
            res.json(config.value);
        }
        catch (error) {
            console.error('Error fetching tier weights:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateTierWeights(req, res) {
        try {
            const weights = req.body;
            const config = await db_1.default.config.upsert({
                where: { key: 'tier-weights' },
                update: { value: weights },
                create: {
                    key: 'tier-weights',
                    value: weights
                }
            });
            res.json(config.value);
        }
        catch (error) {
            console.error('Error updating tier weights:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getTierCutoffs(req, res) {
        try {
            let config = await db_1.default.config.findUnique({
                where: { key: 'tier_cutoffs' }
            });
            if (!config) {
                return res.json({ simple: 8, standard: 16, complex: 26 });
            }
            res.json(config.value);
        }
        catch (error) {
            console.error('Error fetching tier cutoffs:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateTierCutoffs(req, res) {
        try {
            const cutoffs = req.body;
            const config = await db_1.default.config.upsert({
                where: { key: 'tier_cutoffs' },
                update: { value: cutoffs },
                create: {
                    key: 'tier_cutoffs',
                    value: cutoffs
                }
            });
            res.json(config.value);
        }
        catch (error) {
            console.error('Error updating tier cutoffs:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async previewTierWeights(req, res) {
        try {
            const { cutoffs } = req.body;
            const estimates = await db_1.default.estimate.findMany();
            const shifts = {};
            for (const est of estimates) {
                if (!est.answers)
                    continue;
                const oldTier = est.tier;
                const result = TierEngine_1.TierEngine.score(est.answers, cutoffs);
                const newTier = result.tier;
                if (oldTier !== newTier) {
                    const shiftKey = `${oldTier} -> ${newTier}`;
                    shifts[shiftKey] = (shifts[shiftKey] || 0) + 1;
                }
            }
            res.status(200).json({ shifts });
        }
        catch (error) {
            console.error('Error previewing tier weights:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ConfigController = ConfigController;
//# sourceMappingURL=ConfigController.js.map