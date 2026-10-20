# Free-tier deploy (Vercel Hobby + Supabase Free)

## Notes
- Vercel Hobby is free but restricted to personal, non-commercial use, has hard usage caps, short function time limit, and cron jobs run at most once per day. Plan to move to Pro before real commercial traffic.
- Vercel server uploads limited to ~4.5MB; use direct browser uploads where possible.
- Supabase Free: ~500MB DB, ~1GB storage, 50MB max file, may pause after ~1 week of inactivity. Daily keep-alive via cron.
- Use Mumbai region: Vercel bom1, Supabase ap-south-1.
- Transaction pooler (6543) for runtime; session pooler (5432) for migrations. Direct host may be IPv6-only.

## Steps
1. Create Supabase project in ap-south-1. Create a public bucket `media` for catalogue assets and a separate `enquiry-files` bucket with public access blocked for customer attachments. Enable S3 connection and create S3 keys with access to both buckets.
2. Copy transaction pooler string (6543) to DATABASE_URI, session pooler (5432) to DATABASE_URI_MIGRATE.
3. Import repo to Vercel (Hobby). Set all vars from .env.example in Production/Preview, including `S3_PRIVATE_BUCKET`. Keep public access blocked on that bucket; Payload generates signed downloads after checking editor access. Region from vercel.json.
4. First deploy. Open /admin immediately and create first admin user.
5. Post-deploy: upload test image, create/publish test product, open share link in WhatsApp, hit /api/health, check /sitemap.xml and /robots.txt.
6. Free-tier notes as above. Delete/archive old whatsapp-clicks rows to stay under DB limits.
