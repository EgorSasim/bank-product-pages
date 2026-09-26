import { readPageDocument, type PageDocument } from '@bank/contract';
import type { ParseResult } from '@bank/contract';

export type StoredBlock = {
  id: string;
  type: string;
  props: unknown;
};

export function assemblePage(input: {
  slug: string;
  title: string;
  description: string;
  blocks: StoredBlock[];
  cards: unknown[];
}): ParseResult<PageDocument> {
  return readPageDocument({
    slug: input.slug,
    title: input.title,
    description: input.description,
    blocks: input.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      props: block.type === 'productCards' ? cardsProps(block.props, input.cards) : block.props,
    })),
  });
}

function cardsProps(props: unknown, cards: unknown[]): unknown {
  if (typeof props !== 'object' || props === null || Array.isArray(props)) {
    return { cards };
  }
  return { ...props, cards };
}
