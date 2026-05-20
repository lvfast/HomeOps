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

## 2026-05-15 - Persistent service management

### What we worked on

We started PR 2: persistent service management.

### What changed

We added service management API endpoints for creating, listing, reading,
updating, pausing, resuming, and deleting monitored services.

The endpoints use Prisma to persist services in PostgreSQL.

### Commands used

```bash
git switch -c feat/persistent-service-management
npm.cmd test
```

### Concepts learned

- CRUD means create, read, update, and delete.
- Validation means checking input before saving it.
- Persistent data means data is saved in a database instead of only living in
  memory.

### What confused me

TBD

### Questions to revisit

- Should we introduce a separate service layer before health check logic grows?
- Should future tests use a separate test database instead of the local
  development database?

### Next tiny step

Review the PR 2 diff, then commit and open a Pull Request.

## 2026-05-15 - Health check runner and history

### What we worked on

We started PR 3: health check runner and history.

### What changed

We added a `HealthCheck` database model and a manual API for checking one
service:

- `POST /services/:id/check`
- `GET /services/:id/health-checks`

The health check runner sends an HTTP GET request, measures response time,
handles timeout, compares the response status code with the expected status
code, and saves the result.

### Commands used

```bash
git switch -c feat/health-check-runner-history
docker compose up -d postgres redis
npm.cmd run prisma:migrate -- --name add_health_checks
npm.cmd test
```

### Concepts learned

- A health check is a request used to decide whether a service looks healthy.
- Response time measures how long the service took to answer.
- Timeout prevents HomeOps from waiting forever for a broken service.
- Health check history lets future features calculate uptime and detect trends.

### What confused me

Prisma migration failed when PostgreSQL was not running. Starting Docker Compose
again fixed the issue.

### Questions to revisit

- Should health check tests move to a separate test database?
- Should `runHealthCheck` support more check types later, such as TCP or custom
  headers?

### Next tiny step

Review the PR 3 diff, then commit and open a Pull Request.

## 2026-05-16 - Service status transition logic

### What we worked on

We started PR 4: service status transition logic.

### What changed

We added logic that updates a service after each manual health check.

Successful checks mark the service `UP`, reset `consecutiveFailures`, and update
`lastCheckedAt` and `lastSuccessAt`.

Failed checks increase `consecutiveFailures`, update `lastCheckedAt` and
`lastFailureAt`, and mark the service `DOWN` once the failure count reaches
`failureThreshold`.

### Commands used

```bash
git switch -c feat/service-status-transition-logic
docker compose ps
docker compose up -d postgres redis
npm.cmd test
```

### Concepts learned

- A state transition is a controlled change from one state to another.
- A failure threshold helps avoid marking a service down after one temporary
  failure.
- A pure helper function is easier to test because it does not need HTTP,
  Express, Prisma, or PostgreSQL.

### What confused me

Route tests need PostgreSQL. When Docker Desktop was not running, those tests
failed with database connection errors. After starting Docker Desktop and the
Docker Compose services, the full test suite passed.

### Questions to revisit

- Should route tests eventually use a dedicated test database?
- Should PR 5 reuse the same status transition helper from the background
  scheduler?

### Next tiny step

Review and commit the PR 4 diff, then push the branch and open a Pull Request.

## 2026-05-16 - Background health check scheduler

### What we worked on

We started PR 5: background health check scheduler.

### What changed

We added a simple in-process worker that starts with the API server.

The worker periodically finds active services, skips services that were checked
too recently, runs health checks for due services, saves health check history,
and updates service status.

We also extracted `checkService` so the manual API endpoint and the worker use
the same health check persistence and status transition logic.

### Commands used

```bash
git switch -c feat/background-health-check-scheduler
npm.cmd test
```

### Concepts learned

- A worker performs background work without waiting for a user request.
- A scheduler decides when repeated background work should run.
- Polling means checking repeatedly at a fixed interval.
- Shared domain logic helps prevent the API path and worker path from drifting
  apart.

### What confused me

TBD

### Questions to revisit

- Should the worker move to a separate process later?
- When should HomeOps replace this simple loop with BullMQ and Redis?
- Should automatic health checks have more detailed operational metrics?

### Next tiny step

Review and commit the PR 5 diff, then push the branch and open a Pull Request.

## 2026-05-16 - Incident lifecycle and timeline

### What we worked on

We started PR 6: incident lifecycle and timeline.

### What changed

We added `Incident` and `IncidentEvent` database models.

HomeOps now opens an incident when a service transitions to `DOWN`, avoids
duplicate active incidents for the same outage, and resolves the active incident
when the service recovers to `UP`.

We also added incident APIs for listing, reading, acknowledging, resolving, and
reading timeline events.

### Commands used

```bash
git switch -c feat/incident-lifecycle-timeline
npm.cmd run prisma:migrate -- --name add_incidents
npx.cmd prisma validate
npm.cmd run prisma:generate
node --test test\incidentLifecycle.test.js test\checkService.test.js test\config.test.js test\healthCheckScheduler.test.js
npm.cmd test
```

### Concepts learned

- An incident records an outage.
- An incident lifecycle describes how an incident moves from `OPEN` to
  `ACKNOWLEDGED` to `RESOLVED`.
- A timeline stores important events that happened during an incident.
- Database migrations are needed when adding new tables.

### What confused me

Prisma schema validation worked, but migration creation could not run until
Docker Desktop was started. After Docker was running, the incident migration
applied successfully and the full test suite passed.

### Questions to revisit

- Should incidents remain after deleting a service, or should they cascade with
  the service?
- Should manual incident resolution also update service status in a later PR?
- Should incident severity be configurable per service?

### Next tiny step

Review and commit the PR 6 diff, then push the branch and open a Pull Request.

## 2026-05-18 - Incident alert notifications

### What we worked on

We started PR 7: incident alert notifications.

### What changed

We added notification history for incident alerts and Discord Webhook support.

HomeOps now records a notification attempt when an incident opens or resolves.
If `DISCORD_WEBHOOK_URL` is configured, HomeOps sends a Discord Webhook request.
If it is empty, HomeOps records the notification as `SKIPPED` so local
development can still be tested without a real Discord secret.

### Commands used

```bash
git switch -c feat/incident-alert-notifications
node --test test\notifications.test.js test\incidentLifecycle.test.js test\checkService.test.js
npx.cmd prisma validate
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
docker compose up -d postgres redis
npm.cmd test
```

### Concepts learned

- A webhook is a URL that receives an HTTP request from another system.
- A notification record helps track whether an alert was sent, failed, or
  skipped.
- Alert deduplication prevents sending the same alert repeatedly for one
  incident event.

### What confused me

Docker Desktop was not reachable when we first tried to apply the notification
migration. After starting Docker Desktop and running Docker Compose, the
notification migration applied successfully and the full test suite passed.

### Questions to revisit

- Should HomeOps retry failed notifications automatically?
- Should alert messages include service URL, severity, and duration?
- Should users configure alert channels per service?

### Next tiny step

Review and commit the PR 7 diff, then push the branch and open a Pull Request.

## 2026-05-19 - Metrics and public status APIs

### What we worked on

We started PR 8: metrics and public status APIs.

### What changed

We added APIs that prepare backend data for the future dashboard and public
status page:

- `GET /services/:id/metrics?range=24h`
- `GET /dashboard/summary`
- `GET /status`

The service metrics endpoint calculates uptime percentage, average response
time, total checks, successful checks, and failed checks.

### Commands used

```bash
git switch -c feat/metrics-public-status-api
node --test test\metrics.test.js test\notifications.test.js test\incidentLifecycle.test.js
npx.cmd prisma validate
docker compose up -d postgres redis
npm.cmd run prisma:migrate
npm.cmd test
```

### Concepts learned

- Metrics are numbers that summarize how the system behaves.
- Uptime percentage shows how many checks succeeded in a selected time range.
- A public status API should expose safe operational status, not internal
  implementation details.
- A dashboard summary API prepares data for a future UI without building the UI
  yet.

### What confused me

The full test suite failed while PostgreSQL was not running. Starting Docker
Compose and confirming migrations fixed the environment problem.

### Questions to revisit

- Should the public status endpoint hide service IDs before the app becomes
  public on the internet?
- Should metrics eventually support custom date ranges?
- Should dashboard summary include notification health?

### Next tiny step

Review and commit the PR 8 diff, then push the branch and open a Pull Request.

## 2026-05-19 - Minimal frontend dashboard

### What we worked on

We started PR 9: minimal frontend dashboard.

### What changed

We added a Vite and React frontend in `frontend/`.

The frontend includes:

- a dashboard page at `/`
- a service detail page at `/service/:id`
- a public status page at `/public-status`
- shared UI components for status badges, summary cards, loading states, empty
  states, and error states
- a small API client that calls the existing backend endpoints

### Commands used

```bash
git switch -c feat/minimal-frontend-dashboard
npm --prefix frontend install
npm run frontend:build
npx.cmd prisma validate
```

### Concepts learned

- A frontend runs in the browser and calls backend APIs.
- React builds UI from reusable components.
- Vite provides a local frontend dev server and production build command.
- A proxy lets the frontend dev server forward API requests to the backend.
- Frontend routes should avoid conflicting with backend API routes.

### What confused me

The first Vite dev server showed a blank page on Windows because React
dependencies were not served correctly in dev mode. We changed the frontend dev
script so it builds first and then runs Vite preview. The practical command is
now `npm run dev` or `npm run frontend:dev`, and the dashboard opens at
`http://127.0.0.1:4173`.

### Questions to revisit

- Should the frontend eventually use charts for response time and uptime?
- Should service create, pause, resume, and manual check actions be added next?
- Should the public status page hide service IDs before internet exposure?

### Next tiny step

Run backend tests when Docker Desktop is available, review the PR 9 diff, then
commit and open a Pull Request.

## 2026-05-20 - Frontend service actions

### What we worked on

We started the next small frontend step after the minimal dashboard.

### What changed

We added service action buttons to the service detail page:

- pause a monitored service
- resume a paused service
- run a manual health check

After each action, the page reloads the service data from the backend so the UI
shows the latest service status, metrics, and health check history.

### Commands used

```bash
git switch -c feat/frontend-service-actions
npm.cmd run frontend:build
```

### Concepts learned

- A UI action is a user-triggered operation, such as clicking a button.
- Frontend state should show whether an action is loading, successful, or failed.
- Reloading data from the backend after an action is a simple way to keep the UI
  consistent.

### What confused me

TBD

### Questions to revisit

- Should the dashboard list also expose quick actions later?
- Should manual checks show more detailed success and failure messages?

### Next tiny step

Run the backend with PostgreSQL and verify the buttons in the browser.

## 2026-05-20 - Frontend service creation form

### What we worked on

We started the next frontend PR after service action buttons.

### What changed

We added a service creation form to the dashboard. The form lets a user create a
monitored HTTP service from the browser instead of calling the API manually.

The dashboard reloads after a successful create so the new service appears in
the service list.

### Commands used

```bash
git switch main
git pull
git switch -c feat/frontend-service-create-form
npm.cmd run frontend:build
```

### Concepts learned

- A form collects user input before sending it to the backend.
- Browser form values arrive as strings, so numeric fields must be converted to
  numbers before calling the API.
- Keeping form data after an error helps the user fix one field without typing
  everything again.

### What confused me

TBD

### Questions to revisit

- Should service editing use a similar form on the service detail page?
- Should service creation optionally run the first health check immediately?

### Next tiny step

Manually test service creation in the browser with the backend and PostgreSQL
running.

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
