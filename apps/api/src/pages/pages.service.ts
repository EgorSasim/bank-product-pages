import { Inject, Injectable } from '@nestjs/common';
import type { PageDocument } from '@bank/contract';
import { assemblePage } from './assemble.js';
import { DATABASE } from '../database.js';
import { rowsOf, selectBlocks, selectCards, selectPage, type Sql } from '../sql.js';
import type { Segment } from '../segment.js';

export type OpenPageResult =
  | { status: 'ok'; page: PageDocument }
  | { status: 'not_found' }
  | { status: 'unreadable' };

type PageRow = { id: string; slug: string; title: string; description: string };
type BlockRow = { id: string; type: string; props: unknown };

@Injectable()
export class PagesService {
  constructor(@Inject(DATABASE) private readonly db: Sql) {}

  async open(slug: string, segment: Segment): Promise<OpenPageResult> {
    const page = await this.db.query(selectPage, [slug]);
    const stored = rowsOf<PageRow>(page)[0];
    if (!stored) return { status: 'not_found' };

    const [blocks, cards] = await Promise.all([
      this.db.query(selectBlocks, [stored.id, segment]),
      this.db.query(selectCards),
    ]);

    const assembled = assemblePage({
      slug: stored.slug,
      title: stored.title,
      description: stored.description,
      blocks: rowsOf<BlockRow>(blocks),
      cards: cards.rows,
    });
    if (!assembled.ok) return { status: 'unreadable' };
    return { status: 'ok', page: assembled.value };
  }
}
