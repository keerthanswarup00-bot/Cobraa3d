# Cobraa 3D storefront audit

Updated 2026-10-20.

## Temporary product showcase update (2026-10-20)

- Demo seed now defines the requested five products and exact slugs: Personalised Nameplate (`personalised-nameplate`), Decorative LED Lamp (`decorative-led-lamp`), Custom Phone Stand (`custom-phone-stand`), Kids Colouring Kit (`kids-colouring-kit`), and Custom 3D Creation (`custom-3d-creation`).
- All records are `isDemo: true`, carry no price or confirmed availability, and receive a distinct 4:3 temporary SVG illustration. The guarded local seed refuses to overwrite a matching non-demo product and is disabled in production. Production public reads and direct detail routes filter demo records.
- The connect page shows three featured products and a View all products link. `/products` lists all five seeded records; the reusable product detail route shows the image, title, description, demo notice, and WhatsApp action. Cards include View product and Enquire on WhatsApp links.
- Product WhatsApp messages use the shared URL helper, include the product title and canonical product URL, and encode special characters. Missing configuration renders disabled actions and a development warning. Visitors still send messages themselves from WhatsApp.
- The existing local Site Settings database contains a WhatsApp number with a valid configured length. The number itself is not repeated in this report.
- Verification: seed succeeded against a fresh isolated SQLite database; TypeScript and ESLint passed; all 18 Vitest checks passed against that isolated database. Browser tests were attempted but could not complete: the existing app occupied the configured Next development lock, and an isolated server then hit the existing ambiguous `site_settings` migration/index state. The current project database was not seeded or changed by this update.
- Remaining local setup: after resolving the existing database migration prompt, run `ALLOW_DEMO_SEED=true pnpm seed` with the local SQLite database to load the demo records there. This safeguards existing user data and avoids silently choosing the ambiguous `tagline` / `product_message_template` migration.

## Connect page redesign (2026-10-20)

- Replaced the long homepage with five compact areas: hero, selected products, an interactive layer illustration, custom-print callout, and contact/location footer.
- Updated the shared sticky navigation to Products, Custom, Location, and the configured WhatsApp action. The mobile menu is keyboard-operable and compact.
- Featured cards read only published product records. Demo records are labeled in development and never show demo pricing; production hides them. Product enquiries include the product title and canonical detail URL through the shared WhatsApp helpers.
- The interactive showcase is a lightweight SVG illustration that responds to pointer dragging and arrow keys. It does not imply real printer measurements or use a nonexistent GLB. Reduced-motion removes its transition.
- No real product or studio photography, GLB/GLTF model, or configured location/contact details were found in the current media assets/database. The hero displays a clearly labeled photo-needed treatment until a real photo is uploaded. Empty product data produces a compact photo-preparation note rather than a blank catalogue toolbar.
- `/products`, `/products/[slug]`, `/custom`, `/location`, painting kits, Payload admin, existing enquiry form, and nameplate designer remain available.
- `tsc --noEmit` and ESLint pass. The first full Vitest run passed 16 tests but timed out in the API suite while SQLite presented the existing ambiguous `tagline` / `product_message_template` schema prompt. The three independent unit suites pass. Playwright and production build are still being verified for this redesign.

## Existing stack and source of truth

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, pnpm.
- Payload CMS 3.91 is embedded in the app at `/admin`; Products, Categories and SiteSettings remain the source of catalogue and business data.
- SQLite is the local adapter, Postgres is selected through `DATABASE_URL`, and S3-compatible media storage is enabled through server environment variables.
- Existing product listing/detail, WhatsApp helper, custom enquiry flow, nameplate designer, print-bed feed, admin workflows, generated contour assets, Vitest and Playwright are reused.
- No new UI or runtime dependency was added for the redesign.

## Status

### Implemented and verified in code

- Shared responsive site navigation linking Home, Shop, Painting Kits, Custom Orders, and About / Location, with route indication and mobile menu.
- Dedicated `/painting-kits`, `/custom`, `/location`, and `/categories/[slug]` routes, while retaining `/`, `/products`, and `/products/[slug]`.
- Homepage fallback headline and explicit product-photo placeholder labeling.
- Product schema `isDemo` marker, demo labels on listing/detail pages, noindex metadata and no Product JSON-LD for demo details, and production public access filtering for demo records.
- An idempotent local seed for the requested five sample products and categories, with a production guard and cleanup restricted to exact former sample records.
- README instructions for local seeding and sample-record replacement.

### Implemented and verified

- Final lint, typecheck, production build, and all 17 Vitest tests passed.
- All 13 Playwright tests passed, including admin publish-to-storefront, direct routes, filters, nameplate interaction, and forms.
- Responsive screenshots and overflow checks passed at 375, 430, 768, 1024, and 1440 pixels. Home and catalogue screenshots were reviewed.
- The guarded seed ran successfully twice against a fresh isolated SQLite database and upserted the five records without duplicates. The existing project database was left untouched.

### Partial / pending

- Product asset visuals: seed uses an explicitly labeled neutral placeholder; studio/product photography is still needed.
- Painting Kits route shows catalogue records matching the kit category/name and provides a genuine empty state; no adult kit is invented.
- Category URLs require a visible category with published products.
- Real product and studio photography still needs to replace clearly marked demo placeholders.
- Lighthouse mobile scores were not collected; the performance target remains unverified.
- Vercel + Neon + object storage deployment was not performed or verified because deployment credentials/configuration were not supplied.

### Blocked by configuration

- WhatsApp actions need a valid business WhatsApp number in Site Settings.
- Location directions, full address, opening hours, social links, contact details, OG image and real product photos depend on owner-provided SiteSettings data.
- Existing local SQLite DB prompts about an ambiguous schema rename (`tagline` vs `product_message_template`); choose the intended migration after reviewing the local DB history or use a fresh test database. No existing records were modified to bypass this prompt.

## Demo catalogue

- Personalised Nameplate — `personalised-nameplate` — no price configured.
- Decorative LED Lamp — `decorative-led-lamp` — no price configured.
- Custom Phone Stand — `custom-phone-stand` — no price configured.
- Kids Colouring Kit — `kids-colouring-kit` — no price configured.
- Custom 3D Creation — `custom-3d-creation` — no price configured.

All five are explicitly marked as local demo data; prices and availability are not configured business information.
