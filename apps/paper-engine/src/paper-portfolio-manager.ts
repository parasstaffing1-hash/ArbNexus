import Decimal from 'decimal.js';
import { PaperSimulationService } from './paper-simulation-service';

export interface PortfolioPerformanceSummary {
  startingEquityUsd: string;
  currentEquityUsd: string;
  totalRealizedPnlUsd: string;
  totalFeesPaidUsd: string;
  totalSlippageCostUsd: string;
  winRatePercent: string;
  completedTradesCount: number;
}

export class PaperPortfolioManager {
  private simulationService: PaperSimulationService;
  private startingEquityUsd: Decimal;

  constructor(initialEquityPerVenueUsd: number = 250000) {
    this.simulationService = new PaperSimulationService();
    this.startingEquityUsd = new Decimal(initialEquityPerVenueUsd).mul(5); // 5 default venues = $1.25M
  }

  getService(): PaperSimulationService {
    return this.simulationService;
  }

  getPerformance(): PortfolioPerformanceSummary {
    const history = this.simulationService.getExecutionHistory();
    const currentEquity = new Decimal(this.simulationService.getTotalEquityUsd());
    let realizedPnl = new Decimal(0);
    let feesPaid = new Decimal(0);
    let slippageCost = new Decimal(0);
    let winningTrades = 0;

    history.forEach((h) => {
      const net = new Decimal(h.netProfitUsd);
      realizedPnl = realizedPnl.plus(net);
      feesPaid = feesPaid.plus(h.totalFeesUsd);
      slippageCost = slippageCost.plus(h.totalSlippageUsd);
      if (net.gt(0)) {
        winningTrades++;
      }
    });

    const winRate = history.length > 0 ? (winningTrades / history.length) * 100 : 0;

    return {
      startingEquityUsd: this.startingEquityUsd.toFixed(2),
      currentEquityUsd: currentEquity.toFixed(2),
      totalRealizedPnlUsd: realizedPnl.toFixed(2),
      totalFeesPaidUsd: feesPaid.toFixed(2),
      totalSlippageCostUsd: slippageCost.toFixed(2),
      winRatePercent: winRate.toFixed(1) + '%',
      completedTradesCount: history.length,
    };
  }
}
