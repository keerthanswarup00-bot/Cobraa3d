import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Brings the database in line with schema fields that were added to the code in
 * commit 89272b2 without a migration:
 *   - site_settings: shippingFlatFee, freeShippingThreshold
 *   - products (and the _products_v versions table): shortBenefit, shortIncludes,
 *     badge, dispatchTime, heightMm, widthMm, depthMm, weightGrams, colour,
 *     powerAndBulb, ageSuitability, plus the faq and occasions array tables.
 *
 * Purely additive and idempotent (IF NOT EXISTS / duplicate-safe blocks): it never
 * drops or rewrites existing data, and is safe to re-run or to apply on a database
 * where part of this was already created.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_products_badge" AS ENUM('ready_stock', 'made_to_order', 'new');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum__products_v_version_badge" AS ENUM('ready_stock', 'made_to_order', 'new');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "shipping_flat_fee" numeric DEFAULT 0;
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "free_shipping_threshold" numeric DEFAULT 0;

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

    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_short_benefit" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_short_includes" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_badge" "enum__products_v_version_badge";
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_dispatch_time" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_height_mm" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_width_mm" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_depth_mm" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_weight_grams" numeric;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_colour" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_power_and_bulb" varchar;
    ALTER TABLE "_products_v" ADD COLUMN IF NOT EXISTS "version_age_suitability" varchar;

    CREATE TABLE IF NOT EXISTS "products_faq" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar
    );

    CREATE TABLE IF NOT EXISTS "products_occasions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "occasion" varchar
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_faq" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar,
      "_uuid" varchar
    );

    CREATE TABLE IF NOT EXISTS "_products_v_version_occasions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "occasion" varchar,
      "_uuid" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "products_faq" ADD CONSTRAINT "products_faq_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "products_occasions" ADD CONSTRAINT "products_occasions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_version_faq" ADD CONSTRAINT "_products_v_version_faq_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      ALTER TABLE "_products_v_version_occasions" ADD CONSTRAINT "_products_v_version_occasions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."_products_v"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    CREATE INDEX IF NOT EXISTS "products_faq_order_idx" ON "products_faq" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_faq_parent_id_idx" ON "products_faq" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "products_occasions_order_idx" ON "products_occasions" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "products_occasions_parent_id_idx" ON "products_occasions" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_faq_order_idx" ON "_products_v_version_faq" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_products_v_version_faq_parent_id_idx" ON "_products_v_version_faq" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "_products_v_version_occasions_order_idx" ON "_products_v_version_occasions" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "_products_v_version_occasions_parent_id_idx" ON "_products_v_version_occasions" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "_products_v_version_occasions" CASCADE;
    DROP TABLE IF EXISTS "_products_v_version_faq" CASCADE;
    DROP TABLE IF EXISTS "products_occasions" CASCADE;
    DROP TABLE IF EXISTS "products_faq" CASCADE;

    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_age_suitability";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_power_and_bulb";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_colour";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_weight_grams";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_depth_mm";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_width_mm";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_height_mm";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_dispatch_time";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_badge";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_short_includes";
    ALTER TABLE "_products_v" DROP COLUMN IF EXISTS "version_short_benefit";

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

    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "free_shipping_threshold";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "shipping_flat_fee";

    DROP TYPE IF EXISTS "public"."enum__products_v_version_badge";
    DROP TYPE IF EXISTS "public"."enum_products_badge";
  `)
}
