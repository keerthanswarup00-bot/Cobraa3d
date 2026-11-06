# Cobraa 3D AI Product Upload

## Endpoint
`POST /api/ai-product-upload` (multipart/form-data)

Set the Vercel server-side environment variable `PRODUCT_UPLOAD_SECRET` to a long random secret (32+ bytes). Never expose it as a `NEXT_PUBLIC_*` variable or commit it to Git.

## Form fields
- `title` (required): AI-generated product title
- `shortDescription` (required, max 240 characters): factual product-card description
- `categorySlug` (required): slug of an existing, visible Payload category
- `imageAlt` (optional): alt text; defaults to title
- `images` (required, repeated): 1–8 JPEG, PNG, WebP, or AVIF files, max 10 MB each. Order matters; first image is primary.

## Behavior
- Uses the first image as the primary image and keeps subsequent images in the gallery.
- Uses `priceMode: ask` and leaves price blank.
- Rejects missing required content, invalid image types, unknown categories, and duplicate slugs.
- Creates a published product only after input validation and verifies the saved record.
- Requires `Authorization: Bearer <PRODUCT_UPLOAD_SECRET>`.
- This endpoint does not call an AI model itself. The ChatGPT workflow/action must generate title, description, category slug, and send the images as multipart fields.

## Important setup
Add `PRODUCT_UPLOAD_SECRET` in Vercel Project Settings → Environment Variables for the production project, then redeploy. Until that is configured, the endpoint fails closed with 401. Test using a non-production deployment first.
