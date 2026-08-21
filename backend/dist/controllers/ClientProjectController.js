"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientProjectController = void 0;
const db_1 = __importDefault(require("../utils/db"));
const index_1 = require("../index");
class ClientProjectController {
    static async getProject(req, res) {
        try {
            let projectId = req.client?.projectId;
            const clientId = req.client?.id;
            let clientAccount = null;
            if (clientId) {
                clientAccount = await db_1.default.clientAccount.findUnique({
                    where: { id: clientId }
                });
                if (clientAccount?.projectId) {
                    projectId = clientAccount.projectId;
                }
            }
            // If still no projectId assigned, find an existing active project or create a default client project
            if (!projectId) {
                let defaultProject = await db_1.default.project.findFirst({
                    orderBy: { createdAt: 'desc' },
                    include: {
                        columns: {
                            where: { clientVisible: true },
                            orderBy: { order: 'asc' },
                            include: {
                                tasks: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                        Milestone: {
                            where: { clientVisible: true },
                            orderBy: { targetDate: 'asc' },
                        },
                        PulseToken: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        },
                        ClientAccount: true
                    }
                });
                // If no project exists at all, create one
                if (!defaultProject) {
                    defaultProject = await db_1.default.project.create({
                        data: {
                            name: clientAccount?.companyName ? `${clientAccount.companyName} Workspace` : `${clientAccount?.name || 'Enterprise'} Cloud Application`,
                            description: 'Unified client delivery workspace. Configure architecture scope, track live milestone sign-offs, and communicate directly with engineering leads.',
                            status: 'In Progress',
                            progress: 35,
                            budget: '$28,000',
                            budgetAmount: 28000,
                            estimatedHours: 160,
                            columns: {
                                create: [
                                    { name: 'To Do', order: 0, clientVisible: true, tasks: { create: [{ title: 'Architecture Blueprint & Tech Stack Finalization', priority: 'High', order: 0 }] } },
                                    { name: 'In Progress', order: 1, clientVisible: true, tasks: { create: [{ title: 'Core Cloud API & Database Provisioning', priority: 'High', order: 0 }] } },
                                    { name: 'Quality Assurance', order: 2, clientVisible: true, tasks: { create: [{ title: 'Integration Testing & Security Audits', priority: 'Medium', order: 0 }] } },
                                    { name: 'Delivered', order: 3, clientVisible: true, tasks: { create: [{ title: 'Project Initialization & Scope Signoff', priority: 'Low', order: 0, isCompleted: true }] } }
                                ]
                            },
                            Milestone: {
                                create: [
                                    { title: 'Discovery & Blueprint Sign-off', status: 'Completed', clientVisible: true, requiresApproval: false, completedAt: new Date() },
                                    { title: 'Core API & Auth Engine Sprint', status: 'Current', clientVisible: true, requiresApproval: true, targetDate: new Date(Date.now() + 14 * 86400000) },
                                    { title: 'Frontend UI & System Integration', status: 'Upcoming', clientVisible: true, requiresApproval: true, targetDate: new Date(Date.now() + 28 * 86400000) },
                                    { title: 'Production Deployment & SLA Handoff', status: 'Upcoming', clientVisible: true, requiresApproval: true, targetDate: new Date(Date.now() + 42 * 86400000) }
                                ]
                            }
                        },
                        include: {
                            columns: {
                                where: { clientVisible: true },
                                orderBy: { order: 'asc' },
                                include: {
                                    tasks: {
                                        orderBy: { order: 'asc' },
                                    },
                                },
                            },
                            Milestone: {
                                where: { clientVisible: true },
                                orderBy: { targetDate: 'asc' },
                            },
                            PulseToken: {
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            },
                            ClientAccount: true
                        }
                    });
                }
                if (clientId && defaultProject) {
                    await db_1.default.clientAccount.update({
                        where: { id: clientId },
                        data: { projectId: defaultProject.id }
                    }).catch(console.error);
                }
                return res.status(200).json(defaultProject);
            }
            const project = await db_1.default.project.findUnique({
                where: { id: projectId },
                include: {
                    columns: {
                        where: { clientVisible: true },
                        orderBy: { order: 'asc' },
                        include: {
                            tasks: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    Milestone: {
                        where: { clientVisible: true },
                        orderBy: { targetDate: 'asc' },
                    },
                    PulseToken: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    },
                    ClientAccount: true
                },
            });
            if (!project) {
                return res.status(404).json({ error: 'Project not found' });
            }
            res.status(200).json(project);
        }
        catch (error) {
            console.error('Error fetching client project:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async submitProjectBrief(req, res) {
        try {
            const clientId = req.client?.id;
            let projectId = req.client?.projectId;
            const { title, requirements, budget, timeline, estimateTier } = req.body;
            if (!clientId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            if (!projectId) {
                const clientAcc = await db_1.default.clientAccount.findUnique({ where: { id: clientId } });
                projectId = clientAcc?.projectId || undefined;
            }
            if (!projectId) {
                const defaultProj = await db_1.default.project.findFirst({ orderBy: { createdAt: 'desc' } });
                if (defaultProj) {
                    projectId = defaultProj.id;
                    await db_1.default.clientAccount.update({ where: { id: clientId }, data: { projectId: defaultProj.id } }).catch(console.error);
                }
            }
            if (!projectId) {
                return res.status(400).json({ error: 'No active project found' });
            }
            // Format the brief as a structured message
            const briefText = `📋 **[NEW PROJECT BRIEF / SCOPE REQUEST]**\n\n` +
                `**Title / Scope:** ${title || 'Additional Feature Scope'}\n` +
                `**Complexity Tier:** ${estimateTier || 'Not Estimated'}\n` +
                `**Budget Target:** ${budget || 'Flexible'}\n` +
                `**Timeline Target:** ${timeline || 'Standard'}\n\n` +
                `**Details & Requirements:**\n${requirements}`;
            // Find or create conversation
            let conv = await db_1.default.conversation.findFirst({ where: { projectId } });
            if (!conv) {
                conv = await db_1.default.conversation.create({
                    data: { projectId, type: 'project', updatedAt: new Date() }
                });
            }
            const clientAccount = await db_1.default.clientAccount.findUnique({ where: { id: clientId } });
            const clientEmail = clientAccount?.email || 'Client';
            // Find an admin user or system user for relation
            const defaultUser = await db_1.default.user.findFirst();
            if (!defaultUser) {
                return res.status(500).json({ error: 'System user not configured' });
            }
            const message = await db_1.default.message.create({
                data: {
                    id: Date.now().toString(),
                    conversationId: conv.id,
                    senderId: defaultUser.id,
                    body: briefText,
                }
            });
            // Create an activity event for admin
            await db_1.default.activityEvent.create({
                data: {
                    id: Date.now().toString(),
                    action: 'project_brief_submitted',
                    entityType: 'Project',
                    entityId: projectId,
                    entityLabel: `Project Brief: ${title || 'Scope Request'}`,
                    actorId: clientId,
                    actorName: clientEmail,
                    path: `/projects/${projectId}?tab=messages`
                }
            });
            // Broadcast message to socket
            const formattedMessage = {
                id: message.id,
                senderName: 'Client',
                text: message.body,
                createdAt: message.createdAt.toISOString()
            };
            index_1.io.to(`project_${projectId}`).emit('receive_message', formattedMessage);
            res.status(201).json({ success: true, message: formattedMessage });
        }
        catch (error) {
            console.error('Error submitting project brief:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async approveMilestone(req, res) {
        try {
            const id = req.params.id;
            const clientId = req.client?.id;
            const projectId = req.client?.projectId;
            if (!clientId || !projectId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const milestone = await db_1.default.milestone.findFirst({
                where: { id, projectId }
            });
            if (!milestone) {
                return res.status(404).json({ error: 'Milestone not found' });
            }
            if (milestone.status !== 'Current' || !milestone.requiresApproval) {
                return res.status(400).json({ error: 'Milestone is not eligible for approval' });
            }
            const updated = await db_1.default.milestone.update({
                where: { id },
                data: {
                    approvedAt: new Date(),
                    approvedByClientId: clientId
                }
            });
            // Log to ActivityEvent
            const event = await db_1.default.activityEvent.create({
                data: {
                    id: Date.now().toString(),
                    action: 'milestone_approved',
                    entityType: 'Milestone',
                    entityId: milestone.id,
                    entityLabel: milestone.title,
                    actorId: clientId,
                    actorName: 'Client',
                    path: `/projects/${projectId}?tab=milestones`
                }
            });
            // Emit socket event to admin
            index_1.io.to(`project_${projectId}`).emit('milestone_approved', {
                milestoneId: id,
                event
            });
            res.status(200).json(updated);
        }
        catch (error) {
            console.error('Error approving milestone:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateOnboardingStatus(req, res) {
        try {
            const clientId = req.client?.id;
            if (!clientId)
                return res.status(401).json({ error: 'Unauthorized' });
            const updated = await db_1.default.clientAccount.update({
                where: { id: clientId },
                data: { hasSeenOnboarding: true }
            });
            res.status(200).json(updated);
        }
        catch (error) {
            console.error('Error updating onboarding status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateNotificationPrefs(req, res) {
        try {
            const clientId = req.client?.id;
            const { prefs } = req.body;
            if (!clientId)
                return res.status(401).json({ error: 'Unauthorized' });
            const updated = await db_1.default.clientAccount.update({
                where: { id: clientId },
                data: { notificationPrefs: prefs }
            });
            res.status(200).json(updated);
        }
        catch (error) {
            console.error('Error updating notification prefs:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ClientProjectController = ClientProjectController;
//# sourceMappingURL=ClientProjectController.js.map