# Homepage audit

Reviewed against the current homepage, shared navigation, product detail message builder, Payload Site Settings, and the supplied mobile screenshots.

## Findings

### Content and accuracy

- The hero promises “any language” and says visitors can watch a name take shape. Confirm that the preview and production process support the full language range before keeping this claim.
- The home page repeats a 1–2 day timing claim in the trust strip and the “We print it” step. Keep it only if the studio can consistently meet it; otherwise put an accurate timing note in Site Settings or remove it.
- “Every piece is printed to order” and “Made to order” are presented as universal statements. Check that every published product follows this policy.
- Several home sections have fallback copy in code in addition to Payload copy. This can make the visible home content differ from the admin-managed version when fields are blank. Prefer one source of truth and review the actual published Site Settings values.
- The footer describes the business as a “small print studio” and says it makes personalised pieces. Confirm this is the intended brand description.
- In the supplied mobile screenshot, the headline and lede take substantial vertical space before visitors reach the customiser. The headline also splits into two lines with the second line visually muted; retain that hierarchy only if it remains easy to read on the smallest supported screens.

### Product enquiry flow

- Homepage product cards previously generated a short hard-coded WhatsApp message containing only the product title. Product detail pages use the product override or global product template and can include price, page URL, image, and product-specific prompts. This made the two enquiry paths inconsistent.
- Homepage cards now use the same shared message builder as product detail pages, including each product's override and the configured Site Settings template.
- The home page offers three featured products. Ensure the first three published products are the intended items; currently the code prioritises `featured` and then sorts by `sortOrder` and title, rather than reading the `hero.featuredProducts` relationship.
- When there are no real products, temporary preview products can appear. They have no product WhatsApp links or real product details, which is appropriate for previews, but make sure this fallback is not mistaken for the live catalogue.

### Navigation and mobile menu

- The supplied menu screenshot shows only “Products” and “Custom”. “Custom” is ambiguous; it is now “Custom orders”, and the menu includes an explicit Home destination.
- The menu uses a full-screen overlay with large vertical space before its links. That creates a deliberate editorial feel but delays the choices on shorter phones. Check it at small viewport heights and with browser safe areas visible.
- The top-level header has a WhatsApp action and a menu button on mobile. Keep their touch targets, spacing, and labels usable on narrow widths.
- The navigation is portal-rendered and traps keyboard focus. Verify close, Escape, browser back, and focus return behavior after any further menu changes.

### Layout and interaction

- The home page combines a customiser, featured cards, trust strip, process steps, optional print video, custom-order builder, and footer. On mobile this is a long page; keep the primary enquiry action and featured products easy to reach.
- The hero customiser uses horizontally scrollable object and colour controls. Ensure the selected value is apparent and the controls remain discoverable without relying on swipe alone.
- Animated terrain, card pointer effects, and layered product illustrations add visual character, but should not compete with product names, prices, or enquiry links. Respect reduced-motion preferences.
- The optional video section only appears when a visible Print Bed record has a video. Review the uploaded clip's crop and ensure it does not add a large blank or low-value section on mobile.

## Fixes made in this pass

- Reused the product detail WhatsApp message builder for homepage product cards, including configured template, per-product override, product price, URL, image, and product-specific context.
- Changed the menu label to “Custom orders” and added a Home link.

## Content review still needed in Payload

Confirm the hero language claim, delivery timing, made-to-order statement, footer description, and the ordering of the three featured products in the live Site Settings and product records. The site code cannot validate these business facts.
