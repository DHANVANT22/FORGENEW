"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const RiskService_1 = require("../services/RiskService");
// Run every night at 2:00 AM
node_cron_1.default.schedule('0 2 * * *', async () => {
    console.log('[Cron] Starting nightly risk computation...');
    try {
        await RiskService_1.RiskService.computeAll();
        console.log('[Cron] Nightly risk computation completed successfully.');
    }
    catch (error) {
        console.error('[Cron] Error during nightly risk computation:', error);
    }
});
//# sourceMappingURL=riskNightly.js.map