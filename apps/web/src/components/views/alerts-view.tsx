'use client';

import * as React from 'react';
import {
  BellRing,
  Plus,
  Send,
  Mail,
  MessageSquare,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { GlassCard, Button } from '@arbitrage/ui';
import { MOCK_ALERT_RULES, AlertRule } from '../../lib/mock-data';

export function AlertsView() {
  const [rules, setRules] = React.useState<AlertRule[]>(MOCK_ALERT_RULES);
  const [newRuleName, setNewRuleName] = React.useState('');
  const [newThreshold, setNewThreshold] = React.useState('1.0');
  const [isAdding, setIsAdding] = React.useState(false);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName) return;

    const newRule: AlertRule = {
      id: `alert-${Date.now()}`,
      name: newRuleName,
      triggerType: 'SPREAD',
      threshold: parseFloat(newThreshold) || 1.0,
      channels: ['TELEGRAM', 'DISCORD'],
      isActive: true,
      lastTriggered: 'Never',
    };

    setRules([newRule, ...rules]);
    setNewRuleName('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Arbitrage & Funding Alert Rules
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              TELEGRAM / DISCORD
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configure automated notifications when cross-exchange spreads or funding deltas exceed
            target thresholds.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold text-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {isAdding ? 'CANCEL' : 'CREATE RULE'}
        </Button>
      </div>

      {/* Add Rule Form */}
      {isAdding && (
        <GlassCard variant="gold" className="p-4 space-y-4">
          <h2 className="text-xs font-mono font-bold text-amber-300 uppercase">
            New Alert Trigger
          </h2>
          <form onSubmit={handleAddRule} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                  RULE DESCRIPTION
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ultra Spread Alert (> 2.5%)"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                  SPREAD THRESHOLD (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black font-mono font-bold text-xs"
              >
                SAVE RULE
              </Button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Alert Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <GlassCard
            key={rule.id}
            variant="default"
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-sm text-white font-mono">{rule.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {rule.triggerType} &gt; {rule.threshold}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                <span>Channels:</span>
                <div className="flex items-center gap-1.5">
                  {rule.channels.map((ch) => (
                    <span
                      key={ch}
                      className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-[10px]"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
                <span>
                  • Last triggered: <span className="text-zinc-300">{rule.lastTriggered}</span>
                </span>
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleRule(rule.id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  rule.isActive ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    rule.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
