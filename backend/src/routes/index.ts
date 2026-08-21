import { Router } from 'express';
import { EstimateController } from '../controllers/EstimateController';
import { DraftEstimateController } from '../controllers/DraftEstimateController';
import { ScenarioController } from '../controllers/ScenarioController';
import { PulseController } from '../controllers/PulseController';
import { ClientAuthController } from '../controllers/ClientAuthController';
import { ChatController } from '../controllers/ChatController';
import { ConfigController } from '../controllers/ConfigController';
import { ClientProjectController } from '../controllers/ClientProjectController';
import { AdminProjectController } from '../controllers/AdminProjectController';
import { ControlCentreController } from '../controllers/ControlCentreController';
import { RiskOutcomeController } from '../controllers/RiskOutcomeController';
import { RiskAlertController } from '../controllers/RiskAlertController';
import { requireClientAuth, requireAdminAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { BlogSchema, ClientAuthSchema, ClientInviteSchema } from '../schemas';

import { EnquiryController } from '../controllers/EnquiryController';

const router = Router();

// Enquiries
router.post('/v1/enquiries', EnquiryController.createEnquiry);
router.get('/v1/enquiries/:token', EnquiryController.getEnquiryByToken);
router.get('/v1/admin/enquiries', requireAdminAuth, EnquiryController.getAdminEnquiries);
router.post('/v1/admin/enquiries/:id/reply', requireAdminAuth, EnquiryController.postAdminReply);
router.put('/v1/admin/enquiries/:id/status', requireAdminAuth, EnquiryController.updateEnquiryStatus);

// Chat
router.get('/v1/projects/:projectId/messages', requireClientAuth, ChatController.getMessages);
router.post('/v1/projects/:projectId/messages', requireClientAuth, ChatController.sendMessage);
router.get('/v1/admin/projects/:projectId/messages', requireAdminAuth, ChatController.getMessages);
router.post('/v1/admin/projects/:projectId/messages', requireAdminAuth, ChatController.sendMessage);

// Estimates
router.post('/v1/estimates', EstimateController.createEstimate);
router.get('/v1/admin/estimates/stale', requireAdminAuth, EstimateController.getStaleEstimates);
router.get('/v1/estimates', requireAdminAuth, EstimateController.getEstimates);
router.post('/v1/estimates/progress', EstimateController.trackProgress);
router.get('/v1/estimates/progress/funnel', EstimateController.getFunnelStats);

router.post('/v1/estimates/draft', DraftEstimateController.saveDraft);
router.get('/v1/estimates/draft/:sessionId', DraftEstimateController.getDraft);

// Scenarios
router.post('/v1/scenarios', ScenarioController.createScenario);
router.get('/v1/projects/:id/risk', ScenarioController.getScenariosByProject);

// Config
router.get('/v1/config/tier-weights', ConfigController.getTierWeights);
router.put('/v1/config/tier-weights', requireAdminAuth, ConfigController.updateTierWeights);
router.get('/v1/config/tier-cutoffs', ConfigController.getTierCutoffs);
router.put('/v1/config/tier-cutoffs', requireAdminAuth, ConfigController.updateTierCutoffs);
router.post('/v1/config/tier-weights/preview', requireAdminAuth, ConfigController.previewTierWeights);

import rateLimit from 'express-rate-limit';

const pulseRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Reasonable limit per IP window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Pulse
router.post('/v1/projects/:id/pulse-token', requireAdminAuth, PulseController.generateToken);
router.post('/v1/projects/:id/pulse-token/rotate', requireAdminAuth, PulseController.rotateToken);
router.get('/v1/pulse/:token', pulseRateLimit, PulseController.getSnapshot);

// Client Auth
router.post('/v1/client-auth/signup', ClientAuthController.signupClient);
router.post('/v1/client-auth/invite', requireAdminAuth, validate(ClientInviteSchema), ClientAuthController.inviteClient);
router.post('/v1/client-auth/invite/resend', requireAdminAuth, ClientAuthController.resendInvite);
router.post('/v1/client-auth/revoke/:accountId', requireAdminAuth, ClientAuthController.revokeAccess);
router.post('/v1/client-auth/login', ClientAuthController.loginClient);
router.post('/v1/client-auth/logout', ClientAuthController.logoutClient);
router.get('/v1/client-auth/me', requireClientAuth, ClientAuthController.getMe);
router.post('/v1/client-auth/setup', ClientAuthController.setupAccount);

// Client Portal
router.get('/v1/client/project', requireClientAuth, ClientProjectController.getProject);
router.post('/v1/client/brief', requireClientAuth, ClientProjectController.submitProjectBrief);
router.put('/v1/client/milestones/:id/approve', requireClientAuth, ClientProjectController.approveMilestone);
router.post('/v1/client/onboarding/complete', requireClientAuth, ClientProjectController.updateOnboardingStatus);
router.put('/v1/client/settings/notifications', requireClientAuth, ClientProjectController.updateNotificationPrefs);

// Admin Project
router.get('/v1/admin/projects', requireAdminAuth, AdminProjectController.getProjects);
router.post('/v1/admin/projects', requireAdminAuth, AdminProjectController.createProject);
router.get('/v1/admin/projects/:id', requireAdminAuth, AdminProjectController.getProject);
router.put('/v1/admin/projects/:id', requireAdminAuth, AdminProjectController.updateProject);
router.put('/v1/admin/projects/:id/tasks/reorder', requireAdminAuth, AdminProjectController.reorderTasks);
router.put('/v1/admin/projects/:id/columns/:columnId/visibility', requireAdminAuth, AdminProjectController.toggleColumnVisibility);
router.put('/v1/admin/projects/:id/milestones/:milestoneId/visibility', requireAdminAuth, AdminProjectController.toggleMilestoneVisibility);
router.patch('/v1/admin/projects/:id/pulse-financials', requireAdminAuth, AdminProjectController.updatePulseFinancialsVisibility);

import { MilestoneController } from '../controllers/MilestoneController';
router.post('/v1/admin/projects/:projectId/milestones', requireAdminAuth, MilestoneController.createMilestone);
router.put('/v1/admin/milestones/:id', requireAdminAuth, MilestoneController.updateMilestone);
router.delete('/v1/admin/milestones/:id', requireAdminAuth, MilestoneController.deleteMilestone);

import { AdminClientController } from '../controllers/AdminClientController';
router.get('/v1/admin/clients', requireAdminAuth, AdminClientController.getClients);
router.post('/v1/admin/clients', requireAdminAuth, AdminClientController.createClient);

import { ActivityLogController } from '../controllers/ActivityLogController';
router.get('/v1/admin/activity', requireAdminAuth, ActivityLogController.getActivityLog);

import { SearchController } from '../controllers/SearchController';
router.get('/v1/admin/search', requireAdminAuth, SearchController.search);

// Risk Simulator
router.get('/v1/projects/:id/risk/history', requireAdminAuth, AdminProjectController.getRiskHistory);
router.post('/v1/projects/:id/risk/preview', requireAdminAuth, AdminProjectController.previewRisk);

router.post('/v1/admin/projects/:projectId/risk/outcome', requireAdminAuth, RiskOutcomeController.logOutcome);
router.get('/v1/admin/projects/:projectId/risk/outcome', requireAdminAuth, RiskOutcomeController.getOutcomes);
router.post('/v1/admin/projects/:projectId/risk/snooze', requireAdminAuth, RiskAlertController.snoozeAlert);

import { BlogController } from '../controllers/BlogController';
import { AuthController } from '../controllers/AuthController';

// Auth
router.post('/v1/auth/admin/login', AuthController.adminLogin);

// Blog
router.post('/v1/blogs', requireAdminAuth, validate(BlogSchema), BlogController.createBlog);
router.put('/v1/blogs/:id', requireAdminAuth, validate(BlogSchema), BlogController.updateBlog);
router.get('/v1/blogs', BlogController.getBlogs);
router.get('/v1/blogs/:slug', BlogController.getBlogBySlug);

// Control Centre
router.post('/v1/control-centre/ideas', requireAdminAuth, ControlCentreController.createIdea);
router.get('/v1/control-centre/ideas', requireAdminAuth, ControlCentreController.getIdeas);
router.get('/v1/control-centre/ideas/:id', requireAdminAuth, ControlCentreController.getIdea);
router.put('/v1/control-centre/ideas/:id', requireAdminAuth, ControlCentreController.updateIdea);
router.get('/v1/control-centre/ideas/:id/revisions', requireAdminAuth, ControlCentreController.getRevisions);
router.get('/v1/control-centre/ideas/:id/revisions/:revisionId', requireAdminAuth, ControlCentreController.getRevision);
router.get('/v1/control-centre/ideas/:id/export', requireAdminAuth, ControlCentreController.exportIdea);
router.post('/v1/control-centre/chat', requireAdminAuth, ControlCentreController.chatIdea);
router.get('/v1/control-centre/ideas/:id/chat', requireAdminAuth, ControlCentreController.getIdeaChat);
router.get('/v1/control-centre/provider-status', requireAdminAuth, ControlCentreController.getProviderStatus);

export default router;
