import { Request, Response } from 'express';
import { ScenarioService } from '../services/ScenarioService';

const scenarioService = new ScenarioService();

export class ScenarioController {
  public static async createScenario(req: Request, res: Response) {
    try {
      const { inputs, computedBand, estimateId, inquiryId, projectId } = req.body;
      const scenario = await scenarioService.createScenario({ inputs, computedBand, estimateId, inquiryId, projectId });
      res.status(201).json(scenario);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  public static async getScenariosByProject(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const scenarios = await scenarioService.getScenariosByProject(id as string);
      res.status(200).json(scenarios);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
