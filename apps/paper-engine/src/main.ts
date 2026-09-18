import { PaperPortfolioManager } from './paper-portfolio-manager';

async function bootstrap() {
  console.log('================================================================');
  console.log('       ARBNEXUS — PAPER TRADING SIMULATION ENGINE               ');
  console.log('================================================================');
  console.log('Mode: SIMULATION ONLY | Live Trading: DISABLED');

  const manager = new PaperPortfolioManager();
  console.log(
    `Starting Simulated Portfolio Equity: $${manager.getPerformance().startingEquityUsd}`,
  );
  console.log('Paper Engine daemon active and waiting for simulated order triggers...');
}

if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Failed to start Paper Engine:', err);
    process.exit(1);
  });
}
