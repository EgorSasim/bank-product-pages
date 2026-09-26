import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import { AppModule } from './app.module.js';
import { DATABASE } from './database.js';
import { selectBlocks, selectCards, selectPage, selectSession, type Sql } from './sql.js';

const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

test('GET resolves the segment and POST refuses an anonymous application', async () => {
  const db = catalogDb();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DATABASE)
    .useValue(db)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.listen(0);
  const server = app.getHttpServer() as Server;
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const missing = await fetch(`${base}/api/pages/missing`);
    assert.equal(missing.status, 404);

    const home = await fetch(`${base}/api/pages/home`);
    assert.equal(home.status, 200);
    const homeBody = (await home.json()) as { blocks: { type: string; props: { cards?: { category: string }[] } }[] };
    const cards = homeBody.blocks.find((block) => block.type === 'productCards');
    assert.deepEqual(
      cards?.props.cards?.map((card) => card.category),
      ['card', 'loan'],
    );

    const salary = await fetch(`${base}/api/pages/deposit`, { headers: { 'X-Segment': 'salary' } });
    const salaryBody = (await salary.json()) as { blocks: { type: string; props: { paragraphs?: string[]; items?: { value: string }[] } }[] };
    assert.equal(salaryBody.blocks.find((block) => block.type === 'richText')?.props.paragraphs?.[0], 'salary copy');
    assert.equal(salaryBody.blocks.find((block) => block.type === 'stats')?.props.items?.[0]?.value, 'до 14%');

    const anonymous = await fetch(`${base}/api/applications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ blockId: 'form-1', answers: { fullName: 'secret-name', consent: true } }),
    });
    assert.equal(anonymous.status, 401);
    const anonymousBody = (await anonymous.json()) as { status: string };
    assert.equal(anonymousBody.status, 'authentication_required');
    assert.equal(JSON.stringify(anonymousBody).includes('secret-name'), false);
    assert.equal(db.writes, 0);

    const unknownSegment = await fetch(`${base}/api/pages/deposit`, { headers: { 'X-Segment': 'bot' } });
    const defaultBody = (await unknownSegment.json()) as { blocks: { type: string; props: { paragraphs?: string[] } }[] };
    assert.equal(defaultBody.blocks.find((block) => block.type === 'richText')?.props.paragraphs?.[0], 'default copy');
  } finally {
    await app.close();
  }
});

test('an authenticated POST stores the application and a burst returns rate_limited', async () => {
  const db = catalogDb();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DATABASE)
    .useValue(db)
    .compile();
  const app = moduleRef.createNestApplication();
  await app.listen(0);
  const server = app.getHttpServer() as Server;
  const address = server.address() as AddressInfo;
  const base = `http://127.0.0.1:${address.port}`;

  try {
    const accepted = await fetch(`${base}/api/applications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `session=${sessionId}` },
      body: JSON.stringify({
        blockId: 'form-1',
        userId: 'attacker',
        answers: { fullName: 'Иван', phone: '+375', consent: true, extra: 'no' },
      }),
    });
    assert.equal(accepted.status, 201);
    const acceptedBody = (await accepted.json()) as { status: string };
    assert.equal(acceptedBody.status, 'accepted');
    assert.equal(db.writes, 1);
    assert.equal(db.lastUserId, 'user-1');

    const invalid = await fetch(`${base}/api/applications`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `session=${sessionId}` },
      body: JSON.stringify({ blockId: 'form-1', answers: { phone: 'secret-phone' } }),
    });
    assert.equal(invalid.status, 422);
    const invalidBody = await invalid.text();
    assert.equal(invalidBody.includes('secret-phone'), false);
    assert.equal(db.writes, 1);

    let limited = 0;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const response = await fetch(`${base}/api/applications`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ blockId: 'form-1', answers: {} }),
      });
      if (response.status === 429) {
        limited += 1;
        const body = (await response.json()) as { status: string };
        assert.equal(body.status, 'rate_limited');
        break;
      }
    }
    assert.equal(limited, 1);
  } finally {
    await app.close();
  }
});

function catalogDb(): Sql & { writes: number; lastUserId?: string } {
  const state = { writes: 0, lastUserId: undefined as string | undefined };
  const api: Sql & { writes: number; lastUserId?: string } = {
    get writes() {
      return state.writes;
    },
    get lastUserId() {
      return state.lastUserId;
    },
    async query(text: string, values?: unknown[]) {
      if (text === selectPage) {
        if (values?.[0] === 'home') {
          return { rows: [{ id: 'page-home', slug: 'home', title: 'Продукты банка', description: 'Список' }] };
        }
        if (values?.[0] === 'deposit') {
          return { rows: [{ id: 'page-deposit', slug: 'deposit', title: 'Вклад', description: 'Ставка' }] };
        }
        return { rows: [] };
      }
      if (text === selectBlocks) {
        if (values?.[0] === 'page-home') {
          return {
            rows: [
              { id: 'hero', type: 'hero', props: { title: 'Продукты банка', subtitle: 'Выберите' } },
              { id: 'cards', type: 'productCards', props: { cards: [] } },
            ],
          };
        }
        const story = values?.[1] === 'salary' ? 'salary copy' : 'default copy';
        return {
          rows: [
            { id: 'stats', type: 'stats', props: { items: [{ label: 'Ставка', value: 'до 14%' }] } },
            { id: 'story', type: 'richText', props: { paragraphs: [story] } },
          ],
        };
      }
      if (text === selectCards) {
        return {
          rows: [
            { slug: 'credit-card', title: 'Карта', summary: 'Карта', category: 'card', highlight: '120 дней' },
            { slug: 'cash-loan', title: 'Кредит', summary: 'Кредит', category: 'loan', highlight: 'от 12%' },
          ],
        };
      }
      if (text === selectSession) {
        return { rows: values?.[0] === sessionId ? [{ user_id: 'user-1' }] : [] };
      }
      if (text.includes('insert into submissions')) {
        state.writes += 1;
        state.lastUserId = String(values?.[2]);
        return { rows: [{ id: String(values?.[0]) }] };
      }
      if (text.includes('from blocks where id')) {
        return {
          rows: [
            {
              id: 'form-1',
              type: 'applicationForm',
              props: {
                title: 'Заявка',
                fields: [
                  { name: 'fullName', kind: 'text', label: 'ФИО', required: true },
                  { name: 'phone', kind: 'text', label: 'Телефон', required: true },
                  { name: 'consent', kind: 'checkbox', label: 'Согласие', required: true },
                ],
              },
            },
          ],
        };
      }
      throw new Error(`unexpected query: ${text}`);
    },
  };
  return api;
}
