import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products_faq" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" text
    );
    CREATE INDEX IF NOT EXISTS "products_faq_order_idx" ON "products_faq" ("_order");
    CREATE INDEX IF NOT EXISTS "products_faq_parent_id_idx" ON "products_faq" ("_parent_id");
    DO $$ BEGIN
      ALTER TABLE "products_faq" ADD CONSTRAINT "products_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "products_occasions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "occasion" varchar
    );
    CREATE INDEX IF NOT EXISTS "products_occasions_order_idx" ON "products_occasions" ("_order");
    CREATE INDEX IF NOT EXISTS "products_occasions_parent_id_idx" ON "products_occasions" ("_parent_id");
    DO $$ BEGIN
      ALTER TABLE "products_occasions" ADD CONSTRAINT "products_occasions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "products_faq" CASCADE;
    DROP TABLE IF EXISTS "products_occasions" CASCADE;
  `)
}
