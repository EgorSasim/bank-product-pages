import { Client } from 'pg';
import { migrate } from './migrate.js';
import { seed } from './seed.js';

const databaseUrl = process.env.DATABASE_URL ?? 'postgres://bank:bank@localhost:54329/bank';
const command = process.argv[2];

if (command !== 'migrate' && command !== 'seed') {
  console.error('usage: cli.ts migrate|seed');
  process.exit(1);
}

const client = await connect(databaseUrl);

try {
  const applied = await migrate(client);
  for (const version of applied) {
    console.log(`applied ${version}`);
  }
  if (command === 'seed') {
    await seed(client);
    const home = await client.query<{ category: string }>(
      'select category from products where published order by home_position',
    );
    console.log(home.rows.map((row) => row.category).join(', '));
  }
} finally {
  await client.end();
}

async function connect(connectionString: string): Promise<Client> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const client = new Client({ connectionString });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw lastError;
}
