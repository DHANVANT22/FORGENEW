"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityLogController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class ActivityLogController {
    static async getActivityLog(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            const [logs, total] = await Promise.all([
                db_1.default.activityEvent.findMany({
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                db_1.default.activityEvent.count()
            ]);
            res.status(200).json({
                data: logs,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Error fetching activity log:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ActivityLogController = ActivityLogController;
//# sourceMappingURL=ActivityLogController.js.map