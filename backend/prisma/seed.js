"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // 1. Create Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@haizotech.com' },
        update: {},
        create: {
            email: 'admin@haizotech.com',
            password: 'password123', // Demo dummy password
            name: 'System Admin',
            role: 'SUPER_ADMIN',
        },
    });
    console.log(`Created admin user: ${admin.email}`);
    // 2. Create Client & Project
    const client = await prisma.client.create({
        data: {
            id: 'demo-client-1',
            organization: 'Acme Corp',
            contactName: 'Wile E. Coyote',
            email: 'wile@acme.com',
        }
    });
    const project = await prisma.project.create({
        data: {
            id: 'demo-project-id',
            name: 'Acme Corp E-Commerce Replatform',
            clientId: client.id,
            status: 'Development',
            budget: '$50,000',
            progress: 45,
            startDate: new Date(),
        }
    });
    console.log(`Created project: ${project.name}`);
    // 3. Create Columns & Tasks
    const todo = await prisma.column.create({
        data: {
            name: 'To Do',
            order: 1,
            clientVisible: true,
            projectId: project.id,
            tasks: {
                create: [
                    { title: 'Setup Auth Flow', priority: 'High', order: 1 },
                    { title: 'Design System Integration', priority: 'Medium', order: 2 },
                ]
            }
        }
    });
    const inProgress = await prisma.column.create({
        data: {
            name: 'In Progress',
            order: 2,
            clientVisible: true,
            projectId: project.id,
            tasks: {
                create: [
                    { title: 'API Endpoints for Products', priority: 'High', order: 1 },
                    { title: 'Shopping Cart State', priority: 'High', order: 2 },
                ]
            }
        }
    });
    const done = await prisma.column.create({
        data: {
            name: 'Done',
            order: 3,
            clientVisible: true,
            projectId: project.id,
            tasks: {
                create: [
                    { title: 'Database Schema', priority: 'Medium', order: 1, isCompleted: true },
                    { title: 'Project Kickoff', priority: 'Low', order: 2, isCompleted: true },
                ]
            }
        }
    });
    const internal = await prisma.column.create({
        data: {
            name: 'Internal Review',
            order: 4,
            clientVisible: false,
            projectId: project.id,
            tasks: {
                create: [
                    { title: 'Security Audit', priority: 'High', order: 1 }
                ]
            }
        }
    });
    // 4. Create Milestones
    await prisma.milestone.createMany({
        data: [
            { title: 'Requirements Gathering', targetDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), completedAt: new Date(), clientVisible: true, projectId: project.id },
            { title: 'Backend API V1', targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), clientVisible: true, projectId: project.id },
            { title: 'Launch', targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), clientVisible: true, projectId: project.id },
        ]
    });
    // 5. Create Blog Post with Query Plan
    const defaultPlan = [
        {
            "Plan": {
                "Node Type": "Hash Join",
                "Actual Rows": 125,
                "Actual Total Time": 3.425,
                "Plans": [
                    {
                        "Node Type": "Seq Scan",
                        "Relation Name": "users",
                        "Actual Rows": 1000,
                        "Actual Total Time": 1.250
                    },
                    {
                        "Node Type": "Hash",
                        "Actual Rows": 250,
                        "Actual Total Time": 0.850
                    }
                ]
            }
        }
    ];
    await prisma.blog.upsert({
        where: { slug: 'optimizing-postgres' },
        update: {},
        create: {
            id: 'blog-1',
            title: 'Optimizing our Postgres Queries',
            content: 'We recently found a bottleneck in our project retrieval query. Here is the query plan before and after our optimization.',
            slug: 'optimizing-postgres',
            published: true,
            authorId: admin.id,
            queryPlan: defaultPlan,
            updatedAt: new Date()
        }
    });
    // 6. Create Demo Estimate & Scenario for Funnel Widget
    await prisma.estimate.create({
        data: {
            tier: 'Standard',
            sourceIpHash: '127.0.0.1',
            answers: { framework: 'Next.js', timeline: 'Urgent' }
        }
    });
    await prisma.scenario.create({
        data: {
            computedBand: 'High',
            projectId: project.id,
            inputs: { complexity: 85, urgency: 90 }
        }
    });
    console.log('Seeding complete!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map