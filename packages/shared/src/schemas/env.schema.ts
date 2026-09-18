import { z } from 'zod';

export const NodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');

export const ApiEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z
    .string()
    .url()
    .default(
      'postgresql://arbitrage_user:arbitrage_secure_pass_2026@localhost:5432/arbitrage_db?schema=public',
    ),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_crypto_arbitrage_2026_production'),
  ETHEREUM_RPC_URL: z.string().url().optional(),
  POLYGON_RPC_URL: z.string().url().optional(),
  ARBITRUM_RPC_URL: z.string().url().optional(),
  BASE_RPC_URL: z.string().url().optional(),
  SOLANA_RPC_URL: z.string().url().optional(),
  NOVU_API_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().url().optional(),
});

export const WebEnvSchema = z.object({
  NODE_ENV: NodeEnvSchema,
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),
  NEXT_PUBLIC_WS_URL: z.string().default('ws://localhost:4000'),
  NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: z.string().default('demo_wallet_connect_project_id'),
});

export type ApiEnv = z.infer<typeof ApiEnvSchema>;
export type WebEnv = z.infer<typeof WebEnvSchema>;
