"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioController = void 0;
const ScenarioService_1 = require("../services/ScenarioService");
const scenarioService = new ScenarioService_1.ScenarioService();
class ScenarioController {
    static async createScenario(req, res) {
        try {
            const { inputs, computedBand, estimateId, inquiryId, projectId } = req.body;
            const scenario = await scenarioService.createScenario({ inputs, computedBand, estimateId, inquiryId, projectId });
            res.status(201).json(scenario);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    static async getScenariosByProject(req, res) {
        try {
            const { id } = req.params;
            const scenarios = await scenarioService.getScenariosByProject(id);
            res.status(200).json(scenarios);
        }
        catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
exports.ScenarioController = ScenarioController;
//# sourceMappingURL=ScenarioController.js.map