# Milestones

## Current strategy: feature PR roadmap

The project started with very small learning tasks. That was useful for learning
Git, Express, routing, middleware, and tests.

From this point forward, the project should move faster by using feature slices.

A feature slice means:

- one Pull Request should deliver one meaningful HomeOps capability
- the PR can include config, schema, routes, tests, and docs when they all support
  the same goal
- unrelated cleanup should stay out of the PR
- each PR should still be reviewed in small checkpoints

In simple terms:

```text
Prefer: one PR that adds persistent service management end to end.
Avoid: many tiny PRs that only move one helper file or one middleware.
```

The guiding priority is:

```text
domain > cleanup
feature slice > micro refactor
working flow > perfect architecture
```

## MVP feature PR plan

### PR 1: Runtime configuration and database foundation

Goal:
Prepare the backend for persistent HomeOps data.

Scope:
- update `.env.example` for runtime variables
- add centralized config for `APP_PORT`, `NODE_ENV`, `DATABASE_URL`, and `REDIS_URL`
- add Docker Compose for PostgreSQL and Redis
- add Prisma database setup
- add the first migration with a `Service` model
- keep existing API routes working

Out of scope:
- service CRUD
- health check runner
- incident logic
- alerting
- frontend
- BullMQ worker logic

Done when:
- tests pass
- API starts successfully
- Docker Compose can start PostgreSQL and Redis
- Prisma migration can run
- documentation explains the local setup commands

PR title:

```text
Add runtime configuration and database foundation
```

### PR 2: Persistent service management

Goal:
Let users create and manage services that HomeOps will monitor.

Scope:
- create the `Service` entity in the database
- add service APIs:
  - `GET /services`
  - `POST /services`
  - `GET /services/:id`
  - `PATCH /services/:id`
  - `DELETE /services/:id`
  - `POST /services/:id/pause`
  - `POST /services/:id/resume`
- validate important fields, especially URL and numeric settings
- add tests for create, list, get, update, pause, resume, delete, and invalid URL

Done when:
- a service can be created through the API
- the service is saved in PostgreSQL
- tests cover the main service management behavior

PR title:

```text
Add persistent service management
```

### PR 3: Health check runner and history

Goal:
Create the first real monitoring behavior: check one service and save the result.

Scope:
- add `HealthCheck` model
- add a `runHealthCheck(service)` domain function
- support HTTP GET checks
- measure response time
- handle timeout
- compare actual status code with expected status code
- save each check result
- add manual check API:
  - `POST /services/:id/check`
  - `GET /services/:id/health-checks`

Done when:
- calling `POST /services/:id/check` checks a real URL
- the result is saved
- the check history can be read back from the API

PR title:

```text
Add health check runner and history
```

### PR 4: Service status transition logic

Goal:
Use health check results to decide whether a service is `UP` or `DOWN`.

Scope:
- update `consecutiveFailures` after each check
- update `lastCheckedAt`, `lastSuccessAt`, and `lastFailureAt`
- keep service `UP` after successful checks
- mark service `DOWN` after reaching `failureThreshold`
- reset `consecutiveFailures` when the service recovers

Out of scope:
- incidents
- alerts
- background scheduler

Done when:
- a service that fails enough times becomes `DOWN`
- a recovered service becomes `UP`
- tests cover the main transitions

PR title:

```text
Add service status transition logic
```

### PR 5: Background health check scheduler

Goal:
Make HomeOps check active services automatically.

Preferred scope:
- add a worker process or scheduler
- periodically find active services
- run health checks without manual API calls
- avoid creating too many duplicate jobs

Implementation note:
Start simple if needed. A worker loop is acceptable before introducing BullMQ.
Redis and BullMQ can be added when the simpler worker is no longer enough.

Done when:
- creating an active service is enough for HomeOps to produce health check records
  automatically

PR title:

```text
Add background health check scheduler
```

### PR 6: Incident lifecycle and timeline

Goal:
Create incidents when services go down and resolve them when services recover.

Scope:
- add `Incident` model
- add `IncidentEvent` model
- create an `OPEN` incident when a service changes from `UP` to `DOWN`
- avoid duplicate open incidents for the same outage
- resolve the open incident when the service changes from `DOWN` to `UP`
- calculate `durationSeconds`
- create timeline events for incident creation and resolution
- add incident APIs:
  - `GET /incidents`
  - `GET /incidents/:id`
  - `POST /incidents/:id/acknowledge`
  - `POST /incidents/:id/resolve`
  - `GET /incidents/:id/events`

Done when:
- a failed service creates an incident
- a recovered service resolves the incident
- the incident has timeline events

PR title:

```text
Add incident lifecycle and timeline
```

### PR 7: Alert notifications

Goal:
Send an alert when an incident opens or resolves.

Scope:
- choose one notification channel first, preferably Discord Webhook
- add notification configuration through environment variables
- send alert on incident creation
- send recovery alert on incident resolution
- avoid duplicate alerts for the same state transition
- optionally save notification history

Done when:
- a real Discord or Telegram alert is sent for incident open and recovery
- tests cover the deduplication behavior where possible

PR title:

```text
Add incident alert notifications
```

### PR 8: Metrics and public status API

Goal:
Expose useful status and uptime data for a dashboard or public status page.

Scope:
- add service metrics endpoint:
  - `GET /services/:id/metrics?range=24h`
- add dashboard summary endpoint:
  - `GET /dashboard/summary`
- add public status endpoint:
  - `GET /status`
- calculate basic metrics:
  - uptime percentage
  - average response time
  - total checks
  - successful checks
  - failed checks
  - open incidents
  - recent incidents

Done when:
- the backend can demo current system health without a frontend

PR title:

```text
Add uptime metrics and public status API
```

### PR 9: Minimal frontend dashboard

Goal:
Add enough UI to demo HomeOps clearly.

Scope:
- add a minimal frontend
- show dashboard summary
- show services list
- show service detail
- show incidents list
- show incident detail
- show public status page

Done when:
- a short demo can show service creation, monitoring, downtime detection,
  incident creation, recovery, and status page updates

PR title:

```text
Add minimal HomeOps dashboard
```

### PR 10: Portfolio polish and deployment

Goal:
Make the project ready to show in a portfolio.

Scope:
- complete Docker Compose setup
- improve README
- add architecture diagram
- add demo instructions
- add seed data if useful
- add screenshots
- document trade-offs and future improvements

Done when:
- another person can clone the repo, run the documented commands, and demo the
  core HomeOps flow

PR title:

```text
Prepare HomeOps for portfolio demo
```

## Learning milestones

## M0: Repository setup

Goal:
Create a clean project repository.

Tasks:
- Add README.md
- Add AGENTS.md
- Add docs folder
- Add .gitignore
- Add .env.example

Done when:
- Repo has basic structure.
- First commit exists.
- User understands each file.

## M1: Local development setup

Goal:
Make the app runnable locally.

Tasks:
- Choose simple tech stack.
- Add minimal app.
- Add setup instructions.
- Add run command.

Done when:
- User can run the app locally.
- README explains how.

## M2: First tiny feature

Goal:
Add the smallest real feature.

Examples:
- Health check endpoint
- Basic homepage
- CLI hello command

Done when:
- Feature works.
- Verification steps exist.
- Change is committed through a feature branch.

## M3: Testing

Goal:
Introduce automated testing.

Tasks:
- Add test framework.
- Add first test.
- Explain how tests work.

## M4: GitHub Pull Request workflow

Goal:
Practice real review workflow.

Tasks:
- Create issue.
- Create branch.
- Commit.
- Push.
- Open PR.
- Review diff.
- Merge.

## M5: CI

Goal:
Run checks automatically on GitHub.

Tasks:
- Add GitHub Actions.
- Run tests on PR.
- Explain CI result.

## M6: Docker

Goal:
Run the app in a container.

Tasks:
- Add Dockerfile.
- Add docker-compose.yml.
- Explain image vs container.

## M7: Database

Goal:
Add persistent data.

Tasks:
- Add database.
- Add migration.
- Add simple CRUD feature.

## M8: Deployment to homeserver

Goal:
Deploy to Ubuntu homeserver.

Tasks:
- Prepare server folder.
- Use Docker Compose.
- Configure environment variables.
- Start service.
- Verify health check.

## M9: Operations

Goal:
Learn basic production operations.

Tasks:
- Logs.
- Monitoring.
- Backup.
- Restore.
- Rollback.

## M10: Release process

Goal:
Create versioned releases.

Tasks:
- Git tags.
- Changelog.
- Release notes.
- Rollback guide.
