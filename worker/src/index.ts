import './utils/env';
import { runMarketRefresh, runNewTokenRadar, runLocalMarket } from './jobs/market';
import { runMatchDailySix, runLiveScore } from './jobs/matches';
import { runTrapRadar } from './jobs/trap';
import { runNewsImpact } from './jobs/news';
import { runWeeklyReport } from './jobs/weekly';

console.log('[Worker] PiyasaAI Worker v8 started');

const INTERVALS = {
  marketRefresh: 5 * 60 * 1000,
  newTokenRadar: 60 * 1000,
  localMarket: 45 * 1000,
  matchDailySix: 24 * 60 * 60 * 1000,
  liveScore: 25 * 1000,
  trapRadar: 5 * 60 * 1000,
  newsImpact: 10 * 60 * 1000,
  weeklyReport: 7 * 24 * 60 * 60 * 1000,
};

runMarketRefresh();
runNewTokenRadar();
runLocalMarket();
runMatchDailySix();
runLiveScore();
runTrapRadar();
runNewsImpact();
runWeeklyReport();

setInterval(runMarketRefresh, INTERVALS.marketRefresh);
setInterval(runNewTokenRadar, INTERVALS.newTokenRadar);
setInterval(runLocalMarket, INTERVALS.localMarket);
setInterval(runMatchDailySix, INTERVALS.matchDailySix);
setInterval(runLiveScore, INTERVALS.liveScore);
setInterval(runTrapRadar, INTERVALS.trapRadar);
setInterval(runNewsImpact, INTERVALS.newsImpact);
setInterval(runWeeklyReport, INTERVALS.weeklyReport);

setInterval(() => {
  console.log(`[Worker] Heartbeat at ${new Date().toISOString()}`);
}, 60 * 1000);

process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down...');
  process.exit(0);
});
