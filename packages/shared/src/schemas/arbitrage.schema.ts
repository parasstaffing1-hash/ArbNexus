import { z } from 'zod';

export const OrderBookLevelSchema = z.object({
  price: z.number().positive(),
  amount: z.number().nonnegative(),
});

export const OrderBookSchema = z.object({
  exchange: z.string().min(1),
  symbol: z.string().min(1),
  timestamp: z.number().int().positive(),
  bids: z.array(OrderBookLevelSchema),
  asks: z.array(OrderBookLevelSchema),
});

export const TickerSchema = z.object({
  exchange: z.string().min(1),
  symbol: z.string().min(1),
  bid: z.number().positive(),
  ask: z.number().positive(),
  last: z.number().positive(),
  volume24h: z.number().nonnegative(),
  timestamp: z.number().int().positive(),
});

export const ArbitrageLegSchema = z.object({
  action: z.enum(['BUY', 'SELL']),
  exchange: z.string().min(1),
  exchangeType: z.enum(['CEX', 'DEX']),
  symbol: z.string().min(1),
  price: z.number().positive(),
  expectedAmount: z.number().positive(),
  chainId: z.number().optional(),
  estimatedFeeUsd: z.number().nonnegative(),
});

export const ArbitrageOpportunitySchema = z.object({
  id: z.string().uuid(),
  strategy: z.enum(['SPATIAL', 'TRIANGULAR', 'CROSS_CHAIN', 'DEX_CEX']),
  sourceExchange: z.string().min(1),
  targetExchange: z.string().min(1),
  pair: z.string().min(1),
  buyPrice: z.number().positive(),
  sellPrice: z.number().positive(),
  spreadPercent: z.number(),
  grossProfitUsd: z.number(),
  netProfitUsd: z.number(),
  totalFeesUsd: z.number().nonnegative(),
  minCapitalUsd: z.number().positive(),
  legs: z.array(ArbitrageLegSchema),
  detectedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  confidenceScore: z.number().min(0).max(1),
});

export type ArbitrageOpportunityDto = z.infer<typeof ArbitrageOpportunitySchema>;
