import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Req,
  Res,
  Param,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent = 'Unknown Browser',
    @Res({ passthrough: true }) res: Response
  ) {
    const { response, refreshToken, csrfToken, rememberMe } = await this.authService.login(
      dto,
      ip,
      userAgent
    );

    const maxAgeMs = rememberMe ? 7 * 24 * 3600 * 1000 : 8 * 3600 * 1000;

    // Set secure HttpOnly refresh token cookie
    res.cookie('reboot_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeMs,
      path: '/',
    });

    // Set readable anti-CSRF token cookie
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeMs,
      path: '/',
    });

    return response;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return {
      success: true,
      user,
    };
  }

  @Post('refresh')
  async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies?.['reboot_refresh'];
    const result = await this.authService.refreshToken(refreshToken);
    return {
      success: true,
      ...result,
    };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = (req as any).user?.sessionId;
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    res.clearCookie('reboot_refresh', { path: '/' });
    res.clearCookie('XSRF-TOKEN', { path: '/' });

    return {
      success: true,
      message: 'Terminal session securely closed.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getActiveSessions(@CurrentUser() user: any) {
    const sessions = await this.authService.getActiveSessions(user.id, user.sessionId);
    return {
      success: true,
      sessions,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async revokeSession(
    @CurrentUser('id') userId: string,
    @Param('sessionId') targetSessionId: string
  ) {
    const ok = await this.authService.revokeSession(userId, targetSessionId);
    return {
      success: ok,
      message: ok ? 'Session successfully revoked.' : 'Session not found.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/other')
  async revokeAllOtherSessions(@CurrentUser() user: any) {
    await this.authService.revokeAllOtherSessions(user.id, user.sessionId);
    return {
      success: true,
      message: 'All other active device sessions have been revoked.',
    };
  }
}
