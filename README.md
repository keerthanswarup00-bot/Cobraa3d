# Cobraa 3D

Mobile-first product discovery for Cobraa 3D. Customers can purchase published, priced products through Razorpay Standard Checkout, or continue product enquiries and custom orders on WhatsApp.

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

Provision the first administrator from the project environment with `BOOTSTRAP_ADMIN_EMAIL=... BOOTSTRAP_ADMIN_PASSWORD=... pnpm admin:create` (the password must be at least 12 characters). Then open [http://localhost:3000/admin](http://localhost:3000/admin) and add the studio WhatsApp number under Site Settings. Public signup is disabled, and the bootstrap command refuses to run after any user exists. The local database is SQLite at `cobraa3d.db`. Create products under `/admin`; publish a product to show it under `/products`.

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
4. Set `PAYLOAD_SECRET`, `PREVIEW_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID` in Vercel. Use the production domain for `NEXT_PUBLIC_SERVER_URL` and do not include a trailing slash. Start with Razorpay Test Mode keys.
5. Before first deploy, set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` in a secure environment and run `pnpm admin:create` once. Then deploy and complete Site Settings before publishing products. Do not expose or commit the bootstrap password.
6. Run the Payload migration with `pnpm migrate` before using checkout. In Site Settings → Shipping and Checkout, configure the flat shipping fee and optional free-shipping threshold in INR. Both default to 0.
7. In Razorpay Dashboard → Account & Settings → Webhooks, add `https://YOUR_DOMAIN/api/webhooks/razorpay`, set a webhook secret in both Razorpay and `RAZORPAY_WEBHOOK_SECRET`, and enable `payment.captured`, `order.paid`, and `payment.failed`.

## Foundation notes

Payload's official Website Template supplied the App Router admin shell, draft versions, live-preview endpoint, and SQLite setup. The blog, posts, and page builder have been removed. Payload's official SEO, search, redirects, import/export, and S3 storage plugins are configured. The import/export plugin is enabled for enquiries so the owner can export enquiry records to CSV.

Products, categories, offers, announcements, enquiries, Print Bed posts, media, and user roles are managed in Payload. Site-wide business details, contact links, copy, experience toggles, vCard fields, and nameplate options are managed in the Site Settings global. Public category access is restricted to visible categories that have at least one published product.

The local seed is sample content only. Before launch, the owner must supply the real WhatsApp number, studio contact details and links, address/map URL, approved product/category copy and imagery, vCard fields, and any verified prices or product specifications. Never publish unverified prices, claims, ratings, availability, or stock. No production Vercel/Neon/storage/Razorpay project credentials are included in the repository; configure those in the deployment environment.

## Local catalogue demo records

The development-only seed upserts five clearly marked local demo records into the existing Payload `products` collection and matching categories: Personalised Nameplate, Decorative LED Lamp, Custom Phone Stand, Kids Colouring Kit, and Custom 3D Creation. It is intentionally disabled by default and refuses to run in production:

```sh
ALLOW_DEMO_SEED=true pnpm seed
```

Use a local SQLite database (`DATABASE_URL=file:./cobraa3d.db`) for the seed. Records carry `isDemo: true`; they have no price or confirmed availability and use distinct temporary SVG illustrations. The listing/detail UI marks them as temporary, and public production reads exclude them. The seed refuses to overwrite a non-demo product whose slug matches one of these demos. Replace or delete only records with `isDemo` checked before launch. The seed also removes the six exact `SAMPLE Product NN — replace before launch` and `SAMPLE Category NN — replace before launch` records made by the previous local sample script; it does not touch other products or categories.
