import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = [
  {
    name: 'default',
    ttl: 60000, // 1 minute
    limit: parseInt(process.env.RATE_LIMIT_DEFAULT || '100', 10),
  },
  {
    name: 'auth',
    ttl: 60000,
    limit: parseInt(process.env.RATE_LIMIT_AUTH || '10', 10),
  },
  {
    name: 'opportunities',
    ttl: 60000,
    limit: parseInt(process.env.RATE_LIMIT_OPPORTUNITIES || '300', 10),
  },
];
