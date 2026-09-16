# Infrastructure Command Center

A provider-agnostic infrastructure monitoring tool. It connects to VMs across any provider
(Azure, VMware, OVH, bare metal — provider is just a metadata label, not an architectural
boundary) via SSH, checks their health, and will later support one-click rollback of
containerized services.

**This is Phase 1 of a larger design.** It covers authentication, host registration, and
SSH-based health checks only. Rollback, domain/SSL monitoring, and a frontend UI are
explicitly out of scope for this pass.

## Tech stack

- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL via TypeORM (migrations, no `synchronize`)
- **Queue:** Redis + BullMQ for background health-check jobs
- **SSH:** `node-ssh` (wraps `ssh2`) for connecting to managed hosts
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

# List hosts
curl http://localhost:3000/hosts -H "Authorization: Bearer $TOKEN"

# Trigger an immediate health check
curl -X POST http://localhost:3000/hosts/<host-id>/check -H "Authorization: Bearer $TOKEN"

# Check the result a few seconds later
curl http://localhost:3000/hosts/<host-id> -H "Authorization: Bearer $TOKEN"

# Aggregate status counts across all hosts
curl http://localhost:3000/overview -H "Authorization: Bearer $TOKEN"
```

Registered hosts are also re-checked automatically every `HEALTH_CHECK_INTERVAL_MS`
(default: 2 minutes) via a BullMQ repeatable job — no manual triggering required.

## How the health check works

On trigger (scheduled or on-demand via `POST /hosts/:id/check`):

1. A per-host job is queued in BullMQ (`health-check` queue), processed by a worker pool
   with configurable concurrency (`HEALTH_CHECK_CONCURRENCY`, default 5) — one slow or
   unreachable host never blocks the others.
2. The worker decrypts the host's SSH key in-memory (only inside the worker process) and
   connects via `node-ssh` with a connect timeout (`SSH_CONNECT_TIMEOUT_MS`).
3. It runs `uptime` and `docker ps --format '{{json .}}'`.
   - SSH connects and both commands behave (Docker not installed is a valid, non-failing
     state) → `healthy`
   - SSH connects but a command fails/times out unexpectedly → `degraded`
   - SSH connection itself fails (timeout, auth failure, refused) → `unreachable`
4. A `HealthCheckLog` row is written with the raw output (or error), and the host's
   `status` / `last_checked_at` are updated.

## Scripts

| Command                  | Description                                      |
| ------------------------- | ------------------------------------------------- |
| `npm run start:dev`       | Start the API in watch mode                       |
| `npm run build`           | Type-check and compile to `dist/`                 |
| `npm run lint`            | ESLint (zero warnings required)                   |
| `npm test`                | Run the Jest unit test suite                       |
| `npm run migration:run`   | Apply pending TypeORM migrations                  |
| `npm run migration:revert`| Revert the last migration                         |
| `npm run seed`            | Explicitly seed the default organization          |

## Security notes

- Passwords are hashed with bcrypt (cost factor 12) — never stored or logged in plaintext.
- SSH private keys are encrypted at rest with AES-256-GCM, using a key derived from
  `SSH_KEY_ENCRYPTION_SECRET`. They are decrypted only in-memory, only inside the
  health-check worker, immediately before connecting.
- `ssh_key_encrypted` / decrypted key material is never returned by any API response.
- All endpoints except `/auth/register` and `/auth/login` require a valid JWT; a
  `RolesGuard` + `@Roles()` decorator gate access even though only one role
  (`admin`) exists today.
- All configuration is loaded through a single typed config module that fails fast on
  startup if a required environment variable is missing.

## Project status / roadmap

This is **Phase 1** of a larger design:

- ✅ Phase 1 (this repo): Auth, host registration, SSH-based health checks
- ⏭️ Phase 2: One-click rollback of containerized services
- ⏭️ Phase 3: Domain / SSL / DNS monitoring
- ⏭️ Phase 4: Frontend UI + WebSocket live updates
