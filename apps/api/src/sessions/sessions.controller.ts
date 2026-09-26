import { Body, Controller, Get, Headers, HttpException, Post, Req, Res } from '@nestjs/common';
import type { SignInResult } from '@bank/contract';
import type { Request, Response } from 'express';
import { RateLimiter } from '../rate-limit.js';
import { readSessionId } from '../session-cookie.js';
import { SessionsService } from './sessions.service.js';

@Controller('api/session')
export class SessionsController {
  constructor(
    private readonly sessions: SessionsService,
    private readonly limiter: RateLimiter,
  ) {}

  @Get()
  async current(@Headers('cookie') cookie: string | string[] | undefined): Promise<{ state: 'anonymous' | 'authenticated' }> {
    const header = Array.isArray(cookie) ? cookie[0] : cookie;
    const active = await this.sessions.current(readSessionId(header));
    return { state: active ? 'authenticated' : 'anonymous' };
  }

  @Post()
  async signIn(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() body: unknown,
  ): Promise<SignInResult> {
    if (!this.limiter.allow(`sign-in:${request.ip ?? 'unknown'}`)) {
      throw new HttpException({ status: 'rate_limited' }, 429);
    }

    const result = await this.sessions.signIn(body);
    if (result.httpStatus !== 201) throw new HttpException(result.body, result.httpStatus);
    response.setHeader('Set-Cookie', `session=${result.sessionId}; HttpOnly; Path=/; SameSite=Lax`);
    return result.body;
  }
}
