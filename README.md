# Cobraa 3D

Mobile-first product discovery for Cobraa 3D. Visitors browse products and ask questions on WhatsApp. There is no cart or checkout.

## Local development

Requirements: Node.js 20.18.1 or newer and pnpm 9 or newer.

```sh
cp .env.example .env
pnpm install
```

Set a long random `PAYLOAD_SECRET` in `.env`, then start the app:

```sh
pnpm dev
```

Open [http://localhost:3000/admin](http://localhost:3000/admin), create the first admin account, and add the studio WhatsApp number under Site Settings. The local database is SQLite at `cobraa3d.db`. Create products under `/admin`; publish a product to show it under `/products`.

To load clearly marked sample content into the local database, run:

```sh
pnpm seed
```

This creates six draft sample products, six hidden sample categories, neutral placeholder media, an inactive offer, and an inactive announcement. All sample records are labelled and must be replaced or deleted before launch.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm test` runs Vitest unit/integration checks and the Playwright browser suite. The browser suite uses the installed Brave Chromium binary configured in `playwright.config.ts` and captures layouts at 360, 768, and 1280 pixels.

## Deployment

1. Create a Vercel project and connect this repository.
2. Provision a Postgres database with Neon or Supabase. Set `DATABASE_URL` to its Postgres connection string; production automatically selects Payload's Postgres adapter, while local development stays on SQLite.
3. Create an S3-compatible bucket (Cloudflare R2, AWS S3, or another compatible provider). Set `S3_BUCKET`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`. Without these settings, Payload stores uploads in `public/media` locally.
4. Set `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `CRON_SECRET`, and `NEXT_PUBLIC_SERVER_URL` in Vercel. Use the production domain for `NEXT_PUBLIC_SERVER_URL` and do not include a trailing slash.
5. Deploy. Create the first admin account at `/admin` and complete Site Settings before publishing products.

## Foundation notes

Payload's official Website Template supplied the App Router admin shell, draft versions, live-preview endpoint, and SQLite setup. The blog, posts, and page builder have been removed. Payload's official SEO, search, redirects, import/export, and S3 storage plugins are configured. The import/export plugin is enabled for enquiries so the owner can export enquiry records to CSV.

Products, categories, offers, announcements, enquiries, Print Bed posts, media, and user roles are managed in Payload. Site-wide business details, contact links, copy, experience toggles, vCard fields, and nameplate options are managed in the Site Settings global. Public category access is restricted to visible categories that have at least one published product.

The local seed is sample content only. Before launch, the owner must supply the real WhatsApp number, studio contact details and links, address/map URL, approved product/category copy and imagery, vCard fields, and any verified prices or product specifications. Never publish unverified prices, claims, ratings, availability, or stock. No production Vercel/Neon/storage project credentials are included in the repository; configure those in the deployment environment.
