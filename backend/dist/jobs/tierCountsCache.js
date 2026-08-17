"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TierCountsCache = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = __importDefault(require("../utils/db"));
class TierCountsCache {
    static async refresh() {
        try {
            const counts = await db_1.default.estimate.groupBy({
                by: ['tier'],
                _count: { tier: true },
            });
            const tierCounts = {};
            counts.forEach(c => {
                tierCounts[c.tier] = c._count.tier;
            });
            const existing = await db_1.default.config.findUnique({ where: { key: 'tier_counts' } });
            if (existing) {
                await db_1.default.config.update({
                    where: { key: 'tier_counts' },
                    data: { value: tierCounts }
                });
            }
            else {
                await db_1.default.config.create({
                    data: {
                        key: 'tier_counts',
                        value: tierCounts
                    }
                });
            }
        }
        catch (e) {
            console.error('Failed to refresh tier counts', e);
        }
    }
}
exports.TierCountsCache = TierCountsCache;
// Run every hour
node_cron_1.default.schedule('0 * * * *', () => {
    TierCountsCache.refresh();
});
//# sourceMappingURL=tierCountsCache.js.map