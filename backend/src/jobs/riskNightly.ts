import cron from 'node-cron';
import { RiskService } from '../services/RiskService';

// Run every night at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] Starting nightly risk computation...');
  try {
    await RiskService.computeAll();
    console.log('[Cron] Nightly risk computation completed successfully.');
  } catch (error) {
    console.error('[Cron] Error during nightly risk computation:', error);
  }
});
