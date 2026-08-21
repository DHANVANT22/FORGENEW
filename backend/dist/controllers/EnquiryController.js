"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnquiryController = void 0;
const db_1 = __importDefault(require("../utils/db"));
const uuid_1 = require("uuid");
const index_1 = require("../index");
const db = db_1.default;
class EnquiryController {
    // Public Endpoint: Create an enquiry from the Estimator
    static async createEnquiry(req, res) {
        try {
            const { clientName, clientEmail, estimateData, message, projectId } = req.body;
            const token = (0, uuid_1.v4)().replace(/-/g, '').substring(0, 16);
            const enquiry = await db.inquiry?.create({
                data: {
                    name: clientName || 'Prospective Client',
                    email: clientEmail || 'client@example.com',
                    message: message || (estimateData ? `Scope Estimate: ${estimateData.tier || 'Custom'}` : 'New Inquiry'),
                    service: estimateData?.tier || 'Custom Solution'
                }
            });
            res.status(201).json({ token: token, id: enquiry?.id || token });
        }
        catch (error) {
            console.error('Error creating enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Admin Endpoint: Get all enquiries (leads, estimate scopes, and project briefs)
    static async getAdminEnquiries(req, res) {
        try {
            // 1. Fetch form inquiries
            const standardInquiries = await db.inquiry?.findMany({
                orderBy: { submissionDate: 'desc' }
            }) || [];
            // 2. Fetch all estimate & brief messages from projects
            const projects = await db.project?.findMany({
                include: {
                    ClientAccount: true,
                    conversations: {
                        include: {
                            Message: {
                                orderBy: { createdAt: 'asc' }
                            }
                        }
                    }
                }
            }) || [];
            const enrichedEnquiries = [];
            // Add project-linked enquiries
            for (const p of projects) {
                const conv = p.conversations?.[0];
                const msgs = conv?.Message || [];
                const enquiryMsgs = msgs.filter((m) => m.body?.includes('[ESTIMATE ENQUIRY]') ||
                    m.body?.includes('[NEW PROJECT BRIEF') ||
                    m.clientNonce === 'CLIENT_MSG');
                if (enquiryMsgs.length > 0 || msgs.length > 0) {
                    const latest = msgs[msgs.length - 1];
                    const hasUnrepliedClientMsg = latest && (latest.clientNonce === 'CLIENT_MSG' || latest.senderName === 'Client');
                    const isScope = msgs.some((m) => m.body?.includes('[ESTIMATE ENQUIRY]'));
                    enrichedEnquiries.push({
                        id: `proj-${p.id}`,
                        projectId: p.id,
                        conversationId: conv?.id,
                        clientName: p.name || 'Client Project',
                        clientEmail: p.ClientAccount?.[0]?.email || 'client@example.com',
                        type: isScope ? 'SCOPE_ESTIMATE' : 'PROJECT_DISCUSSION',
                        status: hasUnrepliedClientMsg ? 'NEW' : 'REPLIED',
                        createdAt: p.createdAt,
                        latestMessage: latest?.body || 'No messages yet',
                        messages: msgs.map((m) => ({
                            id: m.id,
                            text: m.body,
                            senderName: m.clientNonce === 'CLIENT_MSG' ? 'Client' : 'Admin Team',
                            createdAt: m.createdAt,
                            clientNonce: m.clientNonce
                        }))
                    });
                }
            }
            // Add standalone database inquiries
            for (const inq of standardInquiries) {
                enrichedEnquiries.push({
                    id: `inq-${inq.id}`,
                    projectId: null,
                    conversationId: null,
                    clientName: inq.name || 'Website Visitor',
                    clientEmail: inq.email,
                    type: inq.service ? 'SCOPE_ESTIMATE' : 'GENERAL_LEAD',
                    status: inq.status || 'NEW',
                    createdAt: inq.submissionDate,
                    latestMessage: inq.message,
                    messages: [
                        {
                            id: `msg-${inq.id}`,
                            text: inq.message,
                            senderName: 'Client',
                            createdAt: inq.submissionDate,
                            clientNonce: 'CLIENT_MSG'
                        }
                    ]
                });
            }
            // Sort newest first
            enrichedEnquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            res.status(200).json(enrichedEnquiries);
        }
        catch (error) {
            console.error('Error fetching admin enquiries:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Admin Endpoint: Reply to an enquiry
    static async postAdminReply(req, res) {
        try {
            const { id } = req.params;
            const { text, projectId } = req.body;
            if (!text?.trim()) {
                return res.status(400).json({ error: 'Message text is required' });
            }
            let actualProjectId = projectId;
            if (!actualProjectId && id.startsWith('proj-')) {
                actualProjectId = id.replace('proj-', '');
            }
            let createdMessage = null;
            if (actualProjectId) {
                // Find or create conversation for project
                let conv = await db.conversation?.findFirst({
                    where: { projectId: actualProjectId }
                });
                if (!conv) {
                    conv = await db.conversation?.create({
                        data: {
                            projectId: actualProjectId,
                            type: 'project',
                            updatedAt: new Date()
                        }
                    });
                }
                const defaultUser = await db.user?.findFirst();
                const senderId = req.user?.id || defaultUser?.id;
                createdMessage = await db.message?.create({
                    data: {
                        id: Date.now().toString(),
                        conversationId: conv.id,
                        body: text.trim(),
                        senderId: senderId,
                        clientNonce: 'ADMIN_MSG'
                    }
                });
                // Broadcast via Socket.io
                try {
                    if (index_1.io) {
                        index_1.io.to(actualProjectId).emit('receive_message', {
                            id: createdMessage.id,
                            conversationId: conv.id,
                            senderName: 'Admin Team',
                            text: text.trim(),
                            createdAt: createdMessage.createdAt
                        });
                    }
                }
                catch (sockErr) {
                    console.warn('Socket emit warning:', sockErr);
                }
            }
            // If it's a standalone inquiry, update its status
            if (id.startsWith('inq-')) {
                const rawInqId = id.replace('inq-', '');
                await db.inquiry?.update({
                    where: { id: rawInqId },
                    data: { status: 'RESOLVED' }
                });
            }
            res.status(200).json({
                success: true,
                message: createdMessage ? {
                    id: createdMessage.id,
                    text: createdMessage.body,
                    senderName: 'Admin Team',
                    createdAt: createdMessage.createdAt.toISOString()
                } : {
                    id: (0, uuid_1.v4)(),
                    text: text.trim(),
                    senderName: 'Admin Team',
                    createdAt: new Date().toISOString()
                }
            });
        }
        catch (error) {
            console.error('Error replying to enquiry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Admin Endpoint: Update enquiry status
    static async updateEnquiryStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            if (id.startsWith('inq-')) {
                const rawInqId = id.replace('inq-', '');
                await db.inquiry?.update({
                    where: { id: rawInqId },
                    data: { status: status || 'RESOLVED' }
                });
            }
            res.status(200).json({ success: true, status });
        }
        catch (error) {
            console.error('Error updating enquiry status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Public Endpoint: Get Enquiry by token
    static async getEnquiryByToken(req, res) {
        try {
            const { token } = req.params;
            const enquiry = await db.inquiry?.findFirst({
                where: { id: token }
            });
            if (!enquiry) {
                return res.status(404).json({ error: 'Enquiry not found' });
            }
            res.status(200).json(enquiry);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Admin Endpoint: Convert to project
    static async convertToProject(req, res) {
        try {
            res.status(200).json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.EnquiryController = EnquiryController;
//# sourceMappingURL=EnquiryController.js.map