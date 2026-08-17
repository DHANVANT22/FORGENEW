import prisma from '../utils/db';
import { TierEngine } from './TierEngine';

export class EstimateService {
  public async createEstimate(data: { answers: any; sourceIpHash: string }) {
    const cutoffsConfig = await prisma.config.findUnique({ where: { key: 'tier_cutoffs' } });
    const cutoffs = (cutoffsConfig?.value as any) || { simple: 8, standard: 16, complex: 26 };
    const { tier, confidenceLow, axisScores } = TierEngine.score(data.answers, cutoffs);
    const estimate = await prisma.estimate.create({
      data: {
        answers: data.answers,
        tier,
        confidenceLow,
        sourceIpHash: data.sourceIpHash,
      },
    });

    const tierCountsConfig = await prisma.config.findUnique({ where: { key: 'tier_counts' } });
    const tierCounts = tierCountsConfig?.value as Record<string, number> || {};
    const similarProjectsCount = tierCounts[tier] || 0;

    return { ...estimate, axisScores, similarProjectsCount };
  }

  public async getEstimates(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.estimate.count()
    ]);
    return {
      data: estimates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}
