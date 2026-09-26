import assert from 'node:assert/strict';
import test from 'node:test';
import { assemblePage } from './assemble.js';

const cards = [
  { slug: 'credit-card', title: 'Кредитная карта', summary: 'Карта', category: 'card', highlight: '120 дней' },
  { slug: 'cash-loan', title: 'Кредит', summary: 'Кредит', category: 'loan', highlight: 'от 12%' },
];

test('home cards come from the product list, and an unknown block is skipped', () => {
  const parsed = assemblePage({
    slug: 'home',
    title: 'Продукты банка',
    description: 'Список',
    blocks: [
      { id: 'hero', type: 'hero', props: { title: 'Продукты банка', subtitle: 'Выберите' } },
      { id: 'future', type: 'carousel', props: { cards: ['stored copy'] } },
      { id: 'cards', type: 'productCards', props: { cards: [] } },
    ],
    cards,
  });

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(
    parsed.value.blocks.map((block) => block.type),
    ['hero', 'productCards'],
  );
  const list = parsed.value.blocks[1];
  if (list?.type !== 'productCards') return;
  assert.deepEqual(
    list.props.cards.map((card) => card.category),
    ['card', 'loan'],
  );
});

test('a salary story replaces the whole text block and leaves the stats block alone', () => {
  const parsed = assemblePage({
    slug: 'deposit',
    title: 'Вклад',
    description: 'Ставка',
    blocks: [
      {
        id: 'stats',
        type: 'stats',
        props: { items: [{ label: 'Ставка', value: 'до 14%' }] },
      },
      {
        id: 'story',
        type: 'richText',
        props: { paragraphs: ['Для зарплатных клиентов ставка выше на 0,5 п.п.'] },
      },
    ],
    cards: [],
  });

  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const stats = parsed.value.blocks[0];
  const story = parsed.value.blocks[1];
  if (stats?.type !== 'stats' || story?.type !== 'richText') return;
  assert.equal(stats.props.items[0]?.value, 'до 14%');
  assert.equal(story.props.paragraphs[0], 'Для зарплатных клиентов ставка выше на 0,5 п.п.');
});
