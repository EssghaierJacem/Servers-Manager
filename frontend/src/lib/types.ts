// Mirrors the backend's response DTOs (Phases 1-5) field-for-field.

export type HostStatus = 'unknown' | 'healthy' | 'degraded' | 'unreachable' | 'pending_setup';
export type HostProvider =
  'azure' | 'vmware' | 'ovh' | 'aws' | 'digitalocean' | 'bare_metal' | 'other';

export type DomainDnsStatus = 'unknown' | 'resolving' | 'not_resolving';
export type SslCertificateStatus = 'unknown' | 'valid' | 'expiring_soon' | 'expired' | 'invalid';
export type ServiceStatus = 'unknown' | 'running' | 'unhealthy' | 'stopped' | 'crash_loop';
export type RollbackEventStatus = 'pending' | 'in_progress' | 'succeeded' | 'failed';

export interface HealthCheckLog {
  id: string;
  status: string;
  raw_output: Record<string, unknown>;
  checked_at: string;
}

export interface Host {
  id: string;
  name: string;
  provider: HostProvider;
  ip_address: string;
  ssh_port: number;
  ssh_user: string;
  ssh_public_key: string;
  status: HostStatus;
  last_checked_at: string | null;
  setup_verified_at: string | null;
  created_at: string;
}

export interface HostDetail extends Host {
  recent_logs: HealthCheckLog[];
}

export interface CreateHostRequest {
  name: string;
  provider: HostProvider;
  ip_address: string;
  ssh_port: number;
  ssh_user: string;
}

export interface CreateHostResponse extends Host {
  bootstrap_command: string;
}

export interface SetupInstructions {
  ssh_public_key: string;
  bootstrap_command: string;
}

export interface Domain {
  id: string;
  hostname: string;
  host_id: string | null;
  registrar: string | null;
  domain_expires_at: string | null;
  dns_status: DomainDnsStatus;
  resolved_ip: string | null;
  ssl_status: SslCertificateStatus;
  last_checked_at: string | null;
  created_at: string;
}

export interface SslCertificate {
  status: SslCertificateStatus;
  issuer: string | null;
  valid_from: string | null;
  valid_to: string | null;
  last_checked_at: string | null;
}

export interface DomainDetail {
  id: string;
  hostname: string;
  host_id: string | null;
  registrar: string | null;
  domain_expires_at: string | null;
  dns_status: DomainDnsStatus;
  resolved_ip: string | null;
  last_checked_at: string | null;
  created_at: string;
  ssl_certificate: SslCertificate;
  recent_logs: HealthCheckLog[];
}

export interface Service {
  id: string;
  host_id: string;
  container_id: string;
  container_name: string;
  image: string;
  current_tag: string | null;
  status: ServiceStatus;
  port_mappings: Record<string, unknown> | null;
  last_checked_at: string;
  created_at: string;
}

export interface ServiceDetail extends Service {
  recent_logs: HealthCheckLog[];
}

export interface DeploymentSnapshot {
  id: string;
  image_tag: string;
  deployed_at: string;
  deployed_by: string | null;
  is_current: boolean;
  created_at: string;
}

export interface RollbackLogEntry {
  timestamp: string;
  step: string;
  command?: string;
  exit_code?: number | null;
  stdout?: string;
  stderr?: string;
  message?: string;
}

export interface RollbackEvent {
  id: string;
  service_id: string;
  from_snapshot_id: string;
  to_snapshot_id: string;
  triggered_by: string;
  status: RollbackEventStatus;
  log_output: RollbackLogEntry[];
  initiated_at: string;
  completed_at: string | null;
}

export interface Overview {
  total_hosts: number;
  healthy: number;
  degraded: number;
  unreachable: number;
  unknown: number;
  pending_setup: number;
  domains_total: number;
  ssl_valid: number;
  ssl_expiring_soon: number;
  ssl_expired: number;
  ssl_invalid: number;
  domains_not_resolving: number;
  services_total: number;
  running: number;
  unhealthy: number;
  stopped: number;
  crash_loop: number;
  services_unknown: number;
  idle_hosts_count: number;
  orphaned_domains_count: number;
  orphaned_hosts_count: number;
}

export interface CheckTriggeredResponse {
  job_id: string;
}

export interface RollbackTriggeredResponse {
  rollback_event_id: string;
}

export interface AuthenticatedUser {
  id: string;
  orgId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}
