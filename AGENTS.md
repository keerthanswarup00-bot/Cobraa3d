# Project instructions

- Use Payload CMS 3 in the Next.js App Router application; keep the admin at `/admin`.
- Check the current repository and existing behavior before making changes.
- Business data and business copy come from Payload Site Settings or product records. Do not invent prices, claims, stock, reviews, ratings, or delivery details.
- Keep public enquiry flows on WhatsApp. Do not add checkout or cart behavior.
- Use role-based server-side access controls for admin and editor roles.
- Prefer Payload's built-in drafts, live preview, and revalidation. Use official Payload plugins where they fit.
- Follow the README for setup, verification, and deployment.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
