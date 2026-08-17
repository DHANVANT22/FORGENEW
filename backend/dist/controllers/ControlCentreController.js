"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControlCentreController = void 0;
const db_1 = __importDefault(require("../utils/db"));
const uuid_1 = require("uuid");
const notification_service_1 = require("../services/notification.service");
function generateBaseSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
async function generateUniqueSlug(baseSlug) {
    let slug = baseSlug || 'untitled-idea';
    let counter = 1;
    while (true) {
        const existing = await db_1.default.controlCentreIdea.findUnique({ where: { slug } });
        if (!existing)
            return slug;
        counter++;
        slug = `${baseSlug}-${counter}`;
    }
}
class ControlCentreController {
    static async createIdea(req, res) {
        try {
            const { title, content } = req.body;
            const adminId = req.user?.id;
            if (!adminId)
                return res.status(401).json({ error: 'Unauthorized' });
            if (!title || !content)
                return res.status(400).json({ error: 'Missing title or content' });
            const baseSlug = generateBaseSlug(title);
            const slug = await generateUniqueSlug(baseSlug);
            const ideaId = (0, uuid_1.v4)();
            await db_1.default.$transaction(async (tx) => {
                await tx.controlCentreIdea.create({
                    data: {
                        id: ideaId,
                        title,
                        slug,
                        content,
                        createdById: adminId,
                        version: 1,
                        revisions: {
                            create: {
                                content,
                                version: 1,
                                editedById: adminId,
                                changeSummary: 'Initial creation'
                            }
                        }
                    }
                });
                await tx.activityEvent.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        actorId: adminId,
                        actorName: req.user?.name || 'Admin',
                        action: 'CREATED_IDEA',
                        entityType: 'ControlCentreIdea',
                        entityId: ideaId,
                        entityLabel: title
                    }
                });
            });
            const newIdea = await db_1.default.controlCentreIdea.findUnique({
                where: { id: ideaId },
                include: { revisions: true }
            });
            res.status(201).json(newIdea);
        }
        catch (error) {
            console.error('Error creating idea:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getIdeas(req, res) {
        try {
            const ideas = await db_1.default.controlCentreIdea.findMany({
                orderBy: { updatedAt: 'desc' },
                include: {
                    revisions: {
                        select: { editedById: true }
                    }
                }
            });
            // Format for list view
            const formatted = ideas.map(idea => {
                const uniqueContributors = new Set(idea.revisions.map(r => r.editedById));
                const lastEditorId = idea.revisions.length > 0 ? idea.revisions[idea.revisions.length - 1].editedById : idea.createdById;
                return {
                    id: idea.id,
                    title: idea.title,
                    slug: idea.slug,
                    status: idea.status,
                    updatedAt: idea.updatedAt,
                    contributorCount: uniqueContributors.size,
                    lastEditedById: lastEditorId
                };
            });
            res.status(200).json(formatted);
        }
        catch (error) {
            console.error('Error getting ideas:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getIdea(req, res) {
        try {
            const { id } = req.params;
            const idea = await db_1.default.controlCentreIdea.findUnique({
                where: { id }
            });
            if (!idea)
                return res.status(404).json({ error: 'Idea not found' });
            res.status(200).json(idea);
        }
        catch (error) {
            console.error('Error getting idea:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async updateIdea(req, res) {
        try {
            const { id } = req.params;
            const { title, content, version, changeSummary } = req.body;
            const adminId = req.user?.id;
            if (!adminId)
                return res.status(401).json({ error: 'Unauthorized' });
            // Load current idea inside transaction
            const updatedIdea = await db_1.default.$transaction(async (tx) => {
                const currentIdea = await tx.controlCentreIdea.findUnique({
                    where: { id },
                    include: { revisions: true }
                });
                if (!currentIdea)
                    throw new Error('NOT_FOUND');
                // Optimistic concurrency check
                if (currentIdea.version !== version) {
                    throw new Error('CONFLICT');
                }
                const newVersion = currentIdea.version + 1;
                const updated = await tx.controlCentreIdea.update({
                    where: { id },
                    data: {
                        title: title || currentIdea.title,
                        content,
                        version: newVersion,
                        revisions: {
                            create: {
                                content,
                                version: newVersion,
                                editedById: adminId,
                                changeSummary: changeSummary || 'Edited content'
                            }
                        }
                    },
                    include: { revisions: true }
                });
                await tx.activityEvent.create({
                    data: {
                        id: (0, uuid_1.v4)(),
                        actorId: adminId,
                        actorName: req.user?.name || 'Admin',
                        action: 'UPDATED_IDEA',
                        entityType: 'ControlCentreIdea',
                        entityId: id,
                        entityLabel: updated.title
                    }
                });
                return updated;
            });
            // Send notifications to previous editors, excluding the current admin
            const previousEditors = new Set(updatedIdea.revisions.map(r => r.editedById));
            previousEditors.delete(adminId);
            for (const editorId of previousEditors) {
                await notification_service_1.NotificationService.sendNotification({
                    userId: editorId,
                    type: 'controlcentre.idea_updated',
                    title: 'Idea Updated',
                    message: `The idea "${updatedIdea.title}" was updated.`,
                    actorId: adminId,
                    entityType: 'ControlCentreIdea',
                    entityId: updatedIdea.id,
                    url: `/control-centre/${updatedIdea.id}`
                });
            }
            res.status(200).json(updatedIdea);
        }
        catch (error) {
            if (error.message === 'NOT_FOUND') {
                return res.status(404).json({ error: 'Idea not found' });
            }
            if (error.message === 'CONFLICT') {
                // Must return the current content and version for the client to show a conflict
                const current = await db_1.default.controlCentreIdea.findUnique({ where: { id: req.params.id } });
                return res.status(409).json({
                    error: 'Conflict: The idea was updated by someone else.',
                    currentContent: current?.content,
                    currentVersion: current?.version
                });
            }
            console.error('Error updating idea:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getRevisions(req, res) {
        try {
            const { id } = req.params;
            const revisions = await db_1.default.controlCentreRevision.findMany({
                where: { ideaId: id },
                orderBy: { version: 'desc' },
                select: {
                    id: true,
                    version: true,
                    editedById: true,
                    changeSummary: true,
                    createdAt: true
                }
            });
            res.status(200).json(revisions);
        }
        catch (error) {
            console.error('Error getting revisions:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getRevision(req, res) {
        try {
            const { revisionId } = req.params;
            const revision = await db_1.default.controlCentreRevision.findUnique({
                where: { id: revisionId }
            });
            if (!revision)
                return res.status(404).json({ error: 'Revision not found' });
            res.status(200).json(revision);
        }
        catch (error) {
            console.error('Error getting revision:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async exportIdea(req, res) {
        try {
            const { id } = req.params;
            const idea = await db_1.default.controlCentreIdea.findUnique({
                where: { id }
            });
            if (!idea)
                return res.status(404).json({ error: 'Idea not found' });
            res.setHeader('Content-Disposition', `attachment; filename="${idea.slug}.md"`);
            res.setHeader('Content-Type', 'text/markdown');
            res.send(idea.content);
        }
        catch (error) {
            console.error('Error exporting idea:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ControlCentreController = ControlCentreController;
//# sourceMappingURL=ControlCentreController.js.map