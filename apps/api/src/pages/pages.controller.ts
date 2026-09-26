import { Controller, Get, Headers, InternalServerErrorException, NotFoundException, Param } from '@nestjs/common';
import type { PageDocument } from '@bank/contract';
import { readSegment } from '../segment.js';
import { PagesService } from './pages.service.js';

@Controller('api/pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @Get(':slug')
  async open(
    @Param('slug') slug: string,
    @Headers('x-segment') segment: string | string[] | undefined,
  ): Promise<PageDocument> {
    const header = Array.isArray(segment) ? segment[0] : segment;
    const result = await this.pages.open(slug, readSegment(header));
    if (result.status === 'not_found') throw new NotFoundException();
    if (result.status === 'unreadable') throw new InternalServerErrorException();
    return result.page;
  }
}
