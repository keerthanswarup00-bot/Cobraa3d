import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN "products_page_eyebrow" varchar DEFAULT 'Objects, made differently';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_heading" varchar DEFAULT 'Thoughtful design.';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_heading_accent" varchar DEFAULT 'Made in 3D.';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_search_placeholder" varchar DEFAULT 'Search products…';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_filters_label" varchar DEFAULT 'Filters';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_max_price_label" varchar DEFAULT 'Max price';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_good_for_label" varchar DEFAULT 'Good for';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_reset_label" varchar DEFAULT 'Reset all';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_empty_title" varchar DEFAULT 'Nothing matches that.';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_empty_body" varchar DEFAULT 'Try a different word or';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_empty_action" varchar DEFAULT 'reset the filters';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_note_label" varchar DEFAULT 'Customisation or notes (optional)';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_note_placeholder" varchar DEFAULT 'Colour, name to print, size…';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_order_label" varchar DEFAULT 'Order on WhatsApp';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_order_footer" varchar DEFAULT 'Please confirm availability and delivery time.';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_fine_print" varchar DEFAULT 'You''ll confirm size, colour and delivery with us on WhatsApp. No payment is taken here.';
    ALTER TABLE "site_settings" ADD COLUMN "products_page_per_page" numeric DEFAULT 15;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" DROP COLUMN "products_page_eyebrow";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_heading";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_heading_accent";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_search_placeholder";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_filters_label";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_max_price_label";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_good_for_label";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_reset_label";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_empty_title";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_empty_body";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_empty_action";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_note_label";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_note_placeholder";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_order_label";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_order_footer";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_fine_print";
    ALTER TABLE "site_settings" DROP COLUMN "products_page_per_page";
  `)
}
