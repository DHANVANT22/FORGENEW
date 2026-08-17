import prisma from '../utils/db';

export class ScenarioService {
  public async createScenario(data: { inputs: any; computedBand: string; estimateId?: string; inquiryId?: string; projectId?: string }) {
    return prisma.scenario.create({
      data: {
        inputs: data.inputs,
        computedBand: data.computedBand,
        estimateId: data.estimateId,
        inquiryId: data.inquiryId,
        projectId: data.projectId,
      },
    });
  }

  public async getScenariosByProject(projectId: string) {
    return prisma.scenario.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }
}
