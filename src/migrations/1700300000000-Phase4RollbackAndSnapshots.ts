import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase4RollbackAndSnapshots1700300000000 implements MigrationInterface {
  name = 'Phase4RollbackAndSnapshots1700300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "deployment_snapshots" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "service_id" uuid NOT NULL,
        "image_tag" character varying NOT NULL,
        "config_blob" text NOT NULL,
        "deployed_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "deployed_by" uuid,
        "is_current" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deployment_snapshots_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deployment_snapshots_service_id" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_deployment_snapshots_deployed_by" FOREIGN KEY ("deployed_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_deployment_snapshots_service_id" ON "deployment_snapshots" ("service_id")`,
    );
    // Belt-and-suspenders on top of the service-layer flip in
    // DeploymentSnapshotsService.createSnapshot: at most one current
    // snapshot per service, enforced by Postgres even under a race.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_deployment_snapshots_one_current_per_service"
      ON "deployment_snapshots" ("service_id") WHERE "is_current" = true
    `);

    await queryRunner.query(
      `CREATE TYPE "public"."rollback_events_status_enum" AS ENUM('pending', 'in_progress', 'succeeded', 'failed')`,
    );
    await queryRunner.query(`
      CREATE TABLE "rollback_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "service_id" uuid NOT NULL,
        "from_snapshot_id" uuid NOT NULL,
        "to_snapshot_id" uuid NOT NULL,
        "triggered_by" uuid NOT NULL,
        "status" "public"."rollback_events_status_enum" NOT NULL DEFAULT 'pending',
        "log_output" jsonb NOT NULL DEFAULT '[]',
        "initiated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_rollback_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rollback_events_service_id" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rollback_events_from_snapshot_id" FOREIGN KEY ("from_snapshot_id") REFERENCES "deployment_snapshots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rollback_events_to_snapshot_id" FOREIGN KEY ("to_snapshot_id") REFERENCES "deployment_snapshots"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_rollback_events_triggered_by" FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_rollback_events_service_id" ON "rollback_events" ("service_id")`,
    );
    // Belt-and-suspenders on top of the application-level check in
    // RollbackService.enqueueRollback: at most one pending/in_progress
    // rollback per service, enforced by Postgres even under a race.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_rollback_events_one_active_per_service"
      ON "rollback_events" ("service_id") WHERE "status" IN ('pending', 'in_progress')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_rollback_events_one_active_per_service"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_rollback_events_service_id"`);
    await queryRunner.query(`DROP TABLE "rollback_events"`);
    await queryRunner.query(`DROP TYPE "public"."rollback_events_status_enum"`);

    await queryRunner.query(
      `DROP INDEX "public"."IDX_deployment_snapshots_one_current_per_service"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_deployment_snapshots_service_id"`);
    await queryRunner.query(`DROP TABLE "deployment_snapshots"`);
  }
}
