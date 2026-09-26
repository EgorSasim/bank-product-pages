import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { Client } from 'pg';
import { ApplicationsService } from './applications/applications.service.js';
import { databaseUrl } from './database.js';
import { PagesService } from './pages/pages.service.js';
import type { Sql } from './sql.js';

const enabled = process.env.API_INTEGRATION === '1';

test('the seeded catalog is readable and an application keeps the session user', { skip: !enabled }, async () => {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  const db: Sql = { query: (text, values) => client.query(text, values) };
  const pages = new PagesService(db);
  const applications = new ApplicationsService(db);
  const userId = randomUUID();
  const sessionId = randomUUID();

  try {
    const home = await pages.open('home', 'default');
    assert.equal(home.status, 'ok');
    if (home.status !== 'ok') return;
    const cards = home.page.blocks.find((block) => block.type === 'productCards');
    assert.equal(cards?.type, 'productCards');
    if (cards?.type !== 'productCards') return;
    assert.deepEqual(
      cards.props.cards.map((card) => card.category),
      ['card', 'loan', 'leasing', 'installment', 'deposit'],
    );

    const anonymous = await pages.open('deposit', 'default');
    const salary = await pages.open('deposit', 'salary');
    assert.equal(anonymous.status, 'ok');
    assert.equal(salary.status, 'ok');
    if (anonymous.status !== 'ok' || salary.status !== 'ok') return;
    const anonymousStory = anonymous.page.blocks.find((block) => block.type === 'richText');
    const salaryStory = salary.page.blocks.find((block) => block.type === 'richText');
    const salaryStats = salary.page.blocks.find((block) => block.type === 'stats');
    assert.equal(anonymousStory?.type, 'richText');
    assert.equal(salaryStory?.type, 'richText');
    assert.equal(salaryStats?.type, 'stats');
    if (anonymousStory?.type !== 'richText' || salaryStory?.type !== 'richText' || salaryStats?.type !== 'stats') return;
    assert.equal(anonymousStory.props.paragraphs[0], 'Проценты начисляются в конце срока. Пополнение и снятие не предусмотрены.');
    assert.equal(salaryStory.props.paragraphs[0], 'Для зарплатных клиентов ставка выше на 0,5 п.п. Условия вклада в блоке показателей те же.');
    assert.equal(salaryStats.props.items[0]?.value, 'до 14%');

    const card = await pages.open('credit-card', 'default');
    assert.equal(card.status, 'ok');
    if (card.status !== 'ok') return;
    const form = card.page.blocks.find((block) => block.type === 'applicationForm');
    assert.equal(form?.type, 'applicationForm');
    if (form?.type !== 'applicationForm') return;

    const before = await client.query<{ count: string }>('select count(*) from submissions');
    const refused = await applications.submit({
      sessionId: undefined,
      body: { blockId: form.id, userId: 'attacker', answers: { fullName: 'Иван', phone: '+375', consent: true } },
    });
    const afterRefusal = await client.query<{ count: string }>('select count(*) from submissions');
    assert.equal(refused.httpStatus, 401);
    assert.equal(afterRefusal.rows[0]?.count, before.rows[0]?.count);

    await client.query('insert into users (id, email, password_hash) values ($1, $2, $3)', [
      userId,
      `${userId}@example.test`,
      'hash',
    ]);
    await client.query('insert into sessions (id, user_id) values ($1, $2)', [sessionId, userId]);

    const accepted = await applications.submit({
      sessionId,
      body: {
        blockId: form.id,
        userId: 'attacker',
        answers: { fullName: 'Иван', phone: '+375', consent: true, extra: 'no' },
      },
    });
    assert.equal(accepted.httpStatus, 201);
    if (accepted.httpStatus !== 201 || accepted.body.status !== 'accepted') return;
    const stored = await client.query<{ user_id: string; answers: Record<string, unknown> }>(
      'select user_id, answers from submissions where id = $1',
      [accepted.body.submissionId],
    );
    assert.equal(stored.rows[0]?.user_id, userId);
    assert.deepEqual(stored.rows[0]?.answers, { fullName: 'Иван', phone: '+375', consent: true });
  } finally {
    await client.query('delete from submissions where user_id = $1', [userId]);
    await client.query('delete from users where id = $1', [userId]);
    await client.end();
  }
});
