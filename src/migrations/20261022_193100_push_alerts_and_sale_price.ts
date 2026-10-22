import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "products" ADD COLUMN "sale_price" numeric;

    ALTER TABLE "site_settings" ADD COLUMN "connect_copy_hero_lede" varchar DEFAULT 'Type a name in any language, pick your colours and watch it take shape. Send us the brief on WhatsApp and we''ll confirm price and timing.';
    ALTER TABLE "site_settings" ADD COLUMN "connect_copy_hero_hint" varchar DEFAULT 'Drag the piece sideways to turn it.';
    ALTER TABLE "site_settings" ADD COLUMN "connect_copy_products_eyebrow" varchar DEFAULT 'Made to order';
    ALTER TABLE "site_settings" ADD COLUMN "connect_copy_products_subline" varchar DEFAULT 'Every piece is printed to order. Ask on WhatsApp and we’ll confirm colour and timing.';
    ALTER TABLE "site_settings" ADD COLUMN "connect_copy_name_promise" varchar DEFAULT 'Any name, any language. We check it prints well and confirm on WhatsApp.';
    ALTER TABLE "site_settings" ADD COLUMN "connect_copy_delivery_note" varchar;
    ALTER TABLE "legal_pages" ADD COLUMN "push_alerts_privacy_line" varchar DEFAULT 'If you turn on offer alerts, we store your browser''s push address so we can send you offers. We don''t store your name or number. Turn alerts off any time from the site or your browser settings.';

    CREATE TYPE "public"."enum_push_notifications_status" AS ENUM('draft', 'sending', 'sent');

    CREATE TABLE "push_subscriptions" (
      "id" serial PRIMARY KEY NOT NULL,
      "endpoint" varchar NOT NULL,
      "p256dh" varchar NOT NULL,
      "auth" varchar NOT NULL,
      "user_agent" varchar,
      "source" varchar,
      "is_test" boolean DEFAULT false,
      "active" boolean DEFAULT true,
      "last_error" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");

    CREATE TABLE "push_notifications" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "body" varchar NOT NULL,
      "url" varchar DEFAULT '/' NOT NULL,
      "status" "enum_push_notifications_status" DEFAULT 'draft',
      "sent_at" timestamp(3) with time zone,
      "sent_count" numeric DEFAULT 0,
      "failed_count" numeric DEFAULT 0,
      "test_sent_at" timestamp(3) with time zone,
      "last_cursor" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "push_subscriptions_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "push_notifications_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_push_subscriptions_fk"
      FOREIGN KEY ("push_subscriptions_id") REFERENCES "public"."push_subscriptions"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_push_notifications_fk"
      FOREIGN KEY ("push_notifications_id") REFERENCES "public"."push_notifications"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_push_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("push_subscriptions_id");
    CREATE INDEX "payload_locked_documents_rels_push_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("push_notifications_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_push_subscriptions_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_push_notifications_fk";
    DROP INDEX "payload_locked_documents_rels_push_subscriptions_id_idx";
    DROP INDEX "payload_locked_documents_rels_push_notifications_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "push_subscriptions_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "push_notifications_id";
    DROP INDEX "push_subscriptions_endpoint_idx";
    DROP TABLE "push_notifications";
    DROP TABLE "push_subscriptions";
    DROP TYPE "public"."enum_push_notifications_status";

    ALTER TABLE "legal_pages" DROP COLUMN "push_alerts_privacy_line";
    ALTER TABLE "site_settings" DROP COLUMN "connect_copy_hero_lede";
    ALTER TABLE "site_settings" DROP COLUMN "connect_copy_hero_hint";
    ALTER TABLE "site_settings" DROP COLUMN "connect_copy_products_eyebrow";
    ALTER TABLE "site_settings" DROP COLUMN "connect_copy_products_subline";
    ALTER TABLE "site_settings" DROP COLUMN "connect_copy_name_promise";
    ALTER TABLE "site_settings" DROP COLUMN "connect_copy_delivery_note";
    ALTER TABLE "products" DROP COLUMN "sale_price";
  `)
}
