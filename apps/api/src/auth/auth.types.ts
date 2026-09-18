export type UserRole = 'USER' | 'ADMIN' | 'OPERATOR';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  walletAddress?: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface JwtPayload {
  sub: string; // user id
  email?: string;
  walletAddress?: string;
  role: UserRole;
  iat: number;
  exp: number;
}
