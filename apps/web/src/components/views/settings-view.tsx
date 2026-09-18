'use client';

import * as React from 'react';
import { Sliders, ShieldCheck, Zap, Save, CheckCircle2, Server, Key } from 'lucide-react';
import { GlassCard, Button } from '@arbitrage/ui';

export function SettingsView() {
  const [slippage, setSlippage] = React.useState('0.5');
  const [gasMultiplier, setGasMultiplier] = React.useState('1.2');
  const [defaultTranche, setDefaultTranche] = React.useState('5000');
  const [mevProtection, setMevProtection] = React.useState(true);
  const [ethRpc, setEthRpc] = React.useState('https://eth.llamarpc.com');
  const [solRpc, setSolRpc] = React.useState('https://api.mainnet-beta.solana.com');
  const [saved, setSaved] = React.useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">
            Arb
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
              Nexus
            </span>{' '}
            Engine & Risk Parameters
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            SYSTEM CONFIG
          </span>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Adjust risk guardrails, slippage bounds, private RPC endpoints, and auto-execution
          parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Execution & Slippage Card */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <h2 className="font-bold text-sm text-white font-mono uppercase flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Execution Parameters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="text-zinc-400 block mb-1">MAX SLIPPAGE TOLERANCE (%)</label>
              <input
                type="text"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Transactions revert if slippage exceeds this threshold.
              </span>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">GAS PRICE MULTIPLIER (EIP-1559)</label>
              <input
                type="text"
                value={gasMultiplier}
                onChange={(e) => setGasMultiplier(e.target.value)}
                className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Multiplier applied to fast base fee for priority block inclusion.
              </span>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">DEFAULT TRANCHE SIZE ($USD)</label>
              <input
                type="text"
                value={defaultTranche}
                onChange={(e) => setDefaultTranche(e.target.value)}
                className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Base capital tranche used for opportunity profitability simulations.
              </span>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">MEV FLASHBOTS ROUTING</label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMevProtection(!mevProtection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    mevProtection ? 'bg-cyan-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mevProtection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-xs text-zinc-300">
                  {mevProtection ? 'Enabled (Private Mempool)' : 'Disabled (Public Mempool)'}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* RPC Endpoints Card */}
        <GlassCard variant="default" className="p-5 space-y-4">
          <h2 className="font-bold text-sm text-white font-mono uppercase flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Custom Dedicated RPC Endpoints
          </h2>

          <div className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-zinc-400 block mb-1">ETHEREUM HTTP/WSS RPC</label>
              <input
                type="text"
                value={ethRpc}
                onChange={(e) => setEthRpc(e.target.value)}
                className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">SOLANA MAINNET RPC</label>
              <input
                type="text"
                value={solRpc}
                onChange={(e) => setSolRpc(e.target.value)}
                className="w-full bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>
        </GlassCard>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Parameters saved successfully.
              </span>
            )}
          </div>

          <Button
            type="submit"
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-mono font-bold text-xs gap-2"
          >
            <Save className="w-4 h-4" />
            SAVE CONFIGURATION
          </Button>
        </div>
      </form>
    </div>
  );
}
