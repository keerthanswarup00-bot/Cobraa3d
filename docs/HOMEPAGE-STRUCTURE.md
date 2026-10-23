# Homepage rework structure

## Goals

- Make the first screen clear and calm on a phone.
- Put real products and category browsing ahead of long interactive forms.
- Keep every product, category, image, price, and business fact connected to Payload records or Site Settings.
- Keep enquiry actions on WhatsApp. No cart or checkout.
- Keep the future NFC keychain idea visually separate from available products.
- Show customer reviews only after approved review content exists.

## Page order

1. **Header** — Cobraa 3D brand, Products, Custom orders, and a concise WhatsApp action. Keep the current accessible mobile menu.
2. **Hero** — short location eyebrow, one clear headline, one short description, a primary Browse products action, and an optional WhatsApp action. Use a real product photo as the visual when one exists. Remove the large interactive nameplate customiser and moving contour field from this first screen.
3. **Featured products** — exactly three products, preferring the products selected in Site Settings; fall back to products marked Featured, then the product sort order. Link each card to its detail page and use the shared product WhatsApp message.
4. **Lamps & lighting** — find the visible category whose name or slug refers to lamps or lighting. Show up to three published products and link “View more” to `/products?category=<category-slug>`.
5. **Custom idea / future NFC keychain** — one compact, separate card with an NFC icon and the NFC keychain concept. Treat it as a future interaction; do not present it as a currently orderable product or invent options.
6. **Another product category** — show up to three products from the first other visible category with products. Include its category-filtered “View more” link.
7. **Useful information** — a small set of factual points such as studio location and the WhatsApp enquiry process. Do not promise delivery timing or product availability from homepage fallback copy.
8. **Customer reviews** — reserved section, rendered only when genuine approved review records are provided. Do not create sample or generated testimonials, names, ratings, or counts.
9. **About the studio** — a short excerpt from Site Settings brand story, with a link to the existing studio/location page.
10. **Footer** — compact links, configured contact/social links, and location.

## Data and fallbacks

- Category sections are derived from visible Payload categories and published non-demo products. Empty categories are not shown.
- The lighting section is omitted if no visible lighting category currently has published products; it must not be filled with unrelated items.
- The second category is selected from the remaining visible categories in Payload order.
- If fewer than three products are available in a section, show only the available products.
- The NFC keychain remains a clearly marked concept until its product record and custom interaction are ready.
- The reviews section remains unpublished until the business provides approved review content and a suitable source.

## Current implementation status

- Implemented: simplified hero, three-product featured row, Payload-driven lighting and secondary category rows, category-filtered view-more links, NFC keychain concept card, factual information strip, short About section, and compact footer.
- The review section is defined in this structure but is not rendered yet. The app has no review data source; add the approved customer reviews before publishing that section.
- Future feature: NFC keychain custom interaction.
