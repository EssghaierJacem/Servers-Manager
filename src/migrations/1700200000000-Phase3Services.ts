import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase3Services1700200000000 implements MigrationInterface {
  name = 'Phase3Services1700200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // health_check_logs.entity_type gains 'service' alongside host/domain/ssl_certificate.
    await queryRunner.query(
      `ALTER TYPE "public"."health_check_logs_entity_type_enum" ADD VALUE 'service'`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."services_status_enum" AS ENUM('unknown', 'running', 'unhealthy', 'stopped', 'crash_loop')`,
    );
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "host_id" uuid NOT NULL,
        "container_id" character varying NOT NULL,
        "container_name" character varying NOT NULL,
        "image" character varying NOT NULL,
        "current_tag" character varying,
        "status" "public"."services_status_enum" NOT NULL DEFAULT 'unknown',
        "port_mappings" jsonb,
        "last_checked_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_services_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_services_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_services_host_id" FOREIGN KEY ("host_id") REFERENCES "hosts"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_services_host_id_container_id" ON "services" ("host_id", "container_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_services_host_id_container_id"`);
    await queryRunner.query(`DROP TABLE "services"`);
    await queryRunner.query(`DROP TYPE "public"."services_status_enum"`);

    // Postgres has no DROP VALUE for enums: rebuild the type without 'service'.
    // This fails if any row still has entity_type = 'service' at revert time,
    // same limitation as the Phase 2 down migration for this column.
    await queryRunner.query(
      `ALTER TYPE "public"."health_check_logs_entity_type_enum" RENAME TO "health_check_logs_entity_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."health_check_logs_entity_type_enum" AS ENUM('host', 'domain', 'ssl_certificate')`,
    );
    await queryRunner.query(`
      ALTER TABLE "health_check_logs"
      ALTER COLUMN "entity_type" TYPE "public"."health_check_logs_entity_type_enum"
      USING "entity_type"::text::"public"."health_check_logs_entity_type_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."health_check_logs_entity_type_enum_old"`);
  }
}
