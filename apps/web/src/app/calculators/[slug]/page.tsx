'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CALCULATOR_REGISTRY,
  CalculatorMeta,
  CalculationResult,
  calculateSpotArbitrage,
  calculateGrossSpread,
  calculateNetSpread,
  calculateThreeLegArbitrage,
  calculateMakerFee,
  calculateExpectedSlippage,
  calculateCrossChainArbitrage,
  calculateFundingProfit,
  calculateLiquidationPrice,
  calculateImpermanentLoss,
  calculateStablecoinDepeg,
  calculateApyFromApr,
  calculateEthereumGas,
  calculateOpportunityScore,
  simulateOpportunity,
} from '@arbitrage/calculators';
import { CalculatorLayout } from '../../../components/calculators/calculator-layout';
import { ProfitCurveChart } from '../../../components/calculators/charts/profit-curve-chart';
import { GlassCard, Button } from '@arbitrage/ui';
import { ArrowLeft } from 'lucide-react';

export default function CalculatorDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const meta = React.useMemo(() => {
    return CALCULATOR_REGISTRY.find((c) => c.slug === slug) || null;
  }, [slug]);

  // Initial parameters state
  const defaultInputs = React.useMemo(() => {
    if (!meta) return {};
    const init: Record<string, any> = {};
    meta.parameters.forEach((p) => {
      init[p.name] = p.defaultValue;
    });
    return init;
  }, [meta]);

  const [inputs, setInputs] = React.useState<Record<string, any>>(defaultInputs);
  const [result, setResult] = React.useState<CalculationResult | null>(null);

  // Sync inputs when meta changes
  React.useEffect(() => {
    setInputs(defaultInputs);
  }, [defaultInputs]);

  // Calculation dispatcher based on calculator slug
  const runCalculation = React.useCallback(() => {
    if (!meta) return;

    try {
      let res: CalculationResult;
      switch (meta.slug) {
        case 'spot-arbitrage':
          res = calculateSpotArbitrage(inputs as any);
          break;
        case 'gross-spread':
          res = calculateGrossSpread(inputs.buyPrice, inputs.sellPrice);
          break;
        case 'net-spread':
          res = calculateNetSpread(inputs.buyPrice, inputs.sellPrice, inputs.totalFeeRatePercent);
          break;
        case 'triangular-arbitrage':
          res = calculateThreeLegArbitrage(
            inputs.pair1Rate,
            inputs.pair2Rate,
            inputs.pair3Rate,
            inputs.feeRatePerLegPercent,
          );
          break;
        case 'maker-taker-fee':
          res = calculateMakerFee(inputs.tradeVolumeUsd, inputs.makerFeePercent);
          break;
        case 'slippage':
          res = calculateExpectedSlippage(
            inputs.tradeSizeUsd,
            inputs.marketLiquidityDepthUsd,
            inputs.baseVolatilityPercent,
          );
          break;
        case 'cross-chain':
          res = calculateCrossChainArbitrage(
            inputs.sourcePrice,
            inputs.destPrice,
            inputs.tradeAmount,
            inputs.sourceGasUsd,
            inputs.bridgeFeeUsd,
            inputs.destGasUsd,
          );
          break;
        case 'funding-rate':
          res = calculateFundingProfit(
            inputs.positionSizeUsd,
            inputs.fundingRatePercent,
            inputs.holdingPeriods,
          );
          break;
        case 'futures-liquidation':
          res = calculateLiquidationPrice(
            inputs.entryPrice,
            inputs.leverage,
            inputs.maintenanceMarginRatePercent,
            inputs.isLong,
          );
          break;
        case 'impermanent-loss':
          res = calculateImpermanentLoss(inputs.priceRatio);
          break;
        case 'stablecoin-depeg':
          res = calculateStablecoinDepeg(inputs.marketPriceUsd, inputs.pegTargetPriceUsd);
          break;
        case 'apr-apy-converter':
          res = calculateApyFromApr(inputs.aprPercent, inputs.compoundingFrequency);
          break;
        case 'ethereum-l2-gas':
          res = calculateEthereumGas(
            inputs.gasLimitUnits,
            inputs.baseFeeGwei,
            inputs.priorityFeeGwei,
            inputs.ethPriceUsd,
          );
          break;
        case 'opportunity-scoring':
          res = calculateOpportunityScore(inputs as any);
          break;
        case 'opportunity-simulator':
          res = simulateOpportunity(inputs as any);
          break;
        default:
          // Fallback calculation using spot arbitrage
          res = calculateSpotArbitrage(inputs as any);
          break;
      }
      setResult(res);
    } catch (err: any) {
      console.error('Calculation failure:', err);
    }
  }, [meta, inputs]);

  // Automatically run calculation on mount or initial input setup
  React.useEffect(() => {
    if (meta && Object.keys(inputs).length > 0) {
      runCalculation();
    }
  }, [meta, runCalculation]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#071423] text-zinc-100 p-8 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold font-mono text-white">Calculator Not Found</h2>
        <p className="text-xs text-zinc-400">
          The requested calculator &quot;{slug}&quot; does not exist in the registry.
        </p>
        <Link
          href="/calculators"
          className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Catalog
        </Link>
      </div>
    );
  }

  // Check if simulation chart should be rendered
  let chart: React.ReactNode = null;
  if (meta.slug === 'opportunity-simulator' && result?.outputs?.profitCurve) {
    chart = (
      <ProfitCurveChart
        points={result.outputs.profitCurve}
        optimalTradeSizeUsd={result.outputs.optimalTradeSizeUsd}
        currentTradeSizeUsd={inputs.tradeSizeUsd}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#071423] text-zinc-100 p-4 md:p-8">
      <CalculatorLayout
        meta={meta}
        result={result}
        inputs={inputs}
        onInputChange={(name, val) => setInputs((prev) => ({ ...prev, [name]: val }))}
        onCalculate={runCalculation}
        onReset={() => {
          setInputs(defaultInputs);
          setTimeout(() => runCalculation(), 50);
        }}
        chartComponent={chart}
      />
    </div>
  );
}
