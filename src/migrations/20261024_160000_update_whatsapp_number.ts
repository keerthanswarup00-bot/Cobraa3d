import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

// Replaces the studio's old WhatsApp/phone number (91 63642 24230) with the new one (91 70194 33035).
// Every public link (wa.me, call button, contact card) reads these Site Settings columns, so this is the single
// place the live number changes. Rows are only touched while they still hold the old number, so a value an editor
// has already set in the admin is never overwritten, and running this twice changes nothing.
// Digits are compared after stripping spaces, +, dashes, so "+91 63642 24230" and "6364224230" both match.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ALTER COLUMN "whatsapp_number" SET DEFAULT '917019433035';
    UPDATE "site_settings" SET "whatsapp_number" = '917019433035'
      WHERE regexp_replace("whatsapp_number", '[^0-9]', '', 'g') IN ('6364224230', '916364224230');
    UPDATE "site_settings" SET "phone" = '+91 70194 33035'
      WHERE regexp_replace("phone", '[^0-9]', '', 'g') IN ('6364224230', '916364224230');
    UPDATE "site_settings" SET "vcard_phone" = '+91 70194 33035'
      WHERE regexp_replace("vcard_phone", '[^0-9]', '', 'g') IN ('6364224230', '916364224230');
  `)
}

// Only the WhatsApp number and its default are restored. The display formatting of the phone fields before this
// migration is not known, so those are left as they are.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ALTER COLUMN "whatsapp_number" SET DEFAULT '916364224230';
    UPDATE "site_settings" SET "whatsapp_number" = '916364224230' WHERE "whatsapp_number" = '917019433035';
  `)
}
