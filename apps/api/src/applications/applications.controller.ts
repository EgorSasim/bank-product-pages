import { Body, Controller, Headers, HttpException, InternalServerErrorException, Post, Req } from '@nestjs/common';
import type { SubmitApplicationResult } from '@bank/contract';
import type { Request } from 'express';
import { RateLimiter } from '../rate-limit.js';
import { readSessionId } from '../session-cookie.js';
import { ApplicationsService } from './applications.service.js';

@Controller('api/applications')
export class ApplicationsController {
  constructor(
    private readonly applications: ApplicationsService,
    private readonly limiter: RateLimiter,
  ) {}

  @Post()
  async submit(
    @Req() request: Request,
    @Headers('cookie') cookie: string | string[] | undefined,
    @Body() body: unknown,
  ): Promise<SubmitApplicationResult> {
    const address = request.ip ?? 'unknown';
    if (!this.limiter.allow(address)) {
      throw new HttpException({ status: 'rate_limited' }, 429);
    }

    const header = Array.isArray(cookie) ? cookie[0] : cookie;
    const result = await this.applications.submit({ sessionId: readSessionId(header), body });
    if (result.httpStatus === 500) throw new InternalServerErrorException();
    if (result.httpStatus !== 201) throw new HttpException(result.body, result.httpStatus);
    return result.body;
  }
}
