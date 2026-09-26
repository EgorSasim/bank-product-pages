import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword } from '../password.js';
import { insertSession, insertUser, selectUserByEmail, type Sql } from '../sql.js';
import { SessionsService } from './sessions.service.js';

const email = 'visitor@example.com';
const password = 'long-enough';

test('a short password is rejected before any account is created', async () => {
  const db = memory();
  const result = await new SessionsService(db).signIn({ email, password: 'short' });
  assert.equal(result.httpStatus, 422);
  assert.deepEqual(db.inserts, []);
});

test('a new email creates an account and stores only the password hash', async () => {
  const db = memory();
  const result = await new SessionsService(db).signIn({ email: ' Visitor@Example.COM ', password });
  assert.equal(result.httpStatus, 201);
  assert.equal(db.users.length, 1);
  assert.equal(db.users[0]?.email, email);
  assert.notEqual(db.users[0]?.password_hash, password);
  assert.match(db.users[0]?.password_hash ?? '', /^scrypt:/);
  assert.equal(db.sessions.length, 1);
  assert.equal(db.sessions[0]?.userId, db.users[0]?.id);
});

test('a known email with the wrong password does not open a session', async () => {
  const db = memory();
  db.users.push({ id: 'user-1', email, password_hash: await hashPassword(password) });
  const result = await new SessionsService(db).signIn({ email, password: 'other-password' });
  assert.equal(result.httpStatus, 401);
  assert.deepEqual(db.sessions, []);
});

test('a known email with the right password opens a session and does not rewrite the hash', async () => {
  const db = memory();
  const passwordHash = await hashPassword(password);
  db.users.push({ id: 'user-1', email, password_hash: passwordHash });
  const result = await new SessionsService(db).signIn({ email, password });
  assert.equal(result.httpStatus, 201);
  assert.equal(db.users[0]?.password_hash, passwordHash);
  assert.equal(db.sessions[0]?.userId, 'user-1');
});

function memory(): Sql & {
  users: { id: string; email: string; password_hash: string }[];
  sessions: { id: string; userId: string }[];
  inserts: string[];
} {
  const users: { id: string; email: string; password_hash: string }[] = [];
  const sessions: { id: string; userId: string }[] = [];
  const inserts: string[] = [];
  return {
    users,
    sessions,
    inserts,
    async query(text, values) {
      if (text === 'begin' || text === 'commit' || text === 'rollback') return { rows: [] };
      if (text === selectUserByEmail) {
        const user = users.find((item) => item.email === values?.[0]);
        return { rows: user ? [{ id: user.id, password_hash: user.password_hash }] : [] };
      }
      if (text === insertUser) {
        inserts.push(text);
        users.push({ id: String(values?.[0]), email: String(values?.[1]), password_hash: String(values?.[2]) });
        return { rows: [] };
      }
      if (text === insertSession) {
        inserts.push(text);
        sessions.push({ id: String(values?.[0]), userId: String(values?.[1]) });
        return { rows: [] };
      }
      throw new Error(`unexpected query: ${text}`);
    },
  };
}
