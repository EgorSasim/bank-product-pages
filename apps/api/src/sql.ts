export type Sql = {
  query(text: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end?(): Promise<void>;
};

export function rowsOf<T>(result: { rows: unknown[] }): T[] {
  return result.rows as T[];
}

export const selectPage = `
  select id, slug, title, description
  from pages
  where slug = $1 and published
`;

export const selectBlocks = `
  select b.id, b.type, coalesce(v.props, b.props) as props
  from blocks b
  left join block_variants v on v.block_id = b.id and v.segment = $2
  where b.page_id = $1
  order by b.position
`;

export const selectCards = `
  select slug, title, summary, category, highlight
  from products
  where published and home_position is not null
  order by home_position
`;

export const selectSession = `
  select user_id from sessions where id = $1
`;

export const selectBlock = `
  select id, type, props from blocks where id = $1
`;

export const insertSubmission = `
  insert into submissions (id, block_id, user_id, answers)
  values ($1, $2, $3, $4::jsonb)
  returning id
`;

export const selectUserByEmail = `
  select id, password_hash from users where email = $1
`;

export const insertUser = `
  insert into users (id, email, password_hash) values ($1, $2, $3)
`;

export const insertSession = `
  insert into sessions (id, user_id) values ($1, $2)
`;
