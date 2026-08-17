"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstimateService = void 0;
const db_1 = __importDefault(require("../utils/db"));
const TierEngine_1 = require("./TierEngine");
class EstimateService {
    async createEstimate(data) {
        const cutoffsConfig = await db_1.default.config.findUnique({ where: { key: 'tier_cutoffs' } });
        const cutoffs = cutoffsConfig?.value || { simple: 8, standard: 16, complex: 26 };
        const { tier, confidenceLow, axisScores } = TierEngine_1.TierEngine.score(data.answers, cutoffs);
        const estimate = await db_1.default.estimate.create({
            data: {
                answers: data.answers,
                tier,
                confidenceLow,
                sourceIpHash: data.sourceIpHash,
            },
        });
        const tierCountsConfig = await db_1.default.config.findUnique({ where: { key: 'tier_counts' } });
        const tierCounts = tierCountsConfig?.value || {};
        const similarProjectsCount = tierCounts[tier] || 0;
        return { ...estimate, axisScores, similarProjectsCount };
    }
    async getEstimates(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [estimates, total] = await Promise.all([
            db_1.default.estimate.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db_1.default.estimate.count()
        ]);
        return {
            data: estimates,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
}
exports.EstimateService = EstimateService;
//# sourceMappingURL=EstimateService.js.map