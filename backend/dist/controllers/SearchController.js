"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const db_1 = __importDefault(require("../utils/db"));
class SearchController {
    static async search(req, res) {
        try {
            const q = req.query.q || '';
            if (!q.trim()) {
                return res.status(200).json({ projects: [], clients: [], blogs: [] });
            }
            const [projects, clients, blogs] = await Promise.all([
                db_1.default.project.findMany({
                    where: { name: { contains: q, mode: 'insensitive' } },
                    take: 5
                }),
                db_1.default.clientAccount.findMany({
                    where: { email: { contains: q, mode: 'insensitive' } },
                    take: 5
                }),
                db_1.default.blog.findMany({
                    where: { title: { contains: q, mode: 'insensitive' } },
                    take: 5
                })
            ]);
            res.status(200).json({
                projects,
                clients,
                blogs
            });
        }
        catch (error) {
            console.error('Error in search:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.SearchController = SearchController;
//# sourceMappingURL=SearchController.js.map