import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Client } from 'pg';

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../migrations');

export async function migrate(client: Client): Promise<string[]> {
  await client.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort();
  const applied: string[] = [];

  for (const file of files) {
    const existing = await client.query('select 1 from schema_migrations where version = $1', [file]);
    if (existing.rowCount) continue;

    const sql = await readFile(join(migrationsDir, file), 'utf8');
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into schema_migrations (version) values ($1)', [file]);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
    applied.push(file);
  }

  return applied;
}
