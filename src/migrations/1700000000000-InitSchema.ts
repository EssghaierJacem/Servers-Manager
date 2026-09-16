import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1700000000000 implements MigrationInterface {
  name = 'InitSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_organizations_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin')`);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "email" character varying NOT NULL,
        "password_hash" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'admin',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_email" ON "users" ("email")`);

    await queryRunner.query(
      `CREATE TYPE "public"."hosts_provider_enum" AS ENUM('azure', 'vmware', 'ovh', 'aws', 'digitalocean', 'bare_metal', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."hosts_status_enum" AS ENUM('unknown', 'healthy', 'degraded', 'unreachable')`,
    );
    await queryRunner.query(`
      CREATE TABLE "hosts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "provider" "public"."hosts_provider_enum" NOT NULL,
        "ip_address" character varying NOT NULL,
        "ssh_port" integer NOT NULL DEFAULT 22,
        "ssh_user" character varying NOT NULL,
        "ssh_key_encrypted" text NOT NULL,
        "status" "public"."hosts_status_enum" NOT NULL DEFAULT 'unknown',
        "last_checked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_hosts_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_hosts_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."health_check_logs_status_enum" AS ENUM('healthy', 'degraded', 'unreachable')`,
    );
    await queryRunner.query(`
      CREATE TABLE "health_check_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "host_id" uuid NOT NULL,
        "status" "public"."health_check_logs_status_enum" NOT NULL,
        "raw_output" jsonb NOT NULL,
        "checked_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_health_check_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_health_check_logs_host_id" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_health_check_logs_host_id" ON "health_check_logs" ("host_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_health_check_logs_host_id"`);
    await queryRunner.query(`DROP TABLE "health_check_logs"`);
    await queryRunner.query(`DROP TYPE "public"."health_check_logs_status_enum"`);

    await queryRunner.query(`DROP TABLE "hosts"`);
    await queryRunner.query(`DROP TYPE "public"."hosts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."hosts_provider_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);

    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
