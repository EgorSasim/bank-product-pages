# Bank product pages

Marketing site for a single bank. The home page and every product page are an ordered list of shared blocks. The server decides the order and the props. The browser renders a closed catalog of components.

Public pages are server-rendered so search engines can index them. A few slots can vary by visitor segment. Product terms stay the same for people and for crawlers. A product page can include a schema-driven application form.

Stack: Angular SSR, NestJS, PostgreSQL, one TypeScript contract package.

The home page mixes product kinds in one list: cards, loans, deposits, leasing, installments. Reading the site does not require an account. Applying for a product opens an auth modal, and the application is stored only after a session exists.

The design record, including rejected options and their consequences, is in [docs/DESIGN.md](docs/DESIGN.md).

```text
apps/web              Angular SSR, added in a later step
apps/api              NestJS page and application API
packages/contract     block, product, and application types
db                    SQL migrations and the catalog seed
```

Local Postgres:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm api:start
```

The API listens on port 3001. `GET /api/pages/:slug` reads `X-Segment` (`default`, `salary`, or `premium`). `POST /api/applications` stores an application only when the `session` cookie matches a row in `sessions`.

The password in `compose.yaml` is only for this local database.
