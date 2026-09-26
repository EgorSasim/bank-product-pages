# Bank product pages

Marketing site for a single bank. The home page and every product page are an ordered list of shared blocks. The server decides the order and the props. The browser renders a closed catalog of components.

Public pages are server-rendered so search engines can index them. SEO is a product requirement: a crawler must see the title and the product text in the first HTML response, the same terms a visitor gets on the default segment. A few slots can vary by visitor segment. Product terms stay the same for people and for crawlers. A product page can include a schema-driven application form.

Stack: Angular SSR, NestJS, PostgreSQL, one TypeScript contract package.

The home page mixes product kinds in one list: cards, loans, deposits, leasing, installments. Each product page uses those shared blocks in its own order, including a banner carousel whose slides are local images labeled «Баннер1» through «Баннер6». Reading the site does not require an account. Applying for a product opens an auth modal, and the application is stored only after a session exists.

The design record, including rejected options and their consequences, is in [docs/DESIGN.md](docs/DESIGN.md).

```text
apps/web              Angular SSR for / and /products/:slug
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
pnpm web:start
```

The API listens on port 3001. The site listens on port 4200 and renders `/` and `/products/:slug` on the server, so the first HTML response contains the page title and the product text. `GET /api/pages/:slug` reads `X-Segment` (`default`, `salary`, or `premium`). `POST /api/applications` stores an application only when the `session` cookie matches a row in `sessions`. Without that cookie, the apply button opens the auth modal and does not send the form. The modal calls `POST /api/session`: a new email creates an account, and a known email must match the stored password. After that the same application is sent.

The password in `compose.yaml` is only for this local database.
