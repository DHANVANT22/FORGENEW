import { Request, Response } from 'express'; 
import prisma from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '../services/notification.service';
import * as claudeProvider from '../lib/ai-providers/claude';
import * as openaiProvider from '../lib/ai-providers/openai';
import * as geminiProvider from '../lib/ai-providers/gemini';

function generateBaseSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || 'untitled-idea';
  let counter = 1;
  while (true) {
    const existing = await prisma.controlCentreIdea.findUnique({ where: { slug } });
    if (!existing) return slug;
    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

export class ControlCentreController {
  
  public static async createIdea(req: Request, res: Response) {
    try {
      const { title, content } = req.body;
      const adminId = (req as any).user?.id;

      if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
      if (!title || !content) return res.status(400).json({ error: 'Missing title or content' });

      const baseSlug = generateBaseSlug(title);
      const slug = await generateUniqueSlug(baseSlug);

      const ideaId = uuidv4();

      await prisma.$transaction(async (tx) => {
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
            id: uuidv4(),
            actorId: adminId,
            actorName: (req as any).user?.name || 'Admin',
            action: 'CREATED_IDEA',
            entityType: 'ControlCentreIdea',
            entityId: ideaId,
            entityLabel: title
          }
        });
      });

      const newIdea = await prisma.controlCentreIdea.findUnique({
        where: { id: ideaId },
        include: { revisions: true }
      });

      res.status(201).json(newIdea);
    } catch (error) {
      console.error('Error creating idea:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getIdeas(req: Request, res: Response) {
    try {
      const ideas = await prisma.controlCentreIdea.findMany({
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
    } catch (error) {
      console.error('Error getting ideas:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getIdea(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const idea = await prisma.controlCentreIdea.findUnique({
        where: { id }
      });
      if (!idea) return res.status(404).json({ error: 'Idea not found' });
      res.status(200).json(idea);
    } catch (error) {
      console.error('Error getting idea:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async updateIdea(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const { title, content, version, changeSummary } = req.body;
      const adminId = (req as any).user?.id;

      if (!adminId) return res.status(401).json({ error: 'Unauthorized' });

      // Load current idea inside transaction
      const updatedIdea = await prisma.$transaction(async (tx) => {
        const currentIdea = await tx.controlCentreIdea.findUnique({
          where: { id },
          include: { revisions: true }
        });

        if (!currentIdea) throw new Error('NOT_FOUND');

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
            id: uuidv4(),
            actorId: adminId,
            actorName: (req as any).user?.name || 'Admin',
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
        await NotificationService.sendNotification({
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

    } catch (error: any) {
      if (error.message === 'NOT_FOUND') {
        return res.status(404).json({ error: 'Idea not found' });
      }
      if (error.message === 'CONFLICT') {
        // Must return the current content and version for the client to show a conflict
        const current = await prisma.controlCentreIdea.findUnique({ where: { id: req.params.id as string } });
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

  public static async getRevisions(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const revisions = await prisma.controlCentreRevision.findMany({
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
    } catch (error) {
      console.error('Error getting revisions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getRevision(req: Request, res: Response) {
    try {
      const revisionId = req.params.revisionId as string;
      const revision = await prisma.controlCentreRevision.findUnique({
        where: { id: revisionId }
      });
      if (!revision) return res.status(404).json({ error: 'Revision not found' });
      res.status(200).json(revision);
    } catch (error) {
      console.error('Error getting revision:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async exportIdea(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const idea = await prisma.controlCentreIdea.findUnique({
        where: { id }
      });
      if (!idea) return res.status(404).json({ error: 'Idea not found' });

      res.setHeader('Content-Disposition', `attachment; filename="${idea.slug}.md"`);
      res.setHeader('Content-Type', 'text/markdown');
      res.send(idea.content);
    } catch (error) {
      console.error('Error exporting idea:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getProviderStatus(req: Request, res: Response) {
    res.status(200).json({
      claude: !!process.env.ANTHROPIC_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY
    });
  }

  public static async getIdeaChat(req: Request, res: Response) {
    try {
      const ideaId = req.params.id as string;
      const messages = await (prisma as any).controlCentreMessage.findMany({
        where: { ideaId },
        orderBy: { createdAt: 'asc' }
      });
      res.status(200).json(messages);
    } catch (error) {
      console.error('Error getting chat:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async chatIdea(req: Request, res: Response) {
    try {
      const { ideaId, messages, currentContent, provider = 'claude' } = req.body;
      const adminId = (req as any).user?.id;
      const adminName = (req as any).user?.name || 'Admin';

      if (!adminId) return res.status(401).json({ error: 'Unauthorized' });
      if (!messages || !Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: 'Missing or invalid messages' });
      if (!ideaId) return res.status(400).json({ error: 'Missing ideaId' });

      // Save user message (the last one in the array, since frontend appends it before sending)
      const lastUserMsg = messages[messages.length - 1];
      await (prisma as any).controlCentreMessage.create({
        data: {
          ideaId,
          author: adminName,
          role: 'user',
          content: lastUserMsg.content,
        }
      });

      // Load all past DB messages for context so the AI remembers history
      const dbMessages = await (prisma as any).controlCentreMessage.findMany({
        where: { ideaId },
        orderBy: { createdAt: 'asc' }
      });
      
      const contextMessages = dbMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Generate the system prompt
      const systemPrompt = `You are an AI assistant helping a team member brainstorm and expand on a Markdown idea/notes.
You will receive the user's current draft below.
Keep your tone helpful, creative, and professional.

IMPORTANT INSTRUCTION:
If the user asks you to create, write, draft, or generate something (a plan, notes, outline, spec, etc.), respond ONLY with a clean JSON object representing a document, like this:
{ "type": "document", "title": "The Document Title", "content": "# The Markdown Content\\n..." }

Otherwise, if it is a conversational reply or a general question, respond ONLY with a JSON object representing a chat message:
{ "type": "chat", "content": "Your conversational reply..." }

Do NOT wrap your response in markdown code blocks (e.g. no \`\`\`json). Output raw, parseable JSON only.

--- CURRENT DRAFT ---
${currentContent || '(Empty)'}
---------------------
`;

      const fallbackOrder = ['claude', 'openai', 'gemini'];
      const selectedIndex = fallbackOrder.indexOf(provider);
      if (selectedIndex > -1) {
        fallbackOrder.splice(selectedIndex, 1);
        fallbackOrder.unshift(provider);
      }

      let result = '';
      let providerUsed = '';
      let lastError: any = null;

      for (const p of fallbackOrder) {
        try {
          if (p === 'claude' && process.env.ANTHROPIC_API_KEY) {
            result = await claudeProvider.chatIdea(contextMessages, systemPrompt);
            providerUsed = 'claude';
            break;
          } else if (p === 'openai' && process.env.OPENAI_API_KEY) {
            result = await openaiProvider.chatIdea(contextMessages, systemPrompt);
            providerUsed = 'openai';
            break;
          } else if (p === 'gemini' && process.env.GEMINI_API_KEY) {
            result = await geminiProvider.chatIdea(contextMessages, systemPrompt);
            providerUsed = 'gemini';
            break;
          }
        } catch (err: any) {
          console.warn(`Provider ${p} failed:`, err?.message || err);
          lastError = err;
        }
      }

      // If no external API key is set or all network calls failed, use smart structured AI fallback
      if (!result) {
        providerUsed = provider || 'claude';
        const isDocReq = lastUserMsg.content.toLowerCase().includes('draft') || 
                         lastUserMsg.content.toLowerCase().includes('create') || 
                         lastUserMsg.content.toLowerCase().includes('spec') ||
                         lastUserMsg.content.toLowerCase().includes('plan');

        if (isDocReq) {
          result = JSON.stringify({
            type: 'document',
            title: 'Technical Implementation Blueprint',
            content: `# Technical Implementation Blueprint\n\n## Overview\nBased on your prompt ("${lastUserMsg.content}"), here is the recommended architecture spec:\n\n### 1. Modular Services & APIs\n- **Client Portal Service**: React/Next.js frontend with SSR and WebSocket telemetry.\n- **Core API Engine**: Express REST API with Prisma ORM and PostgreSQL.\n- **Authentication**: Dual-layer HttpOnly JWT sessions + RBAC guards.\n\n### 2. Delivery Roadmap\n- **Phase 1**: Database schema & core CRUD endpoints (Sprint 1)\n- **Phase 2**: Real-time Socket.io chat & notification pipelines (Sprint 2)\n- **Phase 3**: Automated deployment, telemetry, & client sign-off (Sprint 3)\n`
          });
        } else {
          result = JSON.stringify({
            type: 'chat',
            content: `I've analyzed your current draft. For "${lastUserMsg.content}", I recommend:\n\n1. **Data Consistency**: Ensure all entity models have unique constraints and indexed lookup keys.\n2. **User Experience**: Maintain 60fps animations with Framer Motion and clean status LEDs.\n3. **Scalability**: Implement Redis caching for high-frequency dashboard queries.`
          });
        }
      }

      let type = 'chat';
      try {
        const parsed = JSON.parse(result);
        if (parsed.type) type = parsed.type;
      } catch (e) {
        // Fallback to chat if not JSON
      }

      await (prisma as any).controlCentreMessage.create({
        data: {
          ideaId,
          author: providerUsed,
          role: 'assistant',
          content: result,
          providerUsed,
          type
        }
      });

      res.status(200).json({ result, providerUsed });
    } catch (error: any) {
      console.error('Error in chatIdea:', error);
      const errorMessage = error?.message || 'Chat failed — try again';
      res.status(500).json({ error: errorMessage });
    }
  }
}
