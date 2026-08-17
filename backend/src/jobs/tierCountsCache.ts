import cron from 'node-cron';
import prisma from '../utils/db';

export class TierCountsCache {
  static async refresh() {
    try {
      const counts = await prisma.estimate.groupBy({
        by: ['tier'],
        _count: { tier: true },
      });

      const tierCounts: Record<string, number> = {};
      counts.forEach(c => {
        tierCounts[c.tier] = c._count.tier;
      });

      const existing = await prisma.config.findUnique({ where: { key: 'tier_counts' } });
      if (existing) {
        await prisma.config.update({
          where: { key: 'tier_counts' },
          data: { value: tierCounts }
        });
      } else {
        await prisma.config.create({
          data: {
            key: 'tier_counts',
            value: tierCounts
          }
        });
      }
    } catch (e) {
      console.error('Failed to refresh tier counts', e);
    }
  }
}

// Run every hour
cron.schedule('0 * * * *', () => {
  TierCountsCache.refresh();
});
