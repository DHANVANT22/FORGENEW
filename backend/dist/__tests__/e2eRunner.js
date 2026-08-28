"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../utils/db"));
const ClientAuthService_1 = require("../services/ClientAuthService");
const PulseService_1 = require("../services/PulseService");
const crypto_1 = require("crypto");
function assert(condition, message) {
    if (!condition) {
        console.error(`❌ E2E FAIL: ${message}`);
        process.exit(1);
    }
    else {
        console.log(`✓ E2E PASS: ${message}`);
    }
}
async function runE2ETests() {
    console.log('====================================================');
    console.log('         FORGE 2.0 E2E INTEGRATION TEST SUITE       ');
    console.log('====================================================\n');
    const testEmail = `e2e_client_${Date.now()}@forge.internal`;
    const clientAuthService = new ClientAuthService_1.ClientAuthService();
    // 1. Client Sign-Up & Password Hashing E2E
    console.log('[Phase 1] Testing Client Auth & Registration Workflow...');
    const { account, token } = await clientAuthService.signupClient({
        name: 'E2E Test Client',
        companyName: 'Acme Testing Corp',
        email: testEmail,
        password: 'SecurePassword123!'
    });
    assert(Boolean(account.id), 'Client account created with unique ID');
    assert(Boolean(token), 'Client received valid JWT session token');
    // 2. Client Login E2E
    console.log('\n[Phase 2] Testing Client Authentication & Login...');
    const loginRes = await clientAuthService.loginClient(testEmail, 'SecurePassword123!');
    assert(loginRes.account.email === testEmail, 'Client authentication verified email match');
    assert(Boolean(loginRes.token), 'Client received refreshed session token');
    // 3. Project Creation & Kanban Columns E2E
    console.log('\n[Phase 3] Testing Project Provisioning & Kanban Pipeline...');
    const project = await db_1.default.project.create({
        data: {
            name: 'E2E Automated Scoped App',
            status: 'In Progress',
            budgetAmount: 35000,
            estimatedHours: 200,
            columns: {
                create: [
                    { name: 'To Do', order: 0, clientVisible: true },
                    { name: 'In Progress', order: 1, clientVisible: true },
                    { name: 'Review', order: 2, clientVisible: false },
                    { name: 'Done', order: 3, clientVisible: true }
                ]
            },
            Milestone: {
                create: [
                    { title: 'Architecture Blueprint', status: 'Completed', clientVisible: true },
                    { title: 'Core API Engine', status: 'Current', clientVisible: true, requiresApproval: true }
                ]
            }
        },
        include: { columns: true, Milestone: true }
    });
    assert(project.columns.length === 4, 'Project initialized with 4 default Kanban columns');
    assert(project.Milestone.length === 2, 'Project initialized with 2 milestone checkpoints');
    // Link client to project
    await db_1.default.clientAccount.update({
        where: { id: account.id },
        data: { projectId: project.id }
    });
    // 4. Delivery Pulse Token & Telemetry E2E
    console.log('\n[Phase 4] Testing Executive Pulse Telemetry Engine...');
    const pulseService = new PulseService_1.PulseService();
    // Find or create admin user for pulse creation
    let admin = await db_1.default.user.findFirst();
    if (!admin) {
        admin = await db_1.default.user.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                email: 'admin_e2e@forge.internal',
                password: 'hashed_password',
                name: 'E2E Admin',
                role: 'SUPER_ADMIN'
            }
        });
    }
    const pulseToken = await pulseService.generateToken(project.id, admin.id);
    assert(Boolean(pulseToken.token), 'Generated cryptographic Pulse access token');
    const snapshot = await pulseService.getSnapshot(pulseToken.token);
    assert(snapshot.projectName === 'E2E Automated Scoped App', 'Pulse snapshot returned matching project name');
    assert(Array.isArray(snapshot.changelog), 'Pulse snapshot returned changelog array');
    // 5. Milestone Approval Workflow E2E
    console.log('\n[Phase 5] Testing Client Milestone Sign-off Workflow...');
    const currentMilestone = project.Milestone.find(m => m.requiresApproval);
    assert(Boolean(currentMilestone), 'Found milestone requiring approval');
    if (currentMilestone) {
        const approved = await db_1.default.milestone.update({
            where: { id: currentMilestone.id },
            data: {
                approvedAt: new Date(),
                approvedByClientId: account.id
            }
        });
        assert(Boolean(approved.approvedAt), 'Milestone sign-off recorded timestamp');
        assert(approved.approvedByClientId === account.id, 'Milestone recorded client ID');
    }
    // 6. Control Centre Ideas & AI Brainstorming E2E
    console.log('\n[Phase 6] Testing Control Centre Ideas & Revisions Engine...');
    const idea = await db_1.default.controlCentreIdea.create({
        data: {
            id: (0, crypto_1.randomUUID)(),
            title: 'E2E Architecture Idea',
            slug: `e2e-idea-${Date.now()}`,
            content: '# E2E Test Idea Content\n\n- Feature A\n- Feature B',
            createdById: admin.id,
            version: 1,
            revisions: {
                create: {
                    content: '# E2E Test Idea Content',
                    version: 1,
                    editedById: admin.id,
                    changeSummary: 'Initial creation'
                }
            }
        },
        include: { revisions: true }
    });
    assert(idea.revisions.length === 1, 'Control Centre idea created with revision version 1');
    // Cleanup test artifacts from database
    console.log('\n[Phase 7] Cleaning up E2E test database records...');
    await db_1.default.controlCentreRevision.deleteMany({ where: { ideaId: idea.id } });
    await db_1.default.controlCentreIdea.delete({ where: { id: idea.id } });
    await db_1.default.pulseToken.deleteMany({ where: { projectId: project.id } });
    await db_1.default.milestone.deleteMany({ where: { projectId: project.id } });
    await db_1.default.task.deleteMany({ where: { column: { projectId: project.id } } });
    await db_1.default.column.deleteMany({ where: { projectId: project.id } });
    await db_1.default.clientAccount.delete({ where: { id: account.id } });
    await db_1.default.project.delete({ where: { id: project.id } });
    console.log('\n====================================================');
    console.log('       🎉 ALL E2E WORKFLOW TESTS PASSED!           ');
    console.log('====================================================');
}
runE2ETests().catch(err => {
    console.error('E2E tests crashed:', err);
    process.exit(1);
});
//# sourceMappingURL=e2eRunner.js.map