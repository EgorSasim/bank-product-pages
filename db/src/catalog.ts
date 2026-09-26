import type { FormField, PageDocument, ProductRecord } from '@bank/contract';

export const pageIds = {
  home: '10000000-0000-4000-8000-000000000001',
  card: '10000000-0000-4000-8000-000000000002',
  loan: '10000000-0000-4000-8000-000000000003',
  deposit: '10000000-0000-4000-8000-000000000004',
  leasing: '10000000-0000-4000-8000-000000000005',
  installment: '10000000-0000-4000-8000-000000000006',
} as const;

export const blockIds = {
  homeHero: '30000000-0000-4000-8000-000000000001',
  homeCards: '30000000-0000-4000-8000-000000000002',
  cardHero: '30000000-0000-4000-8000-000000000003',
  cardFacts: '30000000-0000-4000-8000-000000000004',
  cardForm: '30000000-0000-4000-8000-000000000005',
  loanHero: '30000000-0000-4000-8000-000000000006',
  loanStats: '30000000-0000-4000-8000-000000000007',
  loanForm: '30000000-0000-4000-8000-000000000008',
  depositHero: '30000000-0000-4000-8000-000000000009',
  depositStats: '30000000-0000-4000-8000-00000000000a',
  depositStory: '30000000-0000-4000-8000-00000000000b',
  depositForm: '30000000-0000-4000-8000-00000000000c',
  leasingHero: '30000000-0000-4000-8000-00000000000d',
  leasingFacts: '30000000-0000-4000-8000-00000000000e',
  leasingStory: '30000000-0000-4000-8000-00000000000f',
  leasingForm: '30000000-0000-4000-8000-000000000010',
  installmentHero: '30000000-0000-4000-8000-000000000011',
  installmentStory: '30000000-0000-4000-8000-000000000012',
  installmentStats: '30000000-0000-4000-8000-000000000013',
  installmentForm: '30000000-0000-4000-8000-000000000014',
} as const;

export const productIds = {
  card: '20000000-0000-4000-8000-000000000002',
  loan: '20000000-0000-4000-8000-000000000003',
  deposit: '20000000-0000-4000-8000-000000000004',
  leasing: '20000000-0000-4000-8000-000000000005',
  installment: '20000000-0000-4000-8000-000000000006',
} as const;

export type SeedPage = {
  id: string;
  document: PageDocument;
};

export type SeedProduct = {
  id: string;
  pageId: string;
  homePosition: number;
  record: ProductRecord;
};

export type SeedVariant = {
  blockId: string;
  segment: 'salary' | 'premium';
  props: { paragraphs: string[] };
};

const consent: FormField = {
  name: 'consent',
  kind: 'checkbox',
  label: 'Согласен на обработку данных',
  required: true,
};

const fullName: FormField = { name: 'fullName', kind: 'text', label: 'ФИО', required: true };

export const pages: SeedPage[] = [
  {
    id: pageIds.home,
    document: {
      slug: 'home',
      title: 'Продукты банка',
      description: 'Карты, кредиты, вклады, лизинг и рассрочка',
      blocks: [
        {
          id: blockIds.homeHero,
          type: 'hero',
          props: {
            title: 'Продукты банка',
            subtitle: 'Выберите предложение и оставьте заявку',
          },
        },
        {
          id: blockIds.homeCards,
          type: 'productCards',
          props: { cards: [] },
        },
      ],
    },
  },
  {
    id: pageIds.card,
    document: {
      slug: 'credit-card',
      title: 'Кредитная карта',
      description: 'Льготный период и кэшбэк',
      blocks: [
        {
          id: blockIds.cardHero,
          type: 'hero',
          props: { title: 'Кредитная карта', subtitle: 'Для ежедневных покупок' },
        },
        {
          id: blockIds.cardFacts,
          type: 'keyFacts',
          props: {
            title: 'Условия',
            items: [
              { label: 'Льготный период', value: '120 дней' },
              { label: 'Обслуживание', value: '0 ₽ в первый год' },
            ],
          },
        },
        form(blockIds.cardForm, 'Заявка на карту', [
          fullName,
          { name: 'phone', kind: 'text', label: 'Телефон', required: true },
          consent,
        ]),
      ],
    },
  },
  {
    id: pageIds.loan,
    document: {
      slug: 'cash-loan',
      title: 'Кредит наличными',
      description: 'Сумма и ставка кредита',
      blocks: [
        {
          id: blockIds.loanHero,
          type: 'hero',
          props: { title: 'Кредит наличными', subtitle: 'На любые цели' },
        },
        {
          id: blockIds.loanStats,
          type: 'stats',
          props: {
            items: [
              { label: 'Ставка', value: 'от 12%' },
              { label: 'Сумма', value: 'до 5 млн ₽' },
            ],
          },
        },
        form(blockIds.loanForm, 'Заявка на кредит', [
          fullName,
          { name: 'income', kind: 'text', label: 'Ежемесячный доход', required: true },
          { name: 'term', kind: 'select', label: 'Срок', required: true, options: ['12', '36', '60'] },
          consent,
        ]),
      ],
    },
  },
  {
    id: pageIds.deposit,
    document: {
      slug: 'deposit',
      title: 'Вклад',
      description: 'Срок и ставка вклада',
      blocks: [
        {
          id: blockIds.depositHero,
          type: 'hero',
          props: { title: 'Вклад', subtitle: 'Фиксированная ставка на весь срок' },
        },
        {
          id: blockIds.depositStats,
          type: 'stats',
          props: {
            items: [
              { label: 'Ставка', value: 'до 14%' },
              { label: 'Срок', value: 'от 3 месяцев' },
            ],
          },
        },
        {
          id: blockIds.depositStory,
          type: 'richText',
          props: {
            paragraphs: ['Проценты начисляются в конце срока. Пополнение и снятие не предусмотрены.'],
          },
        },
        form(blockIds.depositForm, 'Открыть вклад', [
          fullName,
          { name: 'amount', kind: 'text', label: 'Сумма', required: true },
          { name: 'term', kind: 'select', label: 'Срок', required: true, options: ['3', '6', '12'] },
          consent,
        ]),
      ],
    },
  },
  {
    id: pageIds.leasing,
    document: {
      slug: 'car-leasing',
      title: 'Лизинг авто',
      description: 'Первый взнос и срок лизинга',
      blocks: [
        {
          id: blockIds.leasingHero,
          type: 'hero',
          props: { title: 'Лизинг авто', subtitle: 'Для бизнеса и частных клиентов' },
        },
        {
          id: blockIds.leasingFacts,
          type: 'keyFacts',
          props: {
            title: 'Условия',
            items: [
              { label: 'Первый взнос', value: 'от 10%' },
              { label: 'Срок', value: 'до 5 лет' },
            ],
          },
        },
        {
          id: blockIds.leasingStory,
          type: 'richText',
          props: {
            paragraphs: ['Предмет лизинга остаётся в собственности банка до выкупа.'],
          },
        },
        form(blockIds.leasingForm, 'Заявка на лизинг', [
          fullName,
          { name: 'company', kind: 'text', label: 'Компания', required: false },
          {
            name: 'downPayment',
            kind: 'select',
            label: 'Первый взнос',
            required: true,
            options: ['10%', '20%', '30%'],
          },
          consent,
        ]),
      ],
    },
  },
  {
    id: pageIds.installment,
    document: {
      slug: 'split-pay',
      title: 'Рассрочка',
      description: 'Оплата покупки частями',
      blocks: [
        {
          id: blockIds.installmentHero,
          type: 'hero',
          props: { title: 'Рассрочка', subtitle: 'Без переплаты у партнёров' },
        },
        {
          id: blockIds.installmentStory,
          type: 'richText',
          props: {
            paragraphs: ['Платёж делится на равные части. Досрочное погашение не меняет график комиссий.'],
          },
        },
        {
          id: blockIds.installmentStats,
          type: 'stats',
          props: {
            items: [
              { label: 'Срок', value: '6 месяцев' },
              { label: 'Переплата', value: '0%' },
            ],
          },
        },
        form(blockIds.installmentForm, 'Оформить рассрочку', [
          fullName,
          { name: 'phone', kind: 'text', label: 'Телефон', required: true },
          { name: 'months', kind: 'select', label: 'Срок', required: true, options: ['3', '6', '10'] },
          consent,
        ]),
      ],
    },
  },
];

export const products: SeedProduct[] = [
  product(productIds.card, pageIds.card, 1, {
    slug: 'credit-card',
    title: 'Кредитная карта',
    summary: 'Карта для ежедневных покупок',
    category: 'card',
    highlight: '120 дней без процентов',
    terms: { category: 'card', gracePeriod: '120 дней' },
  }),
  product(productIds.loan, pageIds.loan, 2, {
    slug: 'cash-loan',
    title: 'Кредит наличными',
    summary: 'Деньги на любые цели',
    category: 'loan',
    highlight: 'от 12% годовых',
    terms: { category: 'loan', rateFrom: '12%', amountTo: '5 млн ₽' },
  }),
  product(productIds.leasing, pageIds.leasing, 3, {
    slug: 'car-leasing',
    title: 'Лизинг авто',
    summary: 'Автомобиль с выкупом в конце срока',
    category: 'leasing',
    highlight: 'взнос от 10%',
    terms: { category: 'leasing', downPayment: 'от 10%' },
  }),
  product(productIds.installment, pageIds.installment, 4, {
    slug: 'split-pay',
    title: 'Рассрочка',
    summary: 'Оплата покупки равными частями',
    category: 'installment',
    highlight: 'на 6 месяцев',
    terms: { category: 'installment', months: '6' },
  }),
  product(productIds.deposit, pageIds.deposit, 5, {
    slug: 'deposit',
    title: 'Вклад',
    summary: 'Ставка фиксируется при открытии',
    category: 'deposit',
    highlight: 'до 14% годовых',
    terms: { category: 'deposit', rate: '14%' },
  }),
];

export const variants: SeedVariant[] = [
  {
    blockId: blockIds.depositStory,
    segment: 'salary',
    props: {
      paragraphs: ['Для зарплатных клиентов ставка выше на 0,5 п.п. Условия вклада в блоке показателей те же.'],
    },
  },
];

function form(id: string, title: string, fields: FormField[]): PageDocument['blocks'][number] {
  return { id, type: 'applicationForm', props: { title, fields } };
}

function product(id: string, pageId: string, homePosition: number, record: ProductRecord): SeedProduct {
  return { id, pageId, homePosition, record };
}
