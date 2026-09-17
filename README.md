# Servers-Manager

A provider-agnostic infrastructure monitoring tool. It connects to VMs across any provider
(Azure, VMware, OVH, bare metal — provider is just a metadata label, not an architectural
boundary) via SSH, checks their health, tracks the containers running on them, keeps a
deployment history for each one, can roll a container back to a previous image/config,
alerts on the changes that matter, and flags idle/orphaned infrastructure — on top of
monitoring domains and SSL certificates.

**This repo covers Phase 1 (auth, host registration, SSH health checks), Phase 2
(domain + SSL certificate monitoring), Phase 3 (per-container service tracking), Phase 4
(deployment snapshots + rollback), Phase 5 (alerting + idle/orphan insights), Phase 6
(the `frontend/` dashboard), Phase 7 (server-generated SSH keypairs for host
registration), and Phase 8 (an "Add host" UI end-to-end, a sidebar admin-dashboard
redesign of the frontend, and enabling CORS so the frontend can actually reach this API
from the browser).** Real provider billing integration and auto-rollback triggered by
health-check failures are explicitly out of scope for now — see Roadmap below.

> **Breaking change (Phase 7):** `POST /hosts` no longer accepts `ssh_private_key`. The
> server now generates the keypair; see "How host registration works" below. `frontend/`'s
> `/hosts/new` form (added in Phase 8) is already built against this new contract: no
> private-key field, and it surfaces the returned `ssh_public_key` + `bootstrap_command`
> for the operator to copy onto the target machine.

## Tech stack

- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL via TypeORM (migrations, no `synchronize`)
- **Queue:** Redis + BullMQ, on four independent queues — host health checks (every
  2 min), domain/SSL checks (every 6h), rollback jobs (on demand, one per request), and a
  daily insights check (idle hosts, orphaned domains/hosts)
- **SSH:** `node-ssh` (wraps `ssh2`) via a single shared `SshConnectionService`, used by
  every phase for every remote command (host checks, service sync, rollback)
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

CORS is enabled for the origins listed in `CORS_ORIGINS` (comma-separated; defaults to the
frontend's Vite dev server ports, `5173` and `5174`) - the `frontend/` app runs on a different
origin than this API, so without this the browser blocks every request it makes.

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

# Register a host - the server generates an ed25519 keypair, encrypts the private
# key at rest (never returned by any response), and hands back the public key plus
# a one-line bootstrap command
curl -X POST http://localhost:3000/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "prod-web-01",
    "provider": "azure",
    "ip_address": "203.0.113.10",
    "ssh_port": 22,
    "ssh_user": "ubuntu"
  }'
# -> { "id": "<host-id>", "status": "pending_setup", "ssh_public_key": "ssh-ed25519 ...",
#      "bootstrap_command": "mkdir -p ~/.ssh && ... && chmod 600 ~/.ssh/authorized_keys", ... }

# Paste the bootstrap_command into the target machine's own console once, then check -
# the host flips from pending_setup to healthy/degraded and setup_verified_at is set
curl -X POST http://localhost:3000/hosts/<host-id>/check -H "Authorization: Bearer $TOKEN"

# Re-fetch the public key / bootstrap command at any time without regenerating anything
curl http://localhost:3000/hosts/<host-id>/setup-instructions -H "Authorization: Bearer $TOKEN"

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

# Deployment history for a service (captured automatically whenever its
# image/tag changes) - newest first
curl http://localhost:3000/services/<service-id>/snapshots -H "Authorization: Bearer $TOKEN"

# Roll a service back to an earlier snapshot (async - returns immediately)
curl -X POST http://localhost:3000/services/<service-id>/rollback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_snapshot_id": "<snapshot-id>"}'
# -> 202 { "rollback_event_id": "<id>" }

# Poll for the outcome and the full step-by-step log
curl http://localhost:3000/rollback-events/<rollback-event-id> -H "Authorization: Bearer $TOKEN"

# Audit view across all services
curl http://localhost:3000/rollback-events -H "Authorization: Bearer $TOKEN"

# Create an alert rule (Slack webhook URL is encrypted at rest, never returned)
curl -X POST http://localhost:3000/alert-rules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Host unreachable -> Slack",
    "entity_type": "host",
    "condition": "host_status_transitioned_to:unreachable",
    "channel": "slack",
    "channel_config": {"webhook_url": "https://hooks.slack.com/services/..."},
    "cooldown_minutes": 30
  }'

# Audit trail of every alert attempt (sent or failed), filterable
curl "http://localhost:3000/alert-logs?entity_type=host" -H "Authorization: Bearer $TOKEN"

# Idle hosts + orphaned domains/hosts, computed live (not cached)
curl http://localhost:3000/insights -H "Authorization: Bearer $TOKEN"
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
   - The connection itself fails, and the failure is a network-level problem (refused,
     timed out, DNS, handshake) → `unreachable`
   - The connection itself fails because the SSH server rejected every offered key (an
     auth failure, not a network failure) → see "How host registration works" below;
     whether this is `pending_setup` or `unreachable` depends on whether the host has ever
     completed setup
4. On the first connection that succeeds (`healthy` or `degraded`) for a host still in
   `pending_setup`, `setup_verified_at` is stamped - this host has now proven the bootstrap
   command was run correctly at least once.
5. A `HealthCheckLog` row is written with the raw output (or error, tagged with a `reason`),
   and the host's `status` / `last_checked_at` are updated.
6. The `docker ps -a` output already fetched in step 3 is handed to the service sync (see
   below) — no second SSH connection is opened for it.

## How host registration works (server-generated keys)

`POST /hosts` no longer accepts a private key from the caller - handling a plaintext SSH
private key outside the backend (generating it, copying it around, OS-specific file
permissions) was error-prone and briefly exposed key material. Instead:

1. The server generates a fresh ed25519 keypair (`ssh-keypair.util.ts`) using Node's
   built-in `crypto` module, then hand-encodes it into the OpenSSH wire format ssh2 (and
   therefore `node-ssh`) expects - Node's own PKCS8 export isn't accepted by ssh2 for
   ed25519, so this is verified against both `ssh-keygen -y` and ssh2's own key parser in
   tests.
2. The private key is encrypted at rest with the same `CryptoService` used since Phase 1
   and is never returned by any API response, ever - the public key is safe to display,
   copy, and re-fetch, and is returned in full on `POST /hosts` and
   `GET /hosts/:id/setup-instructions`.
3. `POST /hosts` also returns a one-line `bootstrap_command`
   (`bootstrap-command.util.ts` - one function, used by both endpoints that return it) that
   appends the public key to `~/.ssh/authorized_keys` for the given `ssh_user` when pasted
   into the target machine's own console.
4. The host starts in `pending_setup` - a distinct, non-alarming status for "registered but
   the key hasn't been installed on the target yet," as opposed to `unreachable`, which
   means something is actually wrong. An SSH auth rejection (`level: 'client-authentication'`
   from ssh2) is classified in `health-check-status-mapper.ts`:
   - `setup_verified_at` is still `null` → stays/becomes `pending_setup` with reason
     `key_not_installed` (the bootstrap command likely hasn't run yet, or had a typo)
   - `setup_verified_at` is already set → becomes `unreachable` with reason
     `auth_revoked` (this host worked before; the key was removed or the user changed -
     a real, reportable problem, not a first-time-setup situation)

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
6. If the container's full image reference doesn't match the service's current
   `DeploymentSnapshot` (including the very first time a service is seen - there's no
   snapshot yet), a `docker inspect <container_id>` is run to capture its env vars, port
   bindings, restart policy, and container name, and a new snapshot is created
   (`deployed_by: null` - automatic capture), flipping the previous one's `is_current` to
   false. This is the one extra SSH round trip this phase adds beyond Phase 3's existing
   `uptime` + `docker ps -a` session: `docker inspect` wasn't part of that round trip, so
   there's nothing to reuse for it, and it only runs on the rare tick where a deploy
   actually happened - not on every 2-minute check.

## How rollback works

Docker containers are immutable once created - there's no way to change a running
container's image in place, only stop it and start a new one. `POST /services/:id/rollback`
does exactly that, but safely and asynchronously:

1. The controller validates `target_snapshot_id` belongs to the service in the URL (a
   cross-service id is rejected with `400`, not silently misapplied), checks the service
   has a current snapshot to roll back *from*, and rejects with `409` if a rollback is
   already `pending`/`in_progress` for this service (checked in the application layer and
   backed by a Postgres partial unique index as a safety net against races). It then
   creates the `RollbackEvent` row (`status: pending`) and enqueues the job - the `202`
   response always carries a real, immediately-pollable id.
2. The worker (its own `rollback` BullMQ queue, separate from host-health and
   domain-check) sets `status: in_progress`, decrypts the target snapshot's config via the
   same `CryptoService` that encrypts SSH keys, and - in **one SSH session** via
   `SshConnectionService` - runs, in order: `docker stop`, `docker rm`, a `docker run -d`
   built from the snapshot's captured image/ports/env/restart-policy, and `docker ps -a`.
   Every command's result is appended to `log_output` as it happens, so a failure halfway
   through still leaves a useful partial log.
3. The recreated container's status is classified with the same
   `classifyContainerStatus` used everywhere else. Only `running` is a pass. Anything
   else - `crash_loop`, `unhealthy`, `stopped`, `unknown`, a `docker run` that failed
   outright (e.g. a nonexistent image tag), or an SSH failure - marks the event `failed`
   with the reason recorded, and **stops there**: no retry, no attempt to auto-revert back
   to the pre-rollback state. A failed rollback is left exactly as attempted, for a human
   to look at.
4. On success: the `Service` row is updated to the new container id/image/status, a new
   `DeploymentSnapshot` is created (`deployed_by`: the triggering user, `is_current: true`,
   flipping the previous one), a `HealthCheckLog` entry is written, and the event is marked
   `succeeded` with `completed_at` set.

**Known, deliberate limitation:** the captured config is only what `docker inspect`
reasonably gives us cheaply - image, port bindings, environment variables, restart policy,
and container name. Volumes, networks, resource limits, and any other flag the original
container was started with are **not** captured. A rollback recreates the container using
exactly that limited set, so it is not guaranteed to reproduce the original `docker run`
invocation exactly if the container used flags outside this set. This is intentional for
this phase, not something silently worked around by guessing at additional config.

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

## How alerting works

There is no new schedule for this - `AlertEvaluationService.evaluateTransition(...)` is
called from the same point each existing processor already updates its entity's status:
the host health check, the domain/SSL check, the service sync, and the rollback job (on
failure). Alert conditions are a **fixed set** (`src/alerts/alert-condition.ts`), not a
free-form rule DSL:

```
host_status_transitioned_to:unreachable       ssl_status_transitioned_to:expiring_soon
host_status_transitioned_to:degraded          ssl_status_transitioned_to:expired
service_status_transitioned_to:crash_loop     rollback_event:failed
service_status_transitioned_to:unhealthy      system:idle_host_detected / system:orphan_detected
```

1. `evaluateTransition` no-ops unless the entity's status actually just changed (the
   previous value is compared before the new one is persisted) - this is what stops a
   permanently-broken host from re-alerting on every single check cycle.
2. If it changed, the condition string is derived (`host_status_transitioned_to:unreachable`,
   etc.) and matched against enabled `AlertRule`s for that org/entity_type/condition.
3. **Cooldown**: before sending, `AlertLog` is checked for a `sent` row for the same
   `(alert_rule_id, entity_id)` within the rule's `cooldown_minutes`. If one exists, the
   send is skipped - a *failed* delivery does not count towards cooldown, so a broken
   channel doesn't suppress the next real attempt.
4. Delivery goes through a `ChannelAdapter` (`src/alerts/channels/`) - Slack is a real
   HTTPS POST to an Incoming Webhook URL with a timeout; email is a fully-interface-
   compliant stub that records a clear "not yet configured" failure rather than pretending
   to send. Adding a channel means adding an adapter, never touching the matching/cooldown
   logic.
5. Every attempt - success or failure - writes an immutable `AlertLog` row, same audit
   spirit as `RollbackEvent`.

**Alert delivery can never fail the job that triggered it.** Every step from rule lookup
through channel delivery is wrapped in its own try/catch inside `AlertEvaluationService`;
a broken webhook, a bad channel config, or a DB hiccup while writing the log is caught,
logged, and swallowed - the health check / sync / rollback job that called it always
completes and records its own result regardless.

## How idle-host and orphan insights work

Computed by `InsightsService` on its own daily BullMQ repeatable job (its own queue -
this is an aggregate query across all hosts/domains, not a per-entity check, so it doesn't
piggyback on an existing per-host schedule):

- **Idle host** (`IDLE_HOST_MIN_AGE_HOURS`, 24h by default, in
  `src/insights/insights.constants.ts`): `status: healthy`, zero `Service` rows with
  `status: running`, and registered more than that long ago - the age check exists
  specifically so a freshly-registered host with nothing deployed to it yet isn't
  immediately flagged.
- **Orphaned domain**: `host_id IS NULL`, or its `resolved_ip` (from the Phase 2 DNS
  check) matches no registered host's `ip_address` - it resolves somewhere this system
  doesn't know about. A domain that simply hasn't resolved yet (`resolved_ip` still null)
  is not considered orphaned.
- **Orphaned host**: zero `Domain` rows reference it. Presented as informational, not a
  failure state - nothing points at a host is not inherently a problem.

`GET /insights` computes all three live from current DB state (no caching - this data
changes slowly, so a live query is fine at this scale), and `GET /overview`'s
`idle_hosts_count` / `orphaned_domains_count` / `orphaned_hosts_count` call that exact
same method, so the two endpoints can never drift apart.

The daily job only alerts (`system:idle_host_detected` / `system:orphan_detected`) for
entities *newly* matching a heuristic since the previous run - a small `InsightState`
table (`entity_id`, `flag`, `active`) persists what matched last time so a host that's
been idle for a month doesn't re-alert every day, while a host that stops and later
becomes idle again correctly re-fires.

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
- `DeploymentSnapshot.config_blob` is encrypted at rest with the same AES-256-GCM
  `CryptoService` used for SSH keys, since captured env vars can contain secrets. It is
  never returned by any API response (the snapshot list/detail DTOs omit it entirely).
- Env var values captured from `docker inspect` are re-interpolated into a shell command
  on rollback (`docker run -e ...`); every value is shell-escaped
  (`src/rollback/docker-run-command.builder.ts`) to close off command injection through
  that path.
- `POST /services/:id/rollback` requires the `admin` role via the same `RolesGuard` used
  everywhere else, even though `admin` is still the only role that exists — rollback
  changes what's actually running, so it's gated explicitly rather than left implicit.
- At most one active (`pending`/`in_progress`) rollback per service is allowed, enforced
  both in the application layer and by a Postgres partial unique index, so two concurrent
  requests can't double-execute a rollback for the same service.
- `AlertRule.channel_config_encrypted` (e.g. a Slack webhook URL) is encrypted at rest with
  the same `CryptoService` used for SSH keys and rollback config blobs - it's a credential,
  treated like one. It is never returned by any API response.
- Alert delivery is fully isolated from the job that triggered it: every step in
  `AlertEvaluationService`, from rule lookup to channel send to writing the `AlertLog`
  row, is wrapped in its own try/catch, so a broken webhook can never mark a health check,
  sync, or rollback job as failed.
- `GET /insights` computes idle/orphan data live from current DB state, scoped to the
  caller's org - same JWT + admin-role guard as every other endpoint.

## Project status / roadmap

- ✅ Phase 1: Auth, host registration, SSH-based health checks
- ✅ Phase 2: Domain + SSL certificate monitoring (DNS/WHOIS/TLS)
- ✅ Phase 3: Per-container service tracking (`docker ps -a`, status classification)
- ✅ Phase 4: Deployment snapshots + one-click rollback, with a mandatory post-rollback
  health check and a full audit trail (`RollbackEvent`)
- ✅ Phase 5: Alerting (Slack, fixed condition set, cooldown-aware) + idle-host and
  orphan-domain/host insights, both wired into the existing check processors and a new
  daily insights job
- ✅ Phase 6: `frontend/` - a React/Vite/TanStack Query dashboard (login/sign-up, live
  overview board, host/domain/service detail, press-and-hold rollback confirmation)
- ✅ Phase 7: Server-generated ed25519 keypairs for host registration - the private key
  never leaves the backend, `pending_setup` status, and SSH auth-failure classification
  that distinguishes "never set up" from "used to work, now broken"
- ✅ Phase 8 (this repo): An "Add host" flow built end-to-end through the UI
  (`/hosts/new` → setup-instructions view → live "Verify connection"), a sidebar
  admin-dashboard redesign of `frontend/` (stat cards, status-breakdown bars, colored
  status badges), and `CORS_ORIGINS` enabled on the backend so the frontend can reach it
  from a real browser at all (previously only ever exercised via `curl`)
- ⏭️ Later: WebSocket live updates (replacing the frontend's 30s polling), real provider
  billing integration, auto-rollback triggered by health-check failures, an email delivery
  backend, SSH key rotation for existing hosts
