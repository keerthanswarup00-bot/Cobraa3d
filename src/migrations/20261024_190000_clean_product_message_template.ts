import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// The product enquiry message was saved into Site Settings with the original default wording the first time the
// settings were stored, so changing the default in code alone does not change what customers send.
// This moves a template that still holds that untouched old default to the cleaner one. A template an editor has
// rewritten is left exactly as it is, and running this twice changes nothing.
//   old: Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}
//   new: Hi, I'm interested in {{title}}.\nPrice: {{price}}{{details}}\n\n{{url}}
// The new text must stay identical to DEFAULT_PRODUCT_MESSAGE_TEMPLATE in src/lib/shared.ts.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ALTER COLUMN "message_templates_product"
      SET DEFAULT 'Hi, I''m interested in {{title}}.\nPrice: {{price}}{{details}}\n\n{{url}}';
    UPDATE "site_settings"
      SET "message_templates_product" = 'Hi, I''m interested in {{title}}.\nPrice: {{price}}{{details}}\n\n{{url}}'
      WHERE btrim("message_templates_product") = 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ALTER COLUMN "message_templates_product"
      SET DEFAULT 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}';
    UPDATE "site_settings"
      SET "message_templates_product" = 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}'
      WHERE "message_templates_product" = 'Hi, I''m interested in {{title}}.\nPrice: {{price}}{{details}}\n\n{{url}}';
  `)
}
