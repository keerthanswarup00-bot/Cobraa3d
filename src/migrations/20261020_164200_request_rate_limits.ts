import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "request_rate_limits" (
      "id" serial PRIMARY KEY NOT NULL,
      "key" varchar NOT NULL,
      "window_start" numeric NOT NULL,
      "count" numeric NOT NULL
    );
    CREATE UNIQUE INDEX "request_rate_limits_key_idx" ON "request_rate_limits" USING btree ("key");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE "request_rate_limits" CASCADE;`)
}
