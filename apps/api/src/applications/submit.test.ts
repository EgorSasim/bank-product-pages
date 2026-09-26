import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationsService } from './applications.service.js';
import { insertSubmission, selectBlock, selectSession, type Sql } from '../sql.js';
import { readSessionId } from '../session-cookie.js';

const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const formId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

const form = {
  id: formId,
  type: 'applicationForm',
  props: {
    title: 'Заявка на карту',
    fields: [
      { name: 'fullName', kind: 'text', label: 'ФИО', required: true },
      { name: 'phone', kind: 'text', label: 'Телефон', required: true },
      { name: 'consent', kind: 'checkbox', label: 'Согласие', required: true },
    ],
  },
};

test('a missing or unknown session writes nothing', async () => {
  const db = fakeDb({ writes: [] });
  const service = new ApplicationsService(db);

  const missing = await service.submit({ sessionId: undefined, body: { blockId: formId, answers: {} } });
  const unknown = await service.submit({ sessionId, body: { blockId: formId, answers: {} } });

  assert.equal(missing.httpStatus, 401);
  assert.equal(unknown.httpStatus, 401);
  assert.deepEqual(db.writes, []);
  assert.equal(db.queries.some((query) => query === insertSubmission), false);
});

test('a valid application is stored for the session user and drops extra keys', async () => {
  const db = fakeDb({ userId, block: form, writes: [] });
  const service = new ApplicationsService(db);

  const result = await service.submit({
    sessionId,
    body: {
      blockId: formId,
      userId: 'attacker',
      answers: { fullName: 'Иван', phone: '+375', consent: true, userId: 'attacker', extra: 'no' },
    },
  });

  assert.equal(result.httpStatus, 201);
  if (result.httpStatus !== 201) return;
  assert.equal(result.body.status, 'accepted');
  assert.equal(db.writes.length, 1);
  const [submissionId, blockId, storedUserId, answers] = db.writes[0] ?? [];
  assert.equal(blockId, formId);
  assert.equal(storedUserId, userId);
  assert.equal(submissionId, result.body.status === 'accepted' ? result.body.submissionId : undefined);
  assert.deepEqual(JSON.parse(String(answers)), { fullName: 'Иван', phone: '+375', consent: true });
});

test('invalid answers and a non-form block do not create a submission', async () => {
  const db = fakeDb({ userId, block: { id: 'hero', type: 'hero', props: { title: 'Карта', subtitle: 'Текст' } }, writes: [] });
  const service = new ApplicationsService(db);
  const notForm = await service.submit({ sessionId, body: { blockId: 'hero', answers: { fullName: 'Иван' } } });
  assert.equal(notForm.httpStatus, 422);
  assert.deepEqual(db.writes, []);

  const forms = fakeDb({ userId, block: form, writes: [] });
  const invalid = await new ApplicationsService(forms).submit({
    sessionId,
    body: { blockId: formId, answers: { fullName: 'Иван', phone: '+375', consent: false } },
  });
  assert.equal(invalid.httpStatus, 422);
  if (invalid.httpStatus === 422 && invalid.body.status === 'invalid') {
    assert.deepEqual(
      invalid.body.fieldErrors.map((error) => error.name),
      ['consent'],
    );
  }
  assert.deepEqual(forms.writes, []);
});

test('the session cookie is the session id, not a user id invented by the client', () => {
  assert.equal(readSessionId(undefined), undefined);
  assert.equal(readSessionId('session=not-a-uuid'), undefined);
  assert.equal(readSessionId(`theme=light; session=${sessionId}`), sessionId);
});

function fakeDb(options: { userId?: string; block?: { id: string; type: string; props: unknown }; writes: unknown[][] }): Sql & {
  writes: unknown[][];
  queries: string[];
} {
  const queries: string[] = [];
  return {
    writes: options.writes,
    queries,
    async query(text: string, values?: unknown[]) {
      queries.push(text);
      if (text === selectSession) {
        return { rows: options.userId ? [{ user_id: options.userId }] : [] };
      }
      if (text === selectBlock) {
        return { rows: options.block && options.block.id === values?.[0] ? [options.block] : [] };
      }
      if (text === insertSubmission) {
        options.writes.push([...(values ?? [])]);
        return { rows: [{ id: String(values?.[0]) }] };
      }
      throw new Error(`unexpected query: ${text}`);
    },
  };
}
