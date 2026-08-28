"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const crypto_1 = require("crypto");
const db_1 = __importDefault(require("../utils/db"));
class BlogController {
    static async createBlog(req, res) {
        try {
            const { title, content, queryPlan, queryPlanBefore, authorId, tags = [] } = req.body;
            let effectiveAuthorId = authorId || req.user?.id || req.admin?.id;
            if (!effectiveAuthorId) {
                const firstUser = await db_1.default.user.findFirst();
                if (firstUser) {
                    effectiveAuthorId = firstUser.id;
                }
                else {
                    const newUser = await db_1.default.user.create({
                        data: {
                            email: 'admin@forge.internal',
                            password: 'default_hashed_pass',
                            name: 'Forge Admin',
                            role: 'SUPER_ADMIN'
                        }
                    });
                    effectiveAuthorId = newUser.id;
                }
            }
            let baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (!baseSlug)
                baseSlug = 'blog-post';
            let slug = baseSlug;
            let counter = 2;
            while (true) {
                const existing = await db_1.default.blog.findUnique({ where: { slug } });
                if (!existing)
                    break;
                slug = `${baseSlug}-${counter}`;
                counter++;
            }
            const blog = await db_1.default.blog.create({
                data: {
                    id: (0, crypto_1.randomUUID)(),
                    title,
                    content,
                    queryPlan,
                    queryPlanBefore,
                    authorId: effectiveAuthorId,
                    slug,
                    tags,
                    published: true,
                    updatedAt: new Date()
                }
            });
            res.status(201).json(blog);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getBlogBySlug(req, res) {
        try {
            const { slug } = req.params;
            const blog = await db_1.default.blog.findUnique({
                where: { slug: slug }
            });
            if (!blog) {
                return res.status(404).json({ error: 'Blog not found' });
            }
            res.json(blog);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getBlogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search;
            const tag = req.query.tag;
            const skip = (page - 1) * limit;
            let whereClause = { published: true };
            if (search) {
                whereClause.title = { contains: search, mode: 'insensitive' };
            }
            if (tag) {
                whereClause.tags = { has: tag };
            }
            const [blogs, total] = await Promise.all([
                db_1.default.blog.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                db_1.default.blog.count({ where: whereClause })
            ]);
            res.json({
                data: blogs,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateBlog(req, res) {
        try {
            const { id } = req.params;
            const { title, content, queryPlan, queryPlanBefore, published, tags } = req.body;
            const { PlanValidator } = await Promise.resolve().then(() => __importStar(require('../utils/PlanValidator')));
            if (queryPlan) {
                const validation = PlanValidator.validate(queryPlan);
                if (!validation.valid) {
                    return res.status(400).json({ error: validation.error });
                }
            }
            if (queryPlanBefore) {
                const validation = PlanValidator.validate(queryPlanBefore);
                if (!validation.valid) {
                    return res.status(400).json({ error: validation.error });
                }
            }
            const updateData = { updatedAt: new Date() };
            if (title !== undefined)
                updateData.title = title;
            if (content !== undefined)
                updateData.content = content;
            if (queryPlan !== undefined)
                updateData.queryPlan = queryPlan;
            if (queryPlanBefore !== undefined)
                updateData.queryPlanBefore = queryPlanBefore;
            if (published !== undefined)
                updateData.published = published;
            if (tags !== undefined)
                updateData.tags = tags;
            const blog = await db_1.default.blog.update({
                where: { id: id },
                data: updateData
            });
            res.status(200).json(blog);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.BlogController = BlogController;
//# sourceMappingURL=BlogController.js.map