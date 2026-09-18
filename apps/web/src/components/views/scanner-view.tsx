'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ScanLine,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { GlassCard, SpreadBadge, ProfitChip, ExchangeBadge, Button, cn } from '@arbitrage/ui';
import { LiveOpportunity, MOCK_OPPORTUNITIES } from '../../lib/mock-data';
import { useOpportunities } from '../../hooks/use-arbitrage-api';

interface ScannerViewProps {
  onSelectOpportunity: (opp: LiveOpportunity) => void;
  externalSearch?: string;
}

export function ScannerView({ onSelectOpportunity, externalSearch = '' }: ScannerViewProps) {
  const opportunitiesQuery = useOpportunities();
  const data: LiveOpportunity[] = opportunitiesQuery.data || MOCK_OPPORTUNITIES;
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'netSpreadPercent', desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = React.useState<string>(externalSearch);
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>('ALL');
  const [selectedNetwork, setSelectedNetwork] = React.useState<string>('ALL');
  const [minSpread, setMinSpread] = React.useState<number>(0.5);

  // Sync external search when prop changes
  React.useEffect(() => {
    if (externalSearch !== undefined) {
      setGlobalFilter(externalSearch);
    }
  }, [externalSearch]);

  // Filtered dataset
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      if (selectedStrategy !== 'ALL' && item.strategy !== selectedStrategy) return false;
      if (selectedNetwork !== 'ALL' && item.network !== selectedNetwork) return false;
      if (item.netSpreadPercent < minSpread) return false;
      if (globalFilter) {
        const q = globalFilter.toLowerCase();
        const matchPair = item.pair.toLowerCase().includes(q);
        const matchToken = item.token.toLowerCase().includes(q);
        const matchSource = item.sourceExchange.toLowerCase().includes(q);
        const matchTarget = item.targetExchange.toLowerCase().includes(q);
        const matchNetwork = item.network.toLowerCase().includes(q);
        if (!matchPair && !matchToken && !matchSource && !matchTarget && !matchNetwork) {
          return false;
        }
      }
      return true;
    });
  }, [data, selectedStrategy, selectedNetwork, minSpread, globalFilter]);

  // Table Column Definitions
  const columns = React.useMemo<ColumnDef<LiveOpportunity>[]>(
    () => [
      {
        accessorKey: 'pair',
        header: 'Asset / Pair',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center font-bold font-mono text-cyan-300 text-xs shrink-0">
                {item.token}
              </div>
              <div>
                <div className="font-bold text-white font-mono text-xs">{item.pair}</div>
                <div className="text-[10px] font-mono text-zinc-400">{item.network}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'strategy',
        header: 'Strategy',
        cell: ({ row }) => {
          const strat = row.original.strategy;
          return (
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
                strat === 'DEX_CEX' && 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
                strat === 'SPATIAL' && 'bg-amber-500/10 text-amber-300 border-amber-500/30',
                strat === 'CROSS_CHAIN' && 'bg-purple-500/10 text-purple-300 border-purple-500/30',
              )}
            >
              {strat.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'buyPrice',
        header: 'Buy Venue',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-0.5">
              <ExchangeBadge name={item.sourceExchange} type={item.sourceExchangeType} />
              <div className="text-xs font-mono text-zinc-300">
                $
                {item.buyPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'sellPrice',
        header: 'Sell Venue',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="space-y-0.5">
              <ExchangeBadge name={item.targetExchange} type={item.targetExchangeType} />
              <div className="text-xs font-mono text-zinc-300">
                $
                {item.sellPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'grossSpreadPercent',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-zinc-400 hover:text-white"
          >
            Gross Spread
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-400">
            +{row.original.grossSpreadPercent.toFixed(2)}%
          </span>
        ),
      },
      {
        accessorKey: 'netSpreadPercent',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-cyan-300 hover:text-white"
          >
            Net Spread
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => <SpreadBadge spreadPercent={row.original.netSpreadPercent} size="sm" />,
      },
      {
        accessorKey: 'netProfitUsd',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 font-mono text-amber-300 hover:text-white"
          >
            Net Profit
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: ({ row }) => (
          <ProfitChip
            profitUsd={row.original.netProfitUsd}
            feesUsd={row.original.estimatedFeesUsd}
            size="sm"
          />
        ),
      },
      {
        accessorKey: 'confidenceScore',
        header: 'Confidence & Latency',
        cell: ({ row }) => {
          const item = row.original;
          const scorePercent = Math.round(item.confidenceScore * 100);
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{scorePercent}%</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                <Clock className="w-2.5 h-2.5" />
                <span>{item.executionDurationMs}ms</span>
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSelectOpportunity(row.original);
            }}
            className="text-[11px] h-7 px-2.5 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 gap-1 font-mono"
          >
            <span>Analyze</span>
            <ChevronRight className="w-3 h-3" />
          </Button>
        ),
      },
    ],
    [onSelectOpportunity],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight text-white">Live Orderbook Scanner</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {filteredData.length} OPPORTUNITIES
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Millisecond-latency orderbook scanning across CEX orderbooks and DEX automated market
            makers.
          </p>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <GlassCard variant="default" className="p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Strategy Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-cyan-900/30">
            {[
              { id: 'ALL', label: 'All Venues' },
              { id: 'DEX_DEX', label: 'DEX Scanner' },
              { id: 'DEX_CEX', label: 'CEX ↔ DEX' },
              { id: 'CROSS_CHAIN', label: 'Cross-Chain' },
              { id: 'ONCHAIN_MEV', label: 'On-Chain MEV' },
              { id: 'STABLECOIN', label: 'Stablecoin' },
            ].map((strat) => (
              <button
                key={strat.id}
                onClick={() => setSelectedStrategy(strat.id)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-mono transition-all',
                  selectedStrategy === strat.id
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-[0_0_10px_rgba(0,242,254,0.15)]'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                {strat.label}
              </button>
            ))}
          </div>

          {/* Network Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Network:</span>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="bg-[#0a1b2e] border border-cyan-900/40 text-xs font-mono text-zinc-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Networks</option>
              <option value="Ethereum">Ethereum</option>
              <option value="Solana">Solana</option>
              <option value="Arbitrum">Arbitrum</option>
              <option value="Base">Base</option>
              <option value="Avalanche">Avalanche</option>
              <option value="Optimism">Optimism</option>
              <option value="Sui">Sui</option>
              <option value="Near">Near</option>
            </select>
          </div>

          {/* Min Spread Slider */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Min Spread:</span>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={minSpread}
              onChange={(e) => setMinSpread(parseFloat(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-cyan-300 w-12 text-right">
              {minSpread.toFixed(1)}%
            </span>
          </div>
        </div>
      </GlassCard>

      {/* TanStack Table */}
      <GlassCard variant="default" className="overflow-hidden border-cyan-900/30">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-cyan-900/30 bg-black/40 text-zinc-400 text-[11px] uppercase font-mono tracking-wider"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="py-3 px-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-cyan-950/40 text-xs font-mono">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-12 text-zinc-500">
                    No arbitrage opportunities found matching your filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onSelectOpportunity(row.original)}
                    className="hover:bg-cyan-500/5 cursor-pointer transition-colors duration-150 group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3.5 px-4 whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
