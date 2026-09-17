import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase7ServerGeneratedHostKeys1700500000000 implements MigrationInterface {
  name = 'Phase7ServerGeneratedHostKeys1700500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // hosts.status gains 'pending_setup' - a host whose generated key hasn't
    // been installed on the target machine yet.
    await queryRunner.query(`ALTER TYPE "public"."hosts_status_enum" ADD VALUE 'pending_setup'`);

    // Existing rows (created under the old client-supplied-key contract)
    // have no public key on file; '' is a one-time backfill placeholder,
    // same approach as the Phase 2 entity_type backfill.
    await queryRunner.query(`ALTER TABLE "hosts" ADD "ssh_public_key" text NOT NULL DEFAULT ''`);
    await queryRunner.query(`ALTER TABLE "hosts" ALTER COLUMN "ssh_public_key" DROP DEFAULT`);

    await queryRunner.query(`ALTER TABLE "hosts" ADD "setup_verified_at" TIMESTAMP WITH TIME ZONE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hosts" DROP COLUMN "setup_verified_at"`);
    await queryRunner.query(`ALTER TABLE "hosts" DROP COLUMN "ssh_public_key"`);

    // Postgres has no DROP VALUE for enums: rebuild the type without
    // 'pending_setup'. Fails if any host row still has that status at
    // revert time, same limitation as other enum-widening migrations here.
    await queryRunner.query(
      `ALTER TYPE "public"."hosts_status_enum" RENAME TO "hosts_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."hosts_status_enum" AS ENUM('unknown', 'healthy', 'degraded', 'unreachable')`,
    );
    await queryRunner.query(`
      ALTER TABLE "hosts"
      ALTER COLUMN "status" TYPE "public"."hosts_status_enum"
      USING "status"::text::"public"."hosts_status_enum"
    `);
    await queryRunner.query(`DROP TYPE "public"."hosts_status_enum_old"`);
  }
}
