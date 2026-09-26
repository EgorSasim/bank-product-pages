import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { readSignIn, type SignInResult } from '@bank/contract';
import { DATABASE } from '../database.js';
import { hashPassword, verifyPassword } from '../password.js';
import { insertSession, insertUser, rowsOf, selectSession, selectUserByEmail, type Sql } from '../sql.js';

export type SignInResponse =
  | { httpStatus: 201; sessionId: string; body: SignInResult }
  | { httpStatus: 401 | 422; body: SignInResult };

type UserRow = { id: string; password_hash: string };

@Injectable()
export class SessionsService {
  constructor(@Inject(DATABASE) private readonly db: Sql) {}

  async current(sessionId: string | undefined): Promise<boolean> {
    if (!sessionId) return false;
    const found = await this.db.query(selectSession, [sessionId]);
    return rowsOf<{ user_id: string }>(found).length > 0;
  }

  async signIn(body: unknown): Promise<SignInResponse> {
    const parsed = readSignIn(body);
    if (!parsed.ok) return { httpStatus: 422, body: { status: 'invalid', fieldErrors: parsed.fieldErrors } };

    const existing = await this.findUser(parsed.value.email);
    if (existing) return this.openSession(existing, parsed.value.password);

    const userId = randomUUID();
    const sessionId = randomUUID();
    const passwordHash = await hashPassword(parsed.value.password);
    try {
      await this.db.query('begin');
      await this.db.query(insertUser, [userId, parsed.value.email, passwordHash]);
      await this.db.query(insertSession, [sessionId, userId]);
      await this.db.query('commit');
    } catch (error) {
      await this.db.query('rollback');
      if (!isUniqueEmail(error)) throw error;
      const raced = await this.findUser(parsed.value.email);
      if (!raced) throw error;
      return this.openSession(raced, parsed.value.password);
    }

    return { httpStatus: 201, sessionId, body: { status: 'authenticated' } };
  }

  private async openSession(user: UserRow, password: string): Promise<SignInResponse> {
    const matches = await verifyPassword(password, user.password_hash);
    if (!matches) {
      return {
        httpStatus: 401,
        body: { status: 'invalid', fieldErrors: [{ name: 'password', message: 'wrong password' }] },
      };
    }
    const sessionId = randomUUID();
    await this.db.query(insertSession, [sessionId, user.id]);
    return { httpStatus: 201, sessionId, body: { status: 'authenticated' } };
  }

  private async findUser(email: string): Promise<UserRow | undefined> {
    const found = await this.db.query(selectUserByEmail, [email]);
    return rowsOf<UserRow>(found)[0];
  }
}

function isUniqueEmail(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
}
