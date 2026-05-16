# HomeOps

HomeOps is a self-hosted mini SRE platform for monitoring personal services running on a homelab or VPS.

The goal is to build a production-like monitoring and incident management system, not just a CRUD dashboard.

## Current Status

This repository is in the backend foundation phase.

At this stage, the project focuses on:

- documenting the product idea
- learning Git and GitHub workflow
- defining small milestones
- building the project step by step

The first minimal backend API has been added. It currently exposes a health check endpoint at `/health`.

Runtime configuration, Docker Compose services, Prisma database schema,
persistent service management APIs, and manual health check history have been
added. Manual health checks now also update service status fields such as
`currentStatus`, `consecutiveFailures`, `lastCheckedAt`, `lastSuccessAt`, and
`lastFailureAt`. The API process also starts a simple background worker that
automatically checks active services when they are due. Services now create
incidents when they go down and resolve incidents when they recover.

## Intended MVP

The first useful version of HomeOps should let a user:

- register and log in
- add services to monitor
- run HTTP health checks in the background
- save health check history
- mark services as up or down
- create and resolve incidents automatically
- send an alert when an incident opens or resolves
- view a dashboard and a public status page

## Important Documents

- `PROJECT_BRIEF.md`: product idea, MVP scope, suggested stack, and main entities
- `AGENTS.md`: mentoring and engineering rules for working on this repo
- `docs/`: beginner-friendly workflow, architecture notes, glossary, runbook, and milestones
- `docs/learning-log.md`: place to record what was learned after each task

## Repository Structure

This repository currently contains documentation and project workflow files.

- `.github/`: GitHub templates and workflow configuration
- `.env.example`: safe example of environment variables the project may need
- `.gitignore`: tells Git which local files should not be committed
- `AGENTS.md`: rules for how Codex should mentor and work in this repo
- `GLOBAL_AGENTS.md`: broader agent instructions copied into the project
- `PROJECT_BRIEF.md`: main product brief for HomeOps
- `README.md`: quick entry point for understanding the project
- `package.json`: Node.js project metadata, scripts, and dependencies
- `package-lock.json`: exact dependency versions installed by npm
- `src/`: backend API source code
- `docs/`: detailed learning, workflow, architecture, and operations notes

The app source code is intentionally small right now. More components will be added one milestone at a time.

## Local Development

Requirements:

- Node.js
- npm
- Docker Desktop, for PostgreSQL and Redis

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Run the first database migration:

```bash
npm run prisma:migrate
```

Start the backend API:

```bash
npm start
```

Run tests:

```bash
npm test
```

Verify the health check endpoint in your browser:

```text
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

The server reads `APP_PORT` from the environment. If `APP_PORT` is not set, it uses `3000`.

The database connection is read from `DATABASE_URL`. Redis is configured through
`REDIS_URL`, but Redis is not used by application logic yet.

The background worker reads `WORKER_POLL_INTERVAL_SECONDS` to decide how often
it looks for active services that are due for a health check. The default is
`5` seconds.

## Service Management API

The backend can now manage monitored services through these endpoints:

```text
GET /services
POST /services
GET /services/:id
PATCH /services/:id
DELETE /services/:id
POST /services/:id/pause
POST /services/:id/resume
POST /services/:id/check
GET /services/:id/health-checks
```

Example request body for `POST /services`:

```json
{
  "name": "Example API",
  "url": "https://example.com/health",
  "expectedStatusCode": 200,
  "intervalSeconds": 60,
  "timeoutSeconds": 5,
  "failureThreshold": 3
}
```

Call `POST /services/:id/check` to run one HTTP GET health check for a service.
The result is saved to PostgreSQL and can be read back with
`GET /services/:id/health-checks`.

The manual check endpoint also updates the related service:

- successful checks mark the service `UP`
- successful checks reset `consecutiveFailures` to `0`
- failed checks increase `consecutiveFailures`
- failed checks mark the service `DOWN` after reaching `failureThreshold`
- a successful check recovers a `DOWN` service back to `UP`

## Background Worker

When the API starts with `npm start`, HomeOps also starts a simple background
worker in the same Node.js process.

The worker periodically:

1. Finds services where `isActive` is `true`.
2. Skips services that were checked too recently.
3. Runs a health check for services whose `intervalSeconds` has passed.
4. Saves each health check result.
5. Updates the service status using the same logic as the manual check endpoint.

This is intentionally simpler than BullMQ. Redis is still available in Docker
Compose for future queue-based background jobs.

## Incident Management API

HomeOps creates incidents automatically when a service transitions to `DOWN`.
When a `DOWN` service recovers to `UP`, HomeOps resolves the active incident and
records the downtime duration.

The backend exposes these incident endpoints:

```text
GET /incidents
GET /incidents/:id
POST /incidents/:id/acknowledge
POST /incidents/:id/resolve
GET /incidents/:id/events
```

Incident statuses:

- `OPEN`
- `ACKNOWLEDGED`
- `RESOLVED`

Incident timeline events:

- `CREATED`
- `ACKNOWLEDGED`
- `RESOLVED`

## Learning Workflow

HomeOps is built with small, reviewable tasks.

For each task, the workflow is:

1. Understand the goal.
2. Define acceptance criteria.
3. Think about edge cases.
4. Create a Git branch.
5. Make the smallest useful change.
6. Verify the result.
7. Review the diff.
8. Commit with a Conventional Commit message.
9. Open a Pull Request.
10. Update the learning log.

## Next Step

The next feature PR is alert notifications: send a Discord or Telegram alert
when an incident opens or resolves.
