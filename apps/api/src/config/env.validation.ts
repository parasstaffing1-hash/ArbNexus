import { ApiEnvSchema } from '@arbitrage/shared';

export function validateEnv(config: Record<string, unknown>) {
  const parsed = ApiEnvSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(
      `Environment validation failed: ${JSON.stringify(parsed.error.format(), null, 2)}`,
    );
  }
  return parsed.data;
}
