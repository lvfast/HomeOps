# Runbook

This file explains how to operate the project.

## Start the app

Start infrastructure:

```bash
docker compose up -d postgres redis
```

Run migrations:

```bash
npm run prisma:migrate
```

Start the API:

```bash
npm start
```

Starting the API also starts the background health check worker. The terminal
should show a message like:

```text
Health check worker is polling every 5 seconds
```

Start the frontend dashboard in a second terminal:

```bash
npm run frontend:dev
```

Open:

```text
http://127.0.0.1:4173
```

The shorter root command also works:

```bash
npm run dev
```

## Stop the app

Stop the API with `Ctrl+C` in the terminal where it is running.

Stop infrastructure:

```bash
docker compose down
```

## Check status

Check the API health endpoint:

```text
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

Check Docker services:

```bash
docker compose ps
```

Check whether automatic health checks are being created:

1. Create or resume an active service.
2. Wait for at least the service `intervalSeconds`.
3. Call `GET /services/:id/health-checks`.
4. Confirm that new health check records appear without calling
   `POST /services/:id/check`.

Check whether incidents are being created:

1. Create an active service with a URL that returns a failing status code.
2. Wait for enough failed checks to reach `failureThreshold`.
3. Call `GET /incidents`.
4. Confirm that an `OPEN` incident exists for the service.
5. Fix the service URL or make the service healthy again.
6. Confirm that the incident becomes `RESOLVED`.

Check whether Discord notifications are being recorded:

1. Set `DISCORD_WEBHOOK_URL` in `.env` if you want real Discord alerts.
2. Leave `DISCORD_WEBHOOK_URL` empty if you only want local testing.
3. Create an incident by making a service fail.
4. Confirm a notification record exists in PostgreSQL.
5. If no webhook URL is configured, the notification status should be
   `SKIPPED`.

Check service metrics:

1. Create a service.
2. Run one or more checks with `POST /services/:id/check`.
3. Call `GET /services/:id/metrics?range=24h`.
4. Confirm the response includes `uptimePercentage`,
   `averageResponseTimeMs`, `totalChecks`, `successfulChecks`, and
   `failedChecks`.

Check dashboard summary:

1. Call `GET /dashboard/summary`.
2. Confirm the response includes service counts, incident counts, and recent
   incidents.

Check public status:

1. Call `GET /status`.
2. Confirm the response includes only active services.
3. Confirm internal statuses are mapped to public values such as
   `OPERATIONAL`, `MAJOR_OUTAGE`, or `UNKNOWN`.

Check the frontend dashboard:

1. Start PostgreSQL and Redis.
2. Run migrations.
3. Start the backend API with `npm start`.
4. Start the frontend with `npm run frontend:dev`.
5. Open `http://127.0.0.1:4173`.
6. Confirm the dashboard loads summary cards, service list, and recent
   incidents.
7. Open a service detail page and confirm metrics and recent health checks load.
8. Open `http://127.0.0.1:4173/public-status` and confirm public status loads.

## View logs

View infrastructure logs:

```bash
docker compose logs postgres
docker compose logs redis
```

## Common problems

### App does not start

Steps:

1. Check error message.
2. Check environment variables.
3. Check dependencies.
4. Check logs.

### Docker services do not start

Steps:

1. Check that Docker Desktop is running.
2. Check whether ports `5432` or `6379` are already in use.
3. Run `docker compose ps`.
4. Run `docker compose logs postgres` or `docker compose logs redis`.

### Prisma migration fails

Steps:

1. Check that `.env` exists.
2. Check that `DATABASE_URL` matches `.env.example`.
3. Check that PostgreSQL is running.
4. Run `npm run prisma:migrate` again.

### Worker does not create health checks

Steps:

1. Check that the API is running with `npm start`.
2. Check that the service has `isActive: true`.
3. Check that enough time has passed since `lastCheckedAt`.
4. Check `WORKER_POLL_INTERVAL_SECONDS` in `.env`.
5. Check the API terminal for worker error logs.

### Frontend dashboard does not load data

Steps:

1. Check that the backend API is running on port `3000`.
2. Check that the frontend is running on port `4173`.
3. Check the browser page for the error message.
4. Check the backend terminal for API errors.
5. Check that Vite proxy routes in `frontend/vite.config.js` still match the
   backend API routes.

### Discord alert is not sent

Steps:

1. Check that `DISCORD_WEBHOOK_URL` is set in `.env`.
2. Restart the API after changing `.env`.
3. Check whether a notification record was created.
4. If the notification status is `FAILED`, check `errorMessage`.
5. Check the Discord webhook configuration.

## Backup

TBD

## Restore

TBD

## Rollback

TBD

## Notes

Every time we learn a new operational command, add it here.
