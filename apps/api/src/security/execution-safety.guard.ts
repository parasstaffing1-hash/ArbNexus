import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ExecutionSafetyGuard implements CanActivate {
  private readonly logger = new Logger(ExecutionSafetyGuard.name);
  // Strictly enforce server-side execution disability
  private readonly isExecutionEnabled: boolean = process.env.ENABLE_EXECUTION === 'true';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path?.toLowerCase() || '';
    const method = request.method?.toUpperCase() || '';

    // Protected paths that represent live order execution, fund transfers, or key operations
    const isExecutionPath =
      path.includes('/execute') ||
      path.includes('/trade') ||
      path.includes('/orders/live') ||
      path.includes('/withdraw') ||
      path.includes('/broadcast') ||
      (path.includes('/orders') && (method === 'POST' || method === 'PUT' || method === 'DELETE'));

    if (isExecutionPath && !this.isExecutionEnabled) {
      this.logger.warn(
        `[SECURITY ALERT] Execution attempt blocked by ExecutionSafetyGuard: ${method} ${path} from IP: ${request.ip}`,
      );
      throw new ForbiddenException({
        statusCode: 403,
        error: 'Forbidden',
        message:
          'EXECUTION_DISABLED: Real-money trading, live order routing, and blockchain fund broadcasting are strictly disabled on this platform.',
        serverFlag: 'ENABLE_EXECUTION=false',
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  }
}
