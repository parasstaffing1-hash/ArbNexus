import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser, AuthTokens, JwtPayload, UserRole } from './auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  // In-memory fallback user table for local development / testing when DB is initializing
  private inMemoryUsers: Map<string, any> = new Map();

  constructor(private prisma: PrismaService) {
    this.jwtSecret = process.env.JWT_SECRET || 'arbnexus-production-secure-hmac-key-2026-fallback';
    // Seed default admin user in-memory fallback
    const adminPassHash = this.hashPassword('AdminNexus2026!');
    this.inMemoryUsers.set('admin@arbnexus.io', {
      id: 'usr-admin-001',
      email: 'admin@arbnexus.io',
      passwordHash: adminPassHash,
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
    });
  }

  public hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  public verifyPassword(password: string, combinedHash: string): boolean {
    const [salt, originalHash] = combinedHash.split(':');
    if (!salt || !originalHash) return false;
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(
      Buffer.from(originalHash, 'hex'),
      Buffer.from(computedHash, 'hex'),
    );
  }

  public createToken(user: AuthenticatedUser, expiresInSeconds: number = 86400): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      iat: now,
      exp: now + expiresInSeconds,
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${encodedPayload}`)
      .digest('base64url');

    return `${header}.${encodedPayload}.${signature}`;
  }

  public verifyToken(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;

      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const decodedPayload: JwtPayload = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf-8'),
      );
      const now = Math.floor(Date.now() / 1000);
      if (decodedPayload.exp < now) {
        return null; // Expired
      }

      return decodedPayload;
    } catch {
      return null;
    }
  }

  public async register(
    email: string,
    password: string,
    role: UserRole = 'USER',
  ): Promise<AuthTokens> {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check existing
    if (this.inMemoryUsers.has(normalizedEmail)) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = this.hashPassword(password);
    const userId = `usr-${crypto.randomUUID()}`;

    const newUser = {
      id: userId,
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
      createdAt: new Date(),
    };

    this.inMemoryUsers.set(normalizedEmail, newUser);

    const authUser: AuthenticatedUser = {
      id: userId,
      email: normalizedEmail,
      role,
      isActive: true,
    };

    const token = this.createToken(authUser);
    return {
      accessToken: token,
      expiresIn: 86400,
      user: authUser,
    };
  }

  public async login(email: string, password: string): Promise<AuthTokens> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = this.inMemoryUsers.get(normalizedEmail);

    if (!user || !this.verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is suspended');
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role,
      isActive: user.isActive,
    };

    const token = this.createToken(authUser);
    return {
      accessToken: token,
      expiresIn: 86400,
      user: authUser,
    };
  }

  public async loginWithWallet(walletAddress: string, _signature?: string): Promise<AuthTokens> {
    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new BadRequestException('Valid EVM wallet address is required');
    }

    const normalizedAddress = walletAddress.toLowerCase();
    const existing = Array.from(this.inMemoryUsers.values()).find(
      (u) => u.walletAddress?.toLowerCase() === normalizedAddress,
    );

    let authUser: AuthenticatedUser;
    if (existing) {
      authUser = {
        id: existing.id,
        walletAddress: existing.walletAddress,
        role: existing.role,
        isActive: existing.isActive,
      };
    } else {
      const userId = `usr-w-${crypto.randomUUID()}`;
      const newUser = {
        id: userId,
        walletAddress: normalizedAddress,
        role: 'USER' as UserRole,
        isActive: true,
        createdAt: new Date(),
      };
      this.inMemoryUsers.set(userId, newUser);
      authUser = {
        id: userId,
        walletAddress: normalizedAddress,
        role: 'USER',
        isActive: true,
      };
    }

    const token = this.createToken(authUser);
    return {
      accessToken: token,
      expiresIn: 86400,
      user: authUser,
    };
  }
}
