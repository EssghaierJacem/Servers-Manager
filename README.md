# Infrastructure Command Center

A provider-agnostic infrastructure monitoring tool. It connects to VMs across any provider
(Azure, VMware, OVH, bare metal — provider is just a metadata label, not an architectural
boundary) via SSH, checks their health, tracks the containers running on them, monitors
domains and SSL certificates, and will later support one-click rollback of containerized
services.

**This repo covers Phase 1 (auth, host registration, SSH health checks), Phase 2
(domain + SSL certificate monitoring), and Phase 3 (per-container service tracking).**
Rollback, deployment snapshots, alerting, and a frontend UI beyond Swagger are explicitly
out of scope for now — see Roadmap below.

## Tech stack

- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL via TypeORM (migrations, no `synchronize`)
- **Queue:** Redis + BullMQ, on two independent queues/schedules — host health checks
  (every 2 min) and domain/SSL checks (every 6h)
- **SSH:** `node-ssh` (wraps `ssh2`) for connecting to managed hosts
- **DNS/WHOIS/TLS:** Node's built-in `dns`/`tls` modules, plus `whois-json` for WHOIS
  lookups (WHOIS has no standard machine-readable protocol/format, so a maintained
  parser package is used instead of hand-rolling one)
- **Auth:** Email + password, bcrypt password hashing, JWT access/refresh tokens
- **Local dev infra:** Docker Compose for Postgres + Redis

## Prerequisites

- Node.js 20+
- Docker (for Postgres + Redis locally)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in real secrets
cp .env.example .env
# Generate a 32-byte hex key for SSH_KEY_ENCRYPTION_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Generate long random strings for JWT_ACCESS_SECRET / JWT_REFRESH_SECRET the same way.

# 3. Start Postgres + Redis
docker-compose up -d

# 4. Run database migrations
npm run migration:run

# 5. (Optional) seed the default organization explicitly
#    (it is also created automatically on first /auth/register call)
npm run seed

# 6. Start the API in watch mode
npm run start:dev
```

The API listens on `http://localhost:3000` by default. Swagger/OpenAPI docs are served at
`http://localhost:3000/api/docs` in non-production environments.

## Example usage

```bash
# Register a user (creates the user under the single default organization)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "a-strong-password"}'

# Log in to get an access/refresh token pair
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "a-strong-password"}'
# -> { "access_token": "...", "refresh_token": "..." }

export TOKEN="<paste access_token here>"

# Register a host (SSH private key is encrypted at rest and never returned again)
curl -X POST http://localhost:3000/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prod-web-01",
    "provider": "azure",
    "ip_address": "203.0.113.10",
    "ssh_port": 22,
    "ssh_user": "ubuntu",
    "ssh_private_key": "-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
  }'
# -> { "id": "<host-id>", ... }

# List hosts / trigger a check / view results
curl http://localhost:3000/hosts -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/hosts/<host-id>/check -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/hosts/<host-id> -H "Authorization: Bearer $TOKEN"

# The same check also syncs every container on that host via `docker ps -a`
curl http://localhost:3000/hosts/<host-id>/services -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/services/<service-id> -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/services/<service-id>/check -H "Authorization: Bearer $TOKEN"

# Register a domain (optionally linked to a host) — this also triggers an
# immediate DNS + WHOIS + TLS check
curl -X POST http://localhost:3000/domains \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"hostname": "example.com"}'
# -> { "id": "<domain-id>", "dns_status": "unknown", "ssl_status": "unknown", ... }

# A few seconds later: real DNS resolution + SSL certificate data
curl http://localhost:3000/domains/<domain-id> -H "Authorization: Bearer $TOKEN"

# Trigger another check on demand (rate-limited to once/minute per domain)
curl -X POST http://localhost:3000/domains/<domain-id>/check -H "Authorization: Bearer $TOKEN"

# Combined host + domain/SSL + service status counts
curl http://localhost:3000/overview -H "Authorization: Bearer $TOKEN"
```

Registered hosts are re-checked automatically every `HEALTH_CHECK_INTERVAL_MS` (default:
2 minutes); registered domains every `DOMAIN_CHECK_INTERVAL_MS` (default: 6 hours) — both
via independent BullMQ repeatable jobs, no manual triggering required.

## How the host health check works

On trigger (scheduled or on-demand via `POST /hosts/:id/check`):

1. A per-host job is queued in BullMQ (`health-check` queue), processed by a worker pool
   with configurable concurrency (`HEALTH_CHECK_CONCURRENCY`, default 5) — one slow or
   unreachable host never blocks the others.
2. The worker decrypts the host's SSH key in-memory (only inside the worker process) and
   connects via `node-ssh` with a connect timeout (`SSH_CONNECT_TIMEOUT_MS`) — **one SSH
   session, reused for everything below.**
3. It runs `uptime` and `docker ps -a --format '{{json .}}'` (`-a` includes stopped
   containers) in that same session.
   - SSH connects and both commands behave (Docker not installed is a valid, non-failing
     state) → `healthy`
   - SSH connects but a command fails/times out unexpectedly → `degraded`
   - SSH connection itself fails (timeout, auth failure, refused) → `unreachable`
4. A `HealthCheckLog` row is written with the raw output (or error), and the host's
   `status` / `last_checked_at` are updated.
5. The `docker ps -a` output already fetched in step 3 is handed to the service sync (see
   below) — no second SSH connection is opened for it.

## How the service (container) sync works

Runs as part of the host health check above, in the same job and the same SSH session —
there is no separate schedule or connection for this.

1. If `docker ps -a` failed because Docker isn't installed (exit code non-zero and the
   output looks like "command not found"), this is logged at debug level and treated as
   zero services for that host — not a job failure.
2. Otherwise each JSON line is parsed into a container record and upserted into a
   `Service` row keyed on `(host_id, container_id)`, so repeated checks update the same
   row instead of creating duplicates. The image reference is split into `image` +
   `current_tag` (careful not to mistake a registry's `host:port` for a tag separator).
3. Each container's status is classified from Docker's own status string
   (`classifyContainerStatus`, in `src/services/container-status-classifier.ts`):
   - contains `Restarting` → `crash_loop` (Docker is actively restarting it)
   - contains `Up` and `(unhealthy)` → `unhealthy` (has a failing `HEALTHCHECK`)
   - contains `Up` otherwise → `running` (including containers with no healthcheck at all)
   - contains `Exited` → `stopped`
   - anything else → `unknown`, with the raw string logged for diagnosis
4. Any existing `Service` row for that host whose container didn't appear in this run is
   explicitly marked `unknown` (the container may have been removed) rather than left
   silently stale. A row already `unknown` is left alone so a long-gone container isn't
   re-written and re-logged on every run forever.
5. Each container's outcome writes its own `HealthCheckLog` entry
   (`entity_type: service`, `entity_id`: the Service row's id).

## How the domain check works

On trigger (scheduled or on-demand via `POST /domains/:id/check`, rate-limited to once per
minute per domain via Redis):

1. A per-domain job is queued in BullMQ (`domain-check` queue, entirely separate from the
   host queue/schedule), processed with its own worker concurrency
   (`DOMAIN_CHECK_CONCURRENCY`).
2. **DNS**: `dns.promises.resolve4(hostname)`, timeout-wrapped (`DNS_TIMEOUT_MS`). Success
   → `dns_status: resolving` + stores the resolved IP; failure → `not_resolving`.
3. **WHOIS**: always attempted regardless of the DNS outcome (a domain can fail to resolve
   while still being registered), via `whois-json`, timeout-wrapped
   (`WHOIS_TIMEOUT_MS`). WHOIS field names aren't standardized across
   registrars/TLDs, so a list of common field-name candidates is tried for registrar and
   expiry date. A failed/timed-out lookup is logged and never fails the rest of the check.
4. **TLS**: only runs if DNS resolved. Opens a raw TLS connection (Node's `tls` module) to
   the resolved IP on port 443 with SNI set to the hostname, timeout-wrapped
   (`TLS_TIMEOUT_MS`). The certificate's `valid_to` decides the status:
   - connection/handshake fails, or no certificate is presented → `invalid`
   - `valid_to` in the past → `expired`
   - `valid_to` within `SSL_EXPIRY_WARNING_DAYS` (14, a named constant in
     `src/domain-check/domain-check.constants.ts`) → `expiring_soon`
   - otherwise → `valid`
5. Each of the three checks writes its own `HealthCheckLog` entry (`entity_type: domain`
   for DNS/WHOIS, `entity_type: ssl_certificate` for TLS) so failures are individually
   diagnosable, and the `Domain` / `SSLCertificate` rows are updated in place (the latter
   holds only the latest certificate state, not a history).

`HealthCheckLog` is a single polymorphic audit-trail table shared by both check types
(`entity_type` + `entity_id` identify what was checked), rather than a parallel logging
table per resource — see `src/health-check-log/`.

## Scripts

| Command                    | Description                                       |
| --------------------------- | -------------------------------------------------- |
| `npm run start:dev`         | Start the API in watch mode                        |
| `npm run build`             | Type-check and compile to `dist/`                  |
| `npm run lint`               | ESLint (zero warnings required)                    |
| `npm test`                  | Run the Jest unit test suite                        |
| `npm run migration:run`     | Apply pending TypeORM migrations                   |
| `npm run migration:revert`  | Revert the last migration                          |
| `npm run seed`              | Explicitly seed the default organization           |

## Security notes

- Passwords are hashed with bcrypt (cost factor 12) — never stored or logged in plaintext.
- SSH private keys are encrypted at rest with AES-256-GCM, using a key derived from
  `SSH_KEY_ENCRYPTION_SECRET`. They are decrypted only in-memory, only inside the
  health-check worker, immediately before connecting.
- `ssh_key_encrypted` / decrypted key material is never returned by any API response.
- All endpoints except `/auth/register` and `/auth/login` require a valid JWT; a
  `RolesGuard` + `@Roles()` decorator gate access even though only one role
  (`admin`) exists today.
- Domain hostnames are validated as fully-qualified domain names
  (`class-validator`'s `@IsFQDN()`) before ever reaching an outbound DNS/WHOIS/TLS call.
- Every outbound network call the domain checker makes (DNS, WHOIS, TLS) is
  timeout-wrapped (`src/common/utils/with-timeout.ts`) so a slow/unresponsive remote
  service can never hang a worker slot indefinitely.
- `POST /domains/:id/check` is rate-limited to once per minute per domain (Redis-backed)
  so repeated manual triggering can't be used to hammer WHOIS servers.
- All configuration is loaded through a single typed config module that fails fast on
  startup if a required environment variable is missing.
- There is no `POST /services` — services are only ever discovered from real `docker ps -a`
  output during a host check, never created by hand.

## Project status / roadmap

- ✅ Phase 1: Auth, host registration, SSH-based health checks
- ✅ Phase 2: Domain + SSL certificate monitoring (DNS/WHOIS/TLS)
- ✅ Phase 3 (this repo): Per-container service tracking (`docker ps -a`, status
  classification, container lifecycle state — no rollback yet, just current state)
- ⏭️ Phase 4: One-click rollback of containerized services
- ⏭️ Phase 5: Frontend UI + WebSocket live updates
