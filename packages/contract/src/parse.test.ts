import assert from 'node:assert/strict';
import test from 'node:test';
import { canSubmit, readSignIn, validateAnswers } from './application.js';
import { parsePageDocument, readPageDocument } from './page.js';
import { parseProductRecord } from './product.js';

const home = {
  slug: 'home',
  title: 'Продукты банка',
  description: 'Карты, кредиты, вклады, лизинг и рассрочка',
  blocks: [
    {
      id: 'cards',
      type: 'productCards',
      props: {
        cards: [
          card('credit-card', 'card', 'Кредитная карта', '120 дней без процентов'),
          card('cash-loan', 'loan', 'Кредит наличными', 'от 12% годовых'),
          card('deposit', 'deposit', 'Вклад', 'до 14% годовых'),
          card('car-leasing', 'leasing', 'Лизинг авто', 'взнос от 10%'),
          card('split-pay', 'installment', 'Рассрочка', 'на 6 месяцев'),
        ],
      },
    },
  ],
};

test('home page keeps mixed product kinds in one card list', () => {
  const parsed = readPageDocument(home);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const block = parsed.value.blocks[0];
  assert.equal(block?.type, 'productCards');
  if (block?.type !== 'productCards') return;
  assert.deepEqual(
    block.props.cards.map((item) => item.category),
    ['card', 'loan', 'deposit', 'leasing', 'installment'],
  );
});

test('strict parse rejects a block type outside the catalog', () => {
  const parsed = parsePageDocument({
    slug: 'cash-loan',
    title: 'Кредит наличными',
    description: 'Условия кредита',
    blocks: [{ id: 'unknown', type: 'carousel', props: {} }],
  });
  assert.equal(parsed.ok, false);
});

test('read skips an unknown block and keeps the rest of the page', () => {
  const parsed = readPageDocument({
    slug: 'cash-loan',
    title: 'Кредит наличными',
    description: 'Условия кредита',
    blocks: [
      { id: 'hero', type: 'hero', props: { title: 'Кредит', subtitle: 'На любые цели' } },
      { id: 'future', type: 'carousel', props: {} },
      {
        id: 'form',
        type: 'applicationForm',
        props: {
          title: 'Заявка',
          fields: [{ name: 'income', kind: 'text', label: 'Доход', required: true }],
        },
      },
    ],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(
    parsed.value.blocks.map((block) => block.type),
    ['hero', 'applicationForm'],
  );
});

test('banner carousel accepts local slides and rejects an outside image', () => {
  const accepted = parsePageDocument({
    slug: 'credit-card',
    title: 'Кредитная карта',
    description: 'Льготный период и кэшбэк',
    blocks: [
      {
        id: 'banners',
        type: 'bannerCarousel',
        props: { slides: [{ src: '/banners/banner-1.svg', alt: 'Баннер1' }] },
      },
    ],
  });
  assert.equal(accepted.ok, true);
  const rejected = parsePageDocument({
    slug: 'credit-card',
    title: 'Кредитная карта',
    description: 'Льготный период и кэшбэк',
    blocks: [
      {
        id: 'banners',
        type: 'bannerCarousel',
        props: { slides: [{ src: 'https://example.com/banner.png', alt: 'Баннер1' }] },
      },
    ],
  });
  assert.equal(rejected.ok, false);
});

test('product terms must use the same category as the product', () => {
  const parsed = parseProductRecord({
    slug: 'car-leasing',
    title: 'Лизинг авто',
    summary: 'Автомобиль для бизнеса',
    category: 'leasing',
    highlight: 'взнос от 10%',
    terms: { category: 'loan', rateFrom: '12%', amountTo: '100000' },
  });
  assert.equal(parsed.ok, false);
});

test('answer check drops unknown keys and reports every missing required field', () => {
  const parsed = validateAnswers(
    [
      { name: 'income', kind: 'text', label: 'Доход', required: true },
      { name: 'term', kind: 'select', label: 'Срок', required: true, options: ['12', '24'] },
      { name: 'consent', kind: 'checkbox', label: 'Согласие', required: true },
    ],
    { income: '2000', term: '36', extra: 'ignore me' },
  );
  assert.equal(parsed.ok, false);
  if (parsed.ok) return;
  assert.deepEqual(
    parsed.fieldErrors.map((error) => error.name),
    ['term', 'consent'],
  );
});

test('anonymous session cannot submit an application', () => {
  assert.equal(canSubmit({ state: 'anonymous' }), false);
  assert.equal(canSubmit({ state: 'authenticated', userId: 'user-1' }), true);
});

test('sign-in requires an email and a password of at least 8 characters', () => {
  const missing = readSignIn({ email: 'not-an-email', password: 'short' });
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.deepEqual(
    missing.fieldErrors.map((error) => error.name),
    ['email', 'password'],
  );
  const accepted = readSignIn({ email: ' Visitor@Example.COM ', password: 'long-enough' });
  assert.equal(accepted.ok, true);
  if (!accepted.ok) return;
  assert.deepEqual(accepted.value, { email: 'visitor@example.com', password: 'long-enough' });
});

function card(slug: string, category: string, title: string, highlight: string) {
  return { slug, category, title, summary: title, highlight };
}
