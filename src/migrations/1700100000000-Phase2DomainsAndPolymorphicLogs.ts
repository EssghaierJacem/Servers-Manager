import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2DomainsAndPolymorphicLogs1700100000000 implements MigrationInterface {
  name = 'Phase2DomainsAndPolymorphicLogs1700100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- health_check_logs: host_id FK -> polymorphic (entity_type, entity_id) ---
    await queryRunner.query(
      `CREATE TYPE "public"."health_check_logs_entity_type_enum" AS ENUM('host', 'domain', 'ssl_certificate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "health_check_logs" ADD "entity_type" "public"."health_check_logs_entity_type_enum" NOT NULL DEFAULT 'host'`,
    );
    await queryRunner.query(`ALTER TABLE "health_check_logs" ADD "entity_id" uuid`);
    await queryRunner.query(`UPDATE "health_check_logs" SET "entity_id" = "host_id"`);
    await queryRunner.query(
      `ALTER TABLE "health_check_logs" ALTER COLUMN "entity_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "health_check_logs" DROP CONSTRAINT "FK_health_check_logs_host_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_health_check_logs_host_id"`);
    await queryRunner.query(`ALTER TABLE "health_check_logs" DROP COLUMN "host_id"`);

    // status becomes a free-text outcome label (vocabulary owned by whichever
    // checker wrote it) instead of a single DB-wide enum that would have to
    // grow every time a new checkable entity type is added.
    await queryRunner.query(
      `ALTER TABLE "health_check_logs" ALTER COLUMN "status" TYPE character varying USING "status"::text`,
    );
    await queryRunner.query(`DROP TYPE "public"."health_check_logs_status_enum"`);

    await queryRunner.query(
      `CREATE INDEX "IDX_health_check_logs_entity" ON "health_check_logs" ("entity_type", "entity_id")`,
    );

    // --- domains ---
    await queryRunner.query(
      `CREATE TYPE "public"."domains_dns_status_enum" AS ENUM('unknown', 'resolving', 'not_resolving')`,
    );
    await queryRunner.query(`
      CREATE TABLE "domains" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "host_id" uuid,
        "hostname" character varying NOT NULL,
        "registrar" character varying,
        "domain_expires_at" TIMESTAMP WITH TIME ZONE,
        "dns_status" "public"."domains_dns_status_enum" NOT NULL DEFAULT 'unknown',
        "resolved_ip" character varying,
        "last_checked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_domains_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_domains_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_domains_host_id" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_domains_org_id_hostname" ON "domains" ("org_id", "hostname")`,
    );

    // --- ssl_certificates ---
    await queryRunner.query(
      `CREATE TYPE "public"."ssl_certificates_status_enum" AS ENUM('unknown', 'valid', 'expiring_soon', 'expired', 'invalid')`,
    );
    await queryRunner.query(`
      CREATE TABLE "ssl_certificates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "domain_id" uuid NOT NULL,
        "issuer" character varying,
        "valid_from" TIMESTAMP WITH TIME ZONE,
        "valid_to" TIMESTAMP WITH TIME ZONE,
        "status" "public"."ssl_certificates_status_enum" NOT NULL DEFAULT 'unknown',
        "last_checked_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ssl_certificates_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ssl_certificates_domain_id" UNIQUE ("domain_id"),
        CONSTRAINT "FK_ssl_certificates_domain_id" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ssl_certificates"`);
    await queryRunner.query(`DROP TYPE "public"."ssl_certificates_status_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_domains_org_id_hostname"`);
    await queryRunner.query(`DROP TABLE "domains"`);
    await queryRunner.query(`DROP TYPE "public"."domains_dns_status_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_health_check_logs_entity"`);

    await queryRunner.query(
      `CREATE TYPE "public"."health_check_logs_status_enum" AS ENUM('healthy', 'degraded', 'unreachable')`,
    );
    await queryRunner.query(
      `ALTER TABLE "health_check_logs" ALTER COLUMN "status" TYPE "public"."health_check_logs_status_enum" USING "status"::"public"."health_check_logs_status_enum"`,
    );

    await queryRunner.query(`ALTER TABLE "health_check_logs" ADD "host_id" uuid`);
    await queryRunner.query(
      `UPDATE "health_check_logs" SET "host_id" = "entity_id" WHERE "entity_type" = 'host'`,
    );
    await queryRunner.query(`DELETE FROM "health_check_logs" WHERE "host_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "health_check_logs" ALTER COLUMN "host_id" SET NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX "IDX_health_check_logs_host_id" ON "health_check_logs" ("host_id")`,
    );
    await queryRunner.query(`
      ALTER TABLE "health_check_logs"
      ADD CONSTRAINT "FK_health_check_logs_host_id" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`ALTER TABLE "health_check_logs" DROP COLUMN "entity_id"`);
    await queryRunner.query(`ALTER TABLE "health_check_logs" DROP COLUMN "entity_type"`);
    await queryRunner.query(`DROP TYPE "public"."health_check_logs_entity_type_enum"`);
  }
}
