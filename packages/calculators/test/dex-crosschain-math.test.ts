import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import {
  calculateDexSwapCost,
  calculateAmmPriceImpact,
  calculateCrossChainArbitrage,
} from '../src';
import {
  AMMCalculator,
  ConcentratedLiquidityCalculator,
  PriceImpactCalculator,
  SwapFeeCalculator,
} from '../../protocols/src';
import { FlashLoanSimulator } from '../../blockchain/src';

describe('DEX + Cross-Chain + AMM Math Tests', () => {
  describe('1. Constant Product AMM Math (x * y = k)', () => {
    it('calculates deterministic output for single-hop swap', () => {
      // 1000 WETH reserve, 3,500,000 USDC reserve, 0.3% fee
      const reserveIn = new Decimal(1000);
      const reserveOut = new Decimal(3500000);
      const amountIn = new Decimal(10); // swap 10 WETH

      const amountOut = AMMCalculator.getAmountOut(amountIn, reserveIn, reserveOut, 30);
      expect(amountOut.gt(0)).toBe(true);
      expect(amountOut.lt(35000)).toBe(true); // Less than 10 * 3500 due to fee and impact

      // Reversible getAmountIn calculation
      const requiredIn = AMMCalculator.getAmountIn(amountOut, reserveIn, reserveOut, 30);
      expect(requiredIn.minus(amountIn).abs().toNumber()).toBeLessThan(0.01);
    });

    it('handles zero or negative inputs gracefully', () => {
      const out = AMMCalculator.getAmountOut(new Decimal(0), new Decimal(100), new Decimal(100));
      expect(out.toNumber()).toBe(0);
    });
  });

  describe('2. Concentrated Liquidity Tick & sqrtPriceX96 Math', () => {
    it('converts tick to price and back deterministically', () => {
      const tick = 204520;
      const price = ConcentratedLiquidityCalculator.tickToPrice(tick);
      expect(price.gt(0)).toBe(true);

      const recoveredTick = ConcentratedLiquidityCalculator.priceToTick(price);
      expect(Math.abs(recoveredTick - tick)).toBeLessThanOrEqual(1);
    });

    it('computes tickToSqrtPriceX96 matching Uniswap v3 specification', () => {
      const tick = 0; // price = 1.0, sqrtPrice = 1.0, sqrtPriceX96 = 2^96
      const sqrtPriceX96 = ConcentratedLiquidityCalculator.tickToSqrtPriceX96(tick);
      const expectedQ96 = new Decimal(2).pow(96);
      expect(sqrtPriceX96.equals(expectedQ96)).toBe(true);
    });
  });

  describe('3. Price Impact and Slippage Constraints', () => {
    it('asserts price impact increases monotonically with trade size', () => {
      const rIn = new Decimal(10000);
      const rOut = new Decimal(10000);

      const impactSmall = PriceImpactCalculator.calculateConstantProductImpact(
        new Decimal(10),
        AMMCalculator.getAmountOut(new Decimal(10), rIn, rOut),
        rIn,
        rOut,
      );

      const impactLarge = PriceImpactCalculator.calculateConstantProductImpact(
        new Decimal(1000),
        AMMCalculator.getAmountOut(new Decimal(1000), rIn, rOut),
        rIn,
        rOut,
      );

      expect(impactLarge.gt(impactSmall)).toBe(true);
    });
  });

  describe('4. Cross-Chain Arbitrage Profitability & Cost Engine', () => {
    it('correctly calculates net profit with bridge and dual-chain gas fees', () => {
      // Source ETH @ $3,500, Dest ETH @ $3,540 (Gross spread +$40/ETH)
      // Capital: 10 ETH ($35,000)
      const res = calculateCrossChainArbitrage(
        '3500.00',
        '3540.00',
        '10.0',
        '12.50', // source gas (Ethereum)
        '21.00', // bridge fee (Across 6 bps)
        '0.45', // dest gas (Arbitrum)
      );

      expect(res.outputs.isProfitable).toBe(true);
      expect(res.outputs.grossProfitUsd).toBe(400); // 10 * 40
      expect(res.outputs.netProfitUsd).toBeGreaterThan(300);
      expect(res.outputs.netRoiPercent).toBeGreaterThan(0.8);
    });
  });

  describe('5. Flash-Loan Simulation Economics', () => {
    it('simulates profitable flash loan when gross spread exceeds fees', () => {
      const result = FlashLoanSimulator.simulate({
        provider: 'AAVE_V3',
        chain: 'ethereum',
        borrowAsset: 'USDC',
        borrowAmountUsd: 100000,
        expectedGrossReturnUsd: 100800, // +$800 gross profit
        dexSwapFeesUsd: 150,
        gasCostUsd: 35,
        priceImpactUsd: 50,
      });

      expect(result.flashLoanFeeUsd.toNumber()).toBe(50); // 5 bps of 100,000
      expect(result.totalCostsUsd.toNumber()).toBe(285); // 50 + 150 + 35 + 50
      expect(result.netProfitUsd.toNumber()).toBe(515); // 800 - 285
      expect(result.isProfitable).toBe(true);
      expect(result.simulationStatus).toBe('SUCCESS');
    });

    it('simulates revert when profit does not cover flash loan fee', () => {
      const result = FlashLoanSimulator.simulate({
        provider: 'AAVE_V3',
        chain: 'ethereum',
        borrowAsset: 'USDC',
        borrowAmountUsd: 100000,
        expectedGrossReturnUsd: 100100, // +$100 gross
        dexSwapFeesUsd: 150,
        gasCostUsd: 35,
        priceImpactUsd: 50,
      });

      expect(result.isProfitable).toBe(false);
      expect(result.simulationStatus).toBe('REVERT_UNPROFITABLE');
    });
  });
});
