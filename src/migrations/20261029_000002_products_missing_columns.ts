import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * The product model gained these columns in the collection config, but they were
 * only ever created by the development schema push, so production was missing
 * them and every deploy failed while prerendering the homepage.
 * Every statement is additive and guarded so it is safe to re-run.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_products_badge" AS ENUM('ready_stock', 'made_to_order', 'new');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "short_benefit" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "short_includes" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "badge" "enum_products_badge";
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dispatch_time" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "height_mm" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "width_mm" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "depth_mm" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weight_grams" numeric;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "colour" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "power_and_bulb" varchar;
    ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "age_suitability" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" DROP COLUMN IF EXISTS "age_suitability";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "power_and_bulb";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "colour";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "weight_grams";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "depth_mm";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "width_mm";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "height_mm";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "dispatch_time";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "badge";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "short_includes";
    ALTER TABLE "products" DROP COLUMN IF EXISTS "short_benefit";
    DROP TYPE IF EXISTS "enum_products_badge";
  `)
}
