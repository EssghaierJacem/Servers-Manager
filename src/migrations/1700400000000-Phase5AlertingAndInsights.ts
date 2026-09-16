import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase5AlertingAndInsights1700400000000 implements MigrationInterface {
  name = 'Phase5AlertingAndInsights1700400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- alert_rules ---
    await queryRunner.query(
      `CREATE TYPE "public"."alert_rules_entity_type_enum" AS ENUM('host', 'domain', 'ssl_certificate', 'service', 'rollback_event', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_rules_channel_enum" AS ENUM('slack', 'email')`,
    );
    await queryRunner.query(`
      CREATE TABLE "alert_rules" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL,
        "name" character varying NOT NULL,
        "entity_type" "public"."alert_rules_entity_type_enum" NOT NULL,
        "condition" character varying NOT NULL,
        "channel" "public"."alert_rules_channel_enum" NOT NULL,
        "channel_config_encrypted" text NOT NULL,
        "cooldown_minutes" integer NOT NULL DEFAULT 30,
        "enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alert_rules_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alert_rules_org_id" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_rules_org_id_entity_type_condition" ON "alert_rules" ("org_id", "entity_type", "condition")`,
    );

    // --- alert_logs ---
    await queryRunner.query(
      `CREATE TYPE "public"."alert_logs_entity_type_enum" AS ENUM('host', 'domain', 'ssl_certificate', 'service', 'rollback_event', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."alert_logs_delivery_status_enum" AS ENUM('sent', 'failed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "alert_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "alert_rule_id" uuid NOT NULL,
        "entity_type" "public"."alert_logs_entity_type_enum" NOT NULL,
        "entity_id" uuid NOT NULL,
        "message" text NOT NULL,
        "delivery_status" "public"."alert_logs_delivery_status_enum" NOT NULL,
        "error" text,
        "fired_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_alert_logs_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alert_logs_alert_rule_id" FOREIGN KEY ("alert_rule_id") REFERENCES "alert_rules"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_alert_logs_alert_rule_id_entity_id" ON "alert_logs" ("alert_rule_id", "entity_id")`,
    );

    // --- insight_states ---
    await queryRunner.query(
      `CREATE TYPE "public"."insight_states_flag_enum" AS ENUM('idle_host', 'orphaned_domain', 'orphaned_host')`,
    );
    await queryRunner.query(`
      CREATE TABLE "insight_states" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "entity_id" uuid NOT NULL,
        "flag" "public"."insight_states_flag_enum" NOT NULL,
        "active" boolean NOT NULL,
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_insight_states_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_insight_states_entity_id_flag" ON "insight_states" ("entity_id", "flag")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_insight_states_entity_id_flag"`);
    await queryRunner.query(`DROP TABLE "insight_states"`);
    await queryRunner.query(`DROP TYPE "public"."insight_states_flag_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_alert_logs_alert_rule_id_entity_id"`);
    await queryRunner.query(`DROP TABLE "alert_logs"`);
    await queryRunner.query(`DROP TYPE "public"."alert_logs_delivery_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."alert_logs_entity_type_enum"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_alert_rules_org_id_entity_type_condition"`);
    await queryRunner.query(`DROP TABLE "alert_rules"`);
    await queryRunner.query(`DROP TYPE "public"."alert_rules_channel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."alert_rules_entity_type_enum"`);
  }
}
