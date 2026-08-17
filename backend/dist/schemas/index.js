"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientInviteSchema = exports.ClientAuthSchema = exports.BlogSchema = void 0;
const zod_1 = require("zod");
exports.BlogSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(3, "Title must be at least 3 characters"),
        content: zod_1.z.string().min(10, "Content must be at least 10 characters"),
        authorId: zod_1.z.string(),
        queryPlan: zod_1.z.array(zod_1.z.any()).optional(),
        queryPlanBefore: zod_1.z.array(zod_1.z.any()).optional()
    })
});
exports.ClientAuthSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email address"),
        password: zod_1.z.string().min(6, "Password must be at least 6 characters")
    })
});
exports.ClientInviteSchema = zod_1.z.object({
    body: zod_1.z.object({
        projectId: zod_1.z.string().uuid("Invalid Project ID"),
        email: zod_1.z.string().email("Invalid email address")
    })
});
//# sourceMappingURL=index.js.map