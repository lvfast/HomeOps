# Learning Log

Use this file to record what you learned after each task.

## 2026-05-14

### What we worked on

We reviewed the current HomeOps project state and updated the project roadmap.

### What changed

We decided to move from very small technical PRs to larger feature-slice PRs.

The new roadmap is documented in `docs/06-milestones.md`.

### Commands used

```bash
rg --files
git status --short --branch
npm.cmd test
```

### Concepts learned

- A feature slice is one Pull Request that delivers a meaningful product
  capability end to end.
- A micro refactor is a very small technical cleanup that may not create visible
  product value by itself.
- HomeOps should now prioritize domain progress: Service, HealthCheck,
  Incident, Alert, Metrics, and Dashboard.

### What confused me

TBD

### Questions to revisit

- Should the first database PR use Prisma only, or also introduce a repository
  layer?
- Should the scheduler start simple with a worker loop before BullMQ?

### Next tiny step

Start PR 1: runtime configuration and database foundation.

## 2026-05-14 - Runtime and database foundation

### What we worked on

We started PR 1: runtime configuration and database foundation.

### What changed

We added a centralized config module, Docker Compose services for PostgreSQL and
Redis, Prisma setup, and the first database migration for the `Service` model.

### Commands used

```bash
npm.cmd install dotenv @prisma/client
npm.cmd install --save-dev prisma
npx.cmd prisma validate
npx.cmd prisma generate
docker compose up -d postgres redis
npm.cmd audit --omit=dev
```

### Concepts learned

- Runtime configuration means reading app settings from environment variables.
- Docker Compose can start supporting services like PostgreSQL and Redis.
- Prisma schema describes the database models.
- A migration records a database structure change.

### What confused me

Docker Compose was installed, but Docker daemon was not reachable in this
environment. The database containers could not be started here.

`npm audit` originally reported vulnerabilities in the Prisma 7 development
toolchain. We aligned Prisma packages on version 6.19.3 so audit is clean and
Prisma validation still works.

### Questions to revisit

- Should service CRUD use Prisma Client directly first, or introduce a small
  service repository module?
- Should the first scheduler use a simple worker loop before BullMQ?

### Next tiny step

Verify Docker and Prisma migration locally when Docker Desktop is running.

## Entry template

### Date

YYYY-MM-DD

### What we worked on

TBD

### What changed

TBD

### Commands used

```bash
TBD
```

### Concepts learned

TBD

### What confused me

TBD

### Questions to revisit

TBD

### Next tiny step

TBD
