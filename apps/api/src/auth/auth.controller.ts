import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(@Body() body: { email: string; password: string }) {
    return this.authService.register(body.email, body.password);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('wallet-login')
  @ApiOperation({ summary: 'Authenticate with verified Web3 wallet address' })
  async walletLogin(@Body() body: { walletAddress: string; signature?: string }) {
    return this.authService.loginWithWallet(body.walletAddress, body.signature);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile for the currently authenticated user' })
  async getProfile(@Request() req: any) {
    return {
      authenticated: true,
      user: req.user,
    };
  }

  @Get('admin/system-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Restricted administrative system status' })
  async getAdminStatus() {
    return {
      adminAccess: true,
      executionBlocked: process.env.ENABLE_EXECUTION !== 'true',
      timestamp: new Date().toISOString(),
    };
  }
}
