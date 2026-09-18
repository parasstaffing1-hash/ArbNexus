'use client';

import * as React from 'react';
import Link from 'next/link';
import { CalculatorMeta, CalculationResult } from '@arbitrage/calculators';
import { GlassCard, Button, SpreadBadge, ProfitChip, cn } from '@arbitrage/ui';
import {
  RotateCcw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CalculatorLayoutProps {
  meta: CalculatorMeta;
  result: CalculationResult | null;
  inputs: Record<string, any>;
  onInputChange: (name: string, value: any) => void;
  onCalculate: () => void;
  onReset: () => void;
  chartComponent?: React.ReactNode;
}

export function CalculatorLayout({
  meta,
  result,
  inputs,
  onInputChange,
  onCalculate,
  onReset,
  chartComponent,
}: CalculatorLayoutProps) {
  const [copied, setCopied] = React.useState(false);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const basicParams = meta.parameters.filter((p) => !p.isAdvanced);
  const advancedParams = meta.parameters.filter((p) => p.isAdvanced);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back to Catalog Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/calculators"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Calculator Catalog</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase">
            {meta.category}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
            DEMO / SIMULATED DATA
          </span>
        </div>
      </div>

      {/* Header Info Banner */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans flex items-center gap-3">
          {meta.name}
          <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            DETERMINISTIC ENGINE
          </span>
        </h1>
        <p className="text-xs text-zinc-400">{meta.description}</p>

        {/* Formula Box */}
        <div className="p-3 rounded-xl bg-black/40 border border-cyan-900/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
          <span className="text-zinc-500">FORMULA:</span>
          <span>{meta.formulaDescription}</span>
        </div>
      </div>

      {/* Main Grid: Inputs Column vs Results Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parameters Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <GlassCard variant="default" className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3">
              <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                Calculation Parameters
              </span>
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Basic Parameters */}
            <div className="space-y-3.5">
              {basicParams.map((param) => (
                <div key={param.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <label className="text-zinc-300">{param.label}</label>
                    {param.unit && <span className="text-zinc-500">{param.unit}</span>}
                  </div>

                  {param.type === 'number' && (
                    <input
                      type="number"
                      step={param.step || 'any'}
                      min={param.min}
                      max={param.max}
                      value={inputs[param.name] ?? param.defaultValue}
                      onChange={(e) => onInputChange(param.name, parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 transition-all"
                    />
                  )}

                  {param.type === 'select' && (
                    <select
                      value={inputs[param.name] ?? param.defaultValue}
                      onChange={(e) => onInputChange(param.name, e.target.value)}
                      className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 transition-all"
                    >
                      {param.options?.map((opt) => (
                        <option key={String(opt.value)} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {param.type === 'boolean' && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onInputChange(param.name, !inputs[param.name])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          inputs[param.name] ? 'bg-cyan-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            inputs[param.name] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className="text-xs font-mono text-zinc-400">
                        {inputs[param.name] ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Advanced Parameters Accordion */}
            {advancedParams.length > 0 && (
              <div className="pt-2 border-t border-cyan-900/20">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-xs font-mono text-cyan-400 hover:text-cyan-300 py-1"
                >
                  <span>Advanced Parameters ({advancedParams.length})</span>
                  {showAdvanced ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showAdvanced && (
                  <div className="space-y-3 pt-2">
                    {advancedParams.map((param) => (
                      <div key={param.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <label className="text-zinc-400">{param.label}</label>
                          {param.unit && <span className="text-zinc-500">{param.unit}</span>}
                        </div>
                        <input
                          type="number"
                          step={param.step || 'any'}
                          min={param.min}
                          max={param.max}
                          value={inputs[param.name] ?? param.defaultValue}
                          onChange={(e) =>
                            onInputChange(param.name, parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Calculate Trigger Button */}
            <div className="pt-2">
              <Button
                onClick={onCalculate}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-mono text-xs font-bold py-2.5 shadow-[0_0_15px_rgba(0,242,254,0.2)]"
              >
                EXECUTE CALCULATION
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Right Side: Results & Audit Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {result ? (
            <>
              {/* Primary Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(result.outputs).map(([key, value]) => {
                  if (typeof value === 'object' && value !== null) return null;
                  const isProfit =
                    key.toLowerCase().includes('profit') || key.toLowerCase().includes('spread');
                  return (
                    <GlassCard key={key} variant="cyan" className="p-4">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <div className="text-xl font-bold font-mono text-white mt-1">
                        {typeof value === 'number'
                          ? value.toLocaleString(undefined, { maximumFractionDigits: 4 })
                          : String(value)}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>

              {/* Chart Component if supplied */}
              {chartComponent && <div>{chartComponent}</div>}

              {/* Warnings Alert Box */}
              {result.warnings.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono space-y-1.5 text-rose-300">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Risk & Boundary Warnings</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-300">
                    {result.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Breakdown & Audit Trail */}
              {result.breakdown && Object.keys(result.breakdown).length > 0 && (
                <GlassCard variant="default" className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Itemized Audit Breakdown
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="text-[10px] h-7 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-mono gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      {copied ? 'COPIED JSON' : 'COPY AUDIT'}
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-cyan-900/20 font-mono text-xs space-y-1.5">
                    {Object.entries(result.breakdown).map(([k, v]) => {
                      if (typeof v === 'object' && v !== null) return null;
                      return (
                        <div key={k} className="flex justify-between items-center text-zinc-400">
                          <span>{k.replace(/([A-Z])/g, ' $1')}:</span>
                          <span className="text-zinc-200 font-semibold">
                            {typeof v === 'number'
                              ? v.toLocaleString(undefined, { maximumFractionDigits: 4 })
                              : String(v)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              )}

              {/* Assumptions & Methodology */}
              <GlassCard
                variant="default"
                className="p-4 space-y-2 text-xs font-mono text-zinc-400"
              >
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold uppercase">
                  <Info className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Assumptions & Deterministic Methodology</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  {result.assumptions.map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                  <li>Executed with Decimal.js 36-digit mathematical precision.</li>
                </ul>
              </GlassCard>
            </>
          ) : (
            <GlassCard
              variant="default"
              className="p-12 text-center text-zinc-500 font-mono text-xs"
            >
              Click &quot;EXECUTE CALCULATION&quot; to generate deterministic financial results.
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
