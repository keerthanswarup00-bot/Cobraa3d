import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "enquiry_files" (
      "id" serial PRIMARY KEY NOT NULL,
      "alt" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );

    ALTER TABLE "enquiries_rels" ADD COLUMN "enquiry_files_id" integer;
    ALTER TABLE "enquiries_rels" ADD CONSTRAINT "enquiries_rels_enquiry_files_fk"
      FOREIGN KEY ("enquiry_files_id") REFERENCES "public"."enquiry_files"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "enquiries_rels_enquiry_files_id_idx" ON "enquiries_rels" USING btree ("enquiry_files_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "enquiries_rels" DROP CONSTRAINT "enquiries_rels_enquiry_files_fk";
    DROP INDEX "enquiries_rels_enquiry_files_id_idx";
    ALTER TABLE "enquiries_rels" DROP COLUMN "enquiry_files_id";
    DROP TABLE "enquiry_files";
  `)
}
