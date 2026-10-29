import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "shipping_flat_fee" numeric DEFAULT 0;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "free_shipping_threshold" numeric DEFAULT 0;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "shipping_flat_fee";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "free_shipping_threshold";
  `)
}
