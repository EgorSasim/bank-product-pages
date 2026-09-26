# Bank product pages

Marketing site for a single bank. The home page and every product page are an ordered list of shared blocks. The server decides the order and the props. The browser renders a closed catalog of components.

Public pages are server-rendered so search engines can index them. A few slots can vary by visitor segment. Product terms stay the same for people and for crawlers. A product page can include a schema-driven application form.

Stack: Angular SSR, NestJS, PostgreSQL, one TypeScript contract package.

The design record, including rejected options and their consequences, is in [docs/DESIGN.md](docs/DESIGN.md).
