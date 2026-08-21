"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminClientController = void 0;
const db_1 = __importDefault(require("../utils/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
class AdminClientController {
    static async getClients(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;
            const [clients, total] = await Promise.all([
                db_1.default.clientAccount.findMany({
                    include: {
                        project: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                progress: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    skip,
                    take: limit
                }),
                db_1.default.clientAccount.count()
            ]);
            res.status(200).json({
                data: clients,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error('Error fetching clients:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async createClient(req, res) {
        try {
            const { email, password, name, companyName, projectId } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required.' });
            }
            const existing = await db_1.default.clientAccount.findUnique({
                where: { email: email.toLowerCase().trim() }
            });
            if (existing) {
                return res.status(400).json({ error: 'Client account already exists.' });
            }
            const passwordHash = password ? await bcrypt_1.default.hash(password, 10) : await bcrypt_1.default.hash('ClientPassword123!', 10);
            const client = await db_1.default.clientAccount.create({
                data: {
                    email: email.toLowerCase().trim(),
                    name: name || 'Client User',
                    companyName: companyName || null,
                    passwordHash,
                    projectId: projectId || null
                },
                include: {
                    project: true
                }
            });
            res.status(201).json({ success: true, client });
        }
        catch (error) {
            console.error('Error creating client account:', error);
            res.status(500).json({ error: error.message || 'Failed to create client account' });
        }
    }
}
exports.AdminClientController = AdminClientController;
//# sourceMappingURL=AdminClientController.js.map