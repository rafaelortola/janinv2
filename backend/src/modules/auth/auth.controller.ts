import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterCompanyDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 86400000,
      path: '/api/v1/auth',
    });
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register-company')
  async registerCompany(
    @Body() dto: RegisterCompanyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.registerCompany(dto);
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...rest } = result;
    return rest;
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip;
    const result = await this.auth.login(dto.email, dto.password, ip);
    this.setRefreshCookie(res, result.refreshToken);
    const { refreshToken: _, ...rest } = result;
    return rest;
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const result = await this.auth.refresh(raw ?? '');
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: AuthUser,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(raw ?? '', user.userId);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.userId, user.companyId);
  }
}
