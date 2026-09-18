/**
 * Calculates basis points (bps) difference between two prices.
 * e.g., buy = 100, sell = 101 => +100 bps (1%)
 */
export function calculateSpreadBps(buyPrice: number, sellPrice: number): number {
  if (buyPrice <= 0) return 0;
  return ((sellPrice - buyPrice) / buyPrice) * 10000;
}

/**
 * Calculates spread percentage between two prices.
 */
export function calculateSpreadPercent(buyPrice: number, sellPrice: number): number {
  if (buyPrice <= 0) return 0;
  return ((sellPrice - buyPrice) / buyPrice) * 100;
}

/**
 * Calculates net profit after applying trading fees and estimated gas.
 */
export function calculateNetProfit(
  capitalUsd: number,
  spreadPercent: number,
  feePercentTotal: number,
  estimatedGasUsd: number,
): { grossProfitUsd: number; netProfitUsd: number; isProfitable: boolean } {
  const grossProfitUsd = capitalUsd * (spreadPercent / 100);
  const totalFeesUsd = capitalUsd * (feePercentTotal / 100) + estimatedGasUsd;
  const netProfitUsd = grossProfitUsd - totalFeesUsd;
  return {
    grossProfitUsd,
    netProfitUsd,
    isProfitable: netProfitUsd > 0,
  };
}

/**
 * Normalizes exchange symbols (e.g. 'BTC/USDT', 'BTCUSDT', 'BTC-USDT' -> 'BTC/USDT')
 */
export function normalizeSymbol(symbol: string): string {
  const clean = symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.endsWith('USDT')) {
    return `${clean.slice(0, -4)}/USDT`;
  }
  if (clean.endsWith('USDC')) {
    return `${clean.slice(0, -4)}/USDC`;
  }
  return symbol.toUpperCase();
}
