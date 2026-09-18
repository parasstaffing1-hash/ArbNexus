import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or malformed Authorization header');
    }

    const token = authHeader.substring(7);
    const payload = this.authService.verifyToken(token);

    if (!payload) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Attach verified user to request
    (request as any).user = {
      id: payload.sub,
      email: payload.email,
      walletAddress: payload.walletAddress,
      role: payload.role,
      isActive: true,
    };

    return true;
  }
}
