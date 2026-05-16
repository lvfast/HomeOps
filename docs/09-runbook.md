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

## Backup

TBD

## Restore

TBD

## Rollback

TBD

## Notes

Every time we learn a new operational command, add it here.
