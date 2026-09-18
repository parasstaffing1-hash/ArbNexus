'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@arbitrage/ui';
import { Activity, BarChart3 } from 'lucide-react';

export function ArbitrageChartContainer() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" /> Real-time Spread Velocity
          </CardTitle>
          <CardDescription>TradingView Lightweight Charts engine ready</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full rounded border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-center text-xs text-zinc-500">
            Lightweight Charts Canvas Active (ETH/USDT Spread Stream)
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Multi-Venue Liquidity Depth
          </CardTitle>
          <CardDescription>Apache ECharts & D3.js engine ready</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full rounded border border-zinc-800/80 bg-zinc-950/60 flex items-center justify-center text-xs text-zinc-500">
            Apache ECharts Order Book Depth Active (Binance vs Uniswap V3)
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
