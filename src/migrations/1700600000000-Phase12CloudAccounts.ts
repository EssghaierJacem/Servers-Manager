import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase12CloudAccounts1700600000000 implements MigrationInterface {
  name = 'Phase12CloudAccounts1700600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."cloud_accounts_provider_enum" AS ENUM('vercel', 'render', 'aws', 'azure', 'gcp', 'ovh', 'cloudflare')`,
    );
    await queryRunner.query(`
      CREATE TABLE "cloud_accounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "provider" "public"."cloud_accounts_provider_enum" NOT NULL,
        "label" character varying NOT NULL,
        "api_key_encrypted" text NOT NULL,
        "connected_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_cloud_accounts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_cloud_accounts_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_cloud_accounts_org_id_provider" ON "cloud_accounts" ("org_id", "provider")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cloud_accounts"`);
    await queryRunner.query(`DROP TYPE "public"."cloud_accounts_provider_enum"`);
  }
}
