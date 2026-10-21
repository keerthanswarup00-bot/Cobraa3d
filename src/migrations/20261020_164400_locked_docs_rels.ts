import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "enquiry_files_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "request_rate_limits_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_enquiry_files_fk"
      FOREIGN KEY ("enquiry_files_id") REFERENCES "public"."enquiry_files"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_request_rate_limits_fk"
      FOREIGN KEY ("request_rate_limits_id") REFERENCES "public"."request_rate_limits"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "payload_locked_documents_rels_enquiry_files_id_idx" ON "payload_locked_documents_rels" USING btree ("enquiry_files_id");
    CREATE INDEX "payload_locked_documents_rels_request_rate_limits_id_idx" ON "payload_locked_documents_rels" USING btree ("request_rate_limits_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_enquiry_files_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_request_rate_limits_fk";
    DROP INDEX "payload_locked_documents_rels_enquiry_files_id_idx";
    DROP INDEX "payload_locked_documents_rels_request_rate_limits_id_idx";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "enquiry_files_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "request_rate_limits_id";
  `)
}
