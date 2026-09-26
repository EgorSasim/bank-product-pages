import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parsePageDocument, parseProductRecord, productCategories, readPageDocument } from '@bank/contract';
import { blockIds, pages, products, variants } from './catalog.js';

const schema = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../migrations/001_schema.sql'),
  'utf8',
);

test('schema checks every product category from the contract', () => {
  for (const category of productCategories) {
    assert.match(schema, new RegExp(`'${category}'`));
  }
});

test('every seeded page matches the block contract', () => {
  for (const page of pages) {
    const parsed = parsePageDocument(page.document);
    assert.equal(parsed.ok, true, parsed.ok ? '' : parsed.error);
  }
});

test('home stores an empty card slot and the offers live on products', () => {
  const home = pages.find((page) => page.document.slug === 'home');
  assert.ok(home);
  const parsed = readPageDocument(home.document);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const cards = parsed.value.blocks.find((block) => block.type === 'productCards');
  assert.equal(cards?.type, 'productCards');
  if (cards?.type !== 'productCards') return;
  assert.deepEqual(cards.props.cards, []);
  assert.deepEqual(
    products.map((item) => item.record.category),
    ['card', 'loan', 'leasing', 'installment', 'deposit'],
  );
});

test('product pages use different block sequences', () => {
  const sequences = Object.fromEntries(
    pages
      .filter((page) => page.document.slug !== 'home')
      .map((page) => [page.document.slug, page.document.blocks.map((block) => block.type)]),
  );
  assert.deepEqual(sequences['credit-card'], ['bannerCarousel', 'hero', 'keyFacts', 'applicationForm']);
  assert.deepEqual(sequences['cash-loan'], ['hero', 'applicationForm', 'stats', 'bannerCarousel']);
  assert.deepEqual(sequences['deposit'], ['stats', 'richText', 'hero', 'bannerCarousel', 'applicationForm']);
  assert.deepEqual(sequences['car-leasing'], ['keyFacts', 'bannerCarousel', 'hero', 'applicationForm', 'richText']);
  assert.deepEqual(sequences['split-pay'], ['richText', 'hero', 'applicationForm', 'bannerCarousel', 'stats']);
  const lists = Object.values(sequences);
  assert.equal(new Set(lists.map((list) => list.join(','))).size, lists.length);
});

test('each product passes the terms check and points at its page slug', () => {
  for (const item of products) {
    const parsed = parseProductRecord(item.record);
    assert.equal(parsed.ok, true, parsed.ok ? '' : parsed.error);
    const page = pages.find((candidate) => candidate.id === item.pageId);
    assert.equal(page?.document.slug, item.record.slug);
  }
});

test('salary banner variant replaces the whole carousel and leaves product terms alone', () => {
  const banners = variants.find((variant) => variant.blockId === blockIds.cardCarousel);
  assert.ok(banners);
  const parsed = parsePageDocument({
    slug: 'credit-card',
    title: 'Кредитная карта',
    description: 'Льготный период и кэшбэк',
    blocks: [{ id: banners.blockId, type: 'bannerCarousel', props: banners.props }],
  });
  assert.equal(parsed.ok, true, parsed.ok ? '' : parsed.error);
  if (!parsed.ok) return;
  const block = parsed.value.blocks[0];
  assert.equal(block?.type, 'bannerCarousel');
  if (block?.type !== 'bannerCarousel') return;
  assert.equal(block.props.slides[0]?.alt, 'Баннер6');
  const card = pages.find((page) => page.document.slug === 'credit-card');
  assert.equal(
    card?.document.blocks.some((item) => item.id === blockIds.cardFacts && item.type === 'keyFacts'),
    true,
  );
});

test('salary variant is a full rich text payload, not a patch', () => {
  const story = variants.find((variant) => variant.blockId === blockIds.depositStory);
  assert.ok(story);
  const parsed = parsePageDocument({
    slug: 'deposit',
    title: 'Вклад',
    description: 'Срок и ставка вклада',
    blocks: [{ id: story.blockId, type: 'richText', props: story.props }],
  });
  assert.equal(parsed.ok, true, parsed.ok ? '' : parsed.error);
});
