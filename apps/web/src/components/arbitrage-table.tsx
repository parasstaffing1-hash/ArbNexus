'use client';

import * as React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
} from '@arbitrage/ui';
import { ArbitrageOpportunity } from '@arbitrage/shared';
import { ArrowRight, Zap } from 'lucide-react';

const columns: ColumnDef<ArbitrageOpportunity>[] = [
  {
    accessorKey: 'pair',
    header: 'Pair',
    cell: ({ row }) => <span className="font-semibold text-white">{row.getValue('pair')}</span>,
  },
  {
    accessorKey: 'strategy',
    header: 'Strategy',
    cell: ({ row }) => <Badge variant="secondary">{row.getValue('strategy')}</Badge>,
  },
  {
    id: 'route',
    header: 'Route (CEX/DEX)',
    cell: ({ row }) => (
      <div className="flex items-center space-x-1 text-xs">
        <span className="text-zinc-300 font-mono">{row.original.sourceExchange}</span>
        <ArrowRight className="h-3 w-3 text-zinc-500" />
        <span className="text-zinc-300 font-mono">{row.original.targetExchange}</span>
      </div>
    ),
  },
  {
    accessorKey: 'spreadPercent',
    header: 'Spread',
    cell: ({ row }) => {
      const spread = Number(row.getValue('spreadPercent'));
      return <span className="font-mono font-medium text-emerald-400">+{spread.toFixed(2)}%</span>;
    },
  },
  {
    accessorKey: 'netProfitUsd',
    header: 'Est. Net Profit',
    cell: ({ row }) => {
      const profit = Number(row.getValue('netProfitUsd'));
      return <span className="font-mono font-semibold text-white">\${profit.toFixed(2)}</span>;
    },
  },
  {
    accessorKey: 'confidenceScore',
    header: 'Confidence',
    cell: ({ row }) => {
      const conf = Number(row.getValue('confidenceScore'));
      return <Badge variant={conf > 0.8 ? 'default' : 'warning'}>{(conf * 100).toFixed(0)}%</Badge>;
    },
  },
  {
    id: 'actions',
    header: 'Action',
    cell: () => (
      <Button size="sm" variant="outline" className="h-7 text-xs">
        <Zap className="h-3 w-3 mr-1 text-emerald-400" /> Simulate
      </Button>
    ),
  },
];

export function ArbitrageTable({ data }: { data: ArbitrageOpportunity[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/40">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center text-zinc-500">
                Scanning venues for live arbitrage opportunities...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
