import { ApiProperty } from '@nestjs/swagger';

export class IdleHostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  ip_address: string;

  @ApiProperty({ nullable: true })
  last_checked_at: Date | null;

  @ApiProperty()
  created_at: Date;
}

export class OrphanedDomainDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  hostname: string;

  @ApiProperty({ nullable: true })
  host_id: string | null;

  @ApiProperty({ nullable: true })
  resolved_ip: string | null;
}

export class OrphanedHostDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  ip_address: string;
}

export class InsightsResponseDto {
  @ApiProperty({ type: [IdleHostDto] })
  idle_hosts: IdleHostDto[];

  @ApiProperty({ type: [OrphanedDomainDto] })
  orphaned_domains: OrphanedDomainDto[];

  @ApiProperty({ type: [OrphanedHostDto] })
  orphaned_hosts: OrphanedHostDto[];
}
