import type { Client } from 'pg';
import { pages, products, variants } from './catalog.js';

export async function seed(client: Client): Promise<void> {
  try {
    await client.query('begin');
    await client.query('delete from submissions');
    await client.query('delete from sessions');
    await client.query('delete from users');
    await client.query('delete from block_variants');
    await client.query('delete from blocks');
    await client.query('delete from products');
    await client.query('delete from pages');

    for (const page of pages) {
      await client.query(
        'insert into pages (id, slug, title, description, published) values ($1, $2, $3, $4, true)',
        [page.id, page.document.slug, page.document.title, page.document.description],
      );
      for (const [position, block] of page.document.blocks.entries()) {
        await client.query(
          'insert into blocks (id, page_id, position, type, props) values ($1, $2, $3, $4, $5::jsonb)',
          [block.id, page.id, position, block.type, JSON.stringify(block.props)],
        );
      }
    }

    for (const item of products) {
      await client.query(
        `insert into products
           (id, slug, category, title, summary, highlight, terms, page_id, home_position, published)
         values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, true)`,
        [
          item.id,
          item.record.slug,
          item.record.category,
          item.record.title,
          item.record.summary,
          item.record.highlight,
          JSON.stringify(item.record.terms),
          item.pageId,
          item.homePosition,
        ],
      );
    }

    for (const variant of variants) {
      await client.query(
        'insert into block_variants (block_id, segment, props) values ($1, $2, $3::jsonb)',
        [variant.blockId, variant.segment, JSON.stringify(variant.props)],
      );
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  }
}
