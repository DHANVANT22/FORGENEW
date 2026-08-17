import cron from 'node-cron';
import prisma from '../utils/db';

export const startWeeklyPulseEmailJob = () => {
  // Run every Friday at 4 PM
  cron.schedule('0 16 * * 5', async () => {
    console.log('Running weekly pulse email digest...');
    try {
      const activeProjects = await prisma.project.findMany({
        where: { status: 'Active' },
        include: {
          columns: {
            include: {
              tasks: true
            }
          },
          ProjectRiskSnapshot: {
            orderBy: { computedAt: 'desc' },
            take: 1
          }
        }
      });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      for (const project of activeProjects) {
        // Collect completed tasks this week
        const allTasks = project.columns.flatMap(c => c.tasks);
        const completedThisWeek = allTasks.filter(t => t.isCompleted && t.updatedAt && new Date(t.updatedAt) > oneWeekAgo);

        const latestRisk = project.ProjectRiskSnapshot[0];
        
        let riskBand = 'Healthy';
        if (latestRisk) {
          const scores: any = latestRisk.axisScores;
          const maxScore = Math.max(
            scores.schedule ?? 0, 
            scores.budget ?? 0, 
            scores.communication ?? 0, 
            scores.scopeDrift ?? 0
          );
          if (maxScore >= 75) riskBand = 'Needs Attention';
          else if (maxScore >= 40) riskBand = 'Monitoring';
        }

        console.log(`[Pulse Digest] Project: ${project.name}`);
        console.log(` - Completed tasks: ${completedThisWeek.length}`);
        console.log(` - Risk Status: ${riskBand}`);
        if (latestRisk?.causeSummary) {
          console.log(` - Risk Summary: ${latestRisk.causeSummary}`);
        }
        
        // Mock sending email
        // sendEmail(clientEmail, "Weekly Pulse Report", ...)
      }
      console.log('Weekly pulse email digest complete.');
    } catch (e) {
      console.error('Error running weekly pulse job', e);
    }
  });
};
