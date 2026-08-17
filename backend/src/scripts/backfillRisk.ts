import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function backfillRisk() {
  console.log('Starting risk snapshot backfill...');
  
  const projects = await prisma.project.findMany({
    include: {
      ProjectRiskSnapshot: true
    }
  });

  for (const project of projects) {
    if (project.ProjectRiskSnapshot.length >= 3) {
      console.log(`Skipping project ${project.name}, already has history.`);
      continue;
    }

    console.log(`Backfilling project: ${project.name}`);

    // Generate 30 days of data going forward from 30 days ago to today
    const now = new Date();
    const ALPHA = 0.4;
    let prevScores = { schedule: 10, budget: 10, communication: 10, scopeDrift: 10 };

    for (let i = 30; i >= 0; i--) {
      const computedAt = new Date(now.getTime() - i * 24 * 3600 * 1000);

      // Introduce a slight noisy drift for realistic data
      // For example, communication risk spikes briefly then smooths out
      let rawSchedule = 10 + (Math.random() * 20);
      let rawBudget = 10 + (Math.random() * 15);
      let rawComm = 10 + (Math.random() * (i % 5 === 0 ? 50 : 10)); // spike every 5 days
      let rawScope = 10 + (30 - i); // gradual drift up

      // Clamp raw
      rawSchedule = Math.min(100, Math.max(0, rawSchedule));
      rawBudget = Math.min(100, Math.max(0, rawBudget));
      rawComm = Math.min(100, Math.max(0, rawComm));
      rawScope = Math.min(100, Math.max(0, rawScope));

      // Apply EMA
      const scores = {
        schedule: Math.round((ALPHA * rawSchedule) + ((1 - ALPHA) * prevScores.schedule)),
        budget: Math.round((ALPHA * rawBudget) + ((1 - ALPHA) * prevScores.budget)),
        communication: Math.round((ALPHA * rawComm) + ((1 - ALPHA) * prevScores.communication)),
        scopeDrift: Math.round((ALPHA * rawScope) + ((1 - ALPHA) * prevScores.scopeDrift))
      };

      await prisma.projectRiskSnapshot.create({
        data: {
          id: uuidv4(),
          projectId: project.id,
          axisScores: scores,
          computedAt,
          causeSummary: i % 10 === 0 ? 'Synthetic drift applied' : null
        }
      });

      prevScores = scores;
    }
    
    console.log(`Finished backfilling 30 snapshots for ${project.name}`);
  }

  console.log('Backfill complete!');
}

backfillRisk().catch(console.error).finally(() => prisma.$disconnect());
