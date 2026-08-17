"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EstimateController_1 = require("../controllers/EstimateController");
const DraftEstimateController_1 = require("../controllers/DraftEstimateController");
const ScenarioController_1 = require("../controllers/ScenarioController");
const PulseController_1 = require("../controllers/PulseController");
const ClientAuthController_1 = require("../controllers/ClientAuthController");
const ChatController_1 = require("../controllers/ChatController");
const ConfigController_1 = require("../controllers/ConfigController");
const ClientProjectController_1 = require("../controllers/ClientProjectController");
const AdminProjectController_1 = require("../controllers/AdminProjectController");
const ControlCentreController_1 = require("../controllers/ControlCentreController");
const RiskOutcomeController_1 = require("../controllers/RiskOutcomeController");
const RiskAlertController_1 = require("../controllers/RiskAlertController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const schemas_1 = require("../schemas");
const router = (0, express_1.Router)();
// Chat
router.get('/v1/projects/:projectId/messages', auth_1.requireClientAuth, ChatController_1.ChatController.getMessages);
router.post('/v1/projects/:projectId/messages', auth_1.requireClientAuth, ChatController_1.ChatController.sendMessage);
router.get('/v1/admin/projects/:projectId/messages', auth_1.requireAdminAuth, ChatController_1.ChatController.getMessages);
router.post('/v1/admin/projects/:projectId/messages', auth_1.requireAdminAuth, ChatController_1.ChatController.sendMessage);
// Estimates
router.post('/v1/estimates', EstimateController_1.EstimateController.createEstimate);
router.get('/v1/admin/estimates/stale', auth_1.requireAdminAuth, EstimateController_1.EstimateController.getStaleEstimates);
router.get('/v1/estimates', auth_1.requireAdminAuth, EstimateController_1.EstimateController.getEstimates);
router.post('/v1/estimates/progress', EstimateController_1.EstimateController.trackProgress);
router.get('/v1/estimates/progress/funnel', EstimateController_1.EstimateController.getFunnelStats);
router.post('/v1/estimates/draft', DraftEstimateController_1.DraftEstimateController.saveDraft);
router.get('/v1/estimates/draft/:sessionId', DraftEstimateController_1.DraftEstimateController.getDraft);
// Scenarios
router.post('/v1/scenarios', ScenarioController_1.ScenarioController.createScenario);
router.get('/v1/projects/:id/risk', ScenarioController_1.ScenarioController.getScenariosByProject);
// Config
router.get('/v1/config/tier-weights', ConfigController_1.ConfigController.getTierWeights);
router.put('/v1/config/tier-weights', auth_1.requireAdminAuth, ConfigController_1.ConfigController.updateTierWeights);
router.get('/v1/config/tier-cutoffs', ConfigController_1.ConfigController.getTierCutoffs);
router.put('/v1/config/tier-cutoffs', auth_1.requireAdminAuth, ConfigController_1.ConfigController.updateTierCutoffs);
router.post('/v1/config/tier-weights/preview', auth_1.requireAdminAuth, ConfigController_1.ConfigController.previewTierWeights);
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const pulseRateLimit = (0, express_rate_limit_1.default)({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 pulse snapshot reads per `window` (here, per 10 minutes)
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Pulse
router.post('/v1/projects/:id/pulse-token', auth_1.requireAdminAuth, PulseController_1.PulseController.generateToken);
router.post('/v1/projects/:id/pulse-token/rotate', auth_1.requireAdminAuth, PulseController_1.PulseController.rotateToken);
router.get('/v1/pulse/:token', pulseRateLimit, PulseController_1.PulseController.getSnapshot);
// Client Auth
router.post('/v1/client-auth/invite', auth_1.requireAdminAuth, (0, validate_1.validate)(schemas_1.ClientInviteSchema), ClientAuthController_1.ClientAuthController.inviteClient);
router.post('/v1/client-auth/invite/resend', auth_1.requireAdminAuth, ClientAuthController_1.ClientAuthController.resendInvite);
router.post('/v1/client-auth/revoke/:accountId', auth_1.requireAdminAuth, ClientAuthController_1.ClientAuthController.revokeAccess);
router.post('/v1/client-auth/login', (0, validate_1.validate)(schemas_1.ClientAuthSchema), ClientAuthController_1.ClientAuthController.loginClient);
router.post('/v1/client-auth/setup', ClientAuthController_1.ClientAuthController.setupAccount);
// Client Portal
router.get('/v1/client/project', auth_1.requireClientAuth, ClientProjectController_1.ClientProjectController.getProject);
router.put('/v1/client/milestones/:id/approve', auth_1.requireClientAuth, ClientProjectController_1.ClientProjectController.approveMilestone);
router.post('/v1/client/onboarding/complete', auth_1.requireClientAuth, ClientProjectController_1.ClientProjectController.updateOnboardingStatus);
router.put('/v1/client/settings/notifications', auth_1.requireClientAuth, ClientProjectController_1.ClientProjectController.updateNotificationPrefs);
// Admin Project
router.get('/v1/admin/projects', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.getProjects);
router.post('/v1/admin/projects', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.createProject);
router.get('/v1/admin/projects/:id', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.getProject);
router.put('/v1/admin/projects/:id', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.updateProject);
router.put('/v1/admin/projects/:id/tasks/reorder', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.reorderTasks);
router.put('/v1/admin/projects/:id/columns/:columnId/visibility', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.toggleColumnVisibility);
router.put('/v1/admin/projects/:id/milestones/:milestoneId/visibility', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.toggleMilestoneVisibility);
const MilestoneController_1 = require("../controllers/MilestoneController");
router.post('/v1/admin/projects/:projectId/milestones', auth_1.requireAdminAuth, MilestoneController_1.MilestoneController.createMilestone);
router.put('/v1/admin/milestones/:id', auth_1.requireAdminAuth, MilestoneController_1.MilestoneController.updateMilestone);
router.delete('/v1/admin/milestones/:id', auth_1.requireAdminAuth, MilestoneController_1.MilestoneController.deleteMilestone);
const AdminClientController_1 = require("../controllers/AdminClientController");
router.get('/v1/admin/clients', auth_1.requireAdminAuth, AdminClientController_1.AdminClientController.getClients);
const ActivityLogController_1 = require("../controllers/ActivityLogController");
router.get('/v1/admin/activity', auth_1.requireAdminAuth, ActivityLogController_1.ActivityLogController.getActivityLog);
const SearchController_1 = require("../controllers/SearchController");
router.get('/v1/admin/search', auth_1.requireAdminAuth, SearchController_1.SearchController.search);
// Risk Simulator
router.get('/v1/projects/:id/risk/history', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.getRiskHistory);
router.post('/v1/projects/:id/risk/preview', auth_1.requireAdminAuth, AdminProjectController_1.AdminProjectController.previewRisk);
router.post('/v1/admin/projects/:projectId/risk/outcome', auth_1.requireAdminAuth, RiskOutcomeController_1.RiskOutcomeController.logOutcome);
router.get('/v1/admin/projects/:projectId/risk/outcome', auth_1.requireAdminAuth, RiskOutcomeController_1.RiskOutcomeController.getOutcomes);
router.post('/v1/admin/projects/:projectId/risk/snooze', auth_1.requireAdminAuth, RiskAlertController_1.RiskAlertController.snoozeAlert);
const BlogController_1 = require("../controllers/BlogController");
const AuthController_1 = require("../controllers/AuthController");
// Auth
router.post('/v1/auth/admin/login', AuthController_1.AuthController.adminLogin);
// Blog
router.post('/v1/blogs', auth_1.requireAdminAuth, (0, validate_1.validate)(schemas_1.BlogSchema), BlogController_1.BlogController.createBlog);
router.put('/v1/blogs/:id', auth_1.requireAdminAuth, (0, validate_1.validate)(schemas_1.BlogSchema), BlogController_1.BlogController.updateBlog);
router.get('/v1/blogs', BlogController_1.BlogController.getBlogs);
router.get('/v1/blogs/:slug', BlogController_1.BlogController.getBlogBySlug);
// Control Centre
router.post('/v1/control-centre/ideas', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.createIdea);
router.get('/v1/control-centre/ideas', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.getIdeas);
router.get('/v1/control-centre/ideas/:id', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.getIdea);
router.put('/v1/control-centre/ideas/:id', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.updateIdea);
router.get('/v1/control-centre/ideas/:id/revisions', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.getRevisions);
router.get('/v1/control-centre/ideas/:id/revisions/:revisionId', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.getRevision);
router.get('/v1/control-centre/ideas/:id/export', auth_1.requireAdminAuth, ControlCentreController_1.ControlCentreController.exportIdea);
exports.default = router;
//# sourceMappingURL=index.js.map