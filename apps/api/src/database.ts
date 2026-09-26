import { Pool } from 'pg';
import type { Sql } from './sql.js';

export const DATABASE = Symbol('DATABASE');

export function createPool(connectionString: string): Sql {
  const pool = new Pool({ connectionString });
  return {
    query: (text, values) => pool.query(text, values),
    end: () => pool.end(),
  };
}

export function databaseUrl(): string {
  return process.env.DATABASE_URL ?? 'postgres://bank:bank@localhost:54329/bank';
}
