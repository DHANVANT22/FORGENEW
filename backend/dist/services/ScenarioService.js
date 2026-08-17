"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioService = void 0;
const db_1 = __importDefault(require("../utils/db"));
class ScenarioService {
    async createScenario(data) {
        return db_1.default.scenario.create({
            data: {
                inputs: data.inputs,
                computedBand: data.computedBand,
                estimateId: data.estimateId,
                inquiryId: data.inquiryId,
                projectId: data.projectId,
            },
        });
    }
    async getScenariosByProject(projectId) {
        return db_1.default.scenario.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
    }
}
exports.ScenarioService = ScenarioService;
//# sourceMappingURL=ScenarioService.js.map