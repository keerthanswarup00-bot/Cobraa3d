import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
    ALTER TABLE "enquiry_files" ADD COLUMN "_objectkey" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN "_objectkey";
    ALTER TABLE "enquiry_files" DROP COLUMN "_objectkey";
  `)
}
