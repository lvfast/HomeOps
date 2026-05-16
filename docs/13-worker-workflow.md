# Worker Workflow

This document explains how the HomeOps health check worker runs.

## Big Picture

HomeOps currently has two ways to run a health check:

1. A user manually calls `POST /services/:id/check`.
2. The background worker automatically checks active services.

Both flows use the same shared function: `checkService`.

```mermaid
flowchart TD
    A[Manual API<br/>POST /services/:id/check] --> C[checkService]
    B[Background Worker<br/>automatic scheduler] --> C[checkService]

    C --> D[runHealthCheck]
    D --> E[Save HealthCheck]
    E --> F[buildServiceStatusUpdate]
    F --> G[Update Service]

    G --> H[Service becomes UP or DOWN]
```

## App Startup Flow

When the app starts, HomeOps starts both the API server and the worker.

```mermaid
flowchart TD
    A[npm start] --> B[src/server.js]
    B --> C[Create Express API app]
    B --> D[Create health check scheduler]

    C --> E[API listens on APP_PORT]
    D --> F[scheduler.start]

    F --> G[Run first worker tick immediately]
    F --> H[Run tick repeatedly with setInterval]
```

Important files:

- `src/server.js`: starts the API and the scheduler.
- `src/app.js`: creates the Express app and stores the Prisma client.
- `src/workers/healthCheckScheduler.js`: contains the worker loop.

## Background Worker Flow

The worker checks all active services that are due for a new health check.

```mermaid
flowchart TD
    A[Worker tick] --> B[Find services where isActive = true]
    B --> C{Was service checked before?}

    C -->|No| D[Service is due]
    C -->|Yes| E[Calculate nextCheckAt]

    E --> F{nextCheckAt <= now?}
    F -->|No| G[Skip service]
    F -->|Yes| D

    D --> H[checkService]
    H --> I[runHealthCheck]
    I --> J[HTTP GET service.url]
    J --> K[Save HealthCheck]
    K --> L[Update Service status]
```

Due check rule:

```text
If lastCheckedAt is empty:
  check now

If lastCheckedAt + intervalSeconds <= now:
  check now

Otherwise:
  skip until later
```

## Manual Check Flow

Manual checks still exist. They are useful for testing and debugging.

```mermaid
flowchart TD
    A[User or Postman] --> B[POST /services/:id/check]
    B --> C[Find service by id]

    C --> D{Service exists?}
    D -->|No| E[Return 404 Service not found]
    D -->|Yes| F[checkService]

    F --> G[runHealthCheck]
    G --> H[Save HealthCheck]
    H --> I[Update Service status]
    I --> J[Return healthCheck and updated service]
```

## Service Status Update Flow

After every check, HomeOps updates the service status.

```mermaid
flowchart TD
    A[Health check result] --> B{SUCCESS or FAILURE?}

    B -->|SUCCESS| C[currentStatus = UP]
    C --> D[consecutiveFailures = 0]
    D --> E[Update lastCheckedAt and lastSuccessAt]

    B -->|FAILURE| F[consecutiveFailures + 1]
    F --> G[Update lastCheckedAt and lastFailureAt]
    G --> H{consecutiveFailures >= failureThreshold?}

    H -->|Yes| I[currentStatus = DOWN]
    H -->|No| J[Keep currentStatus]
```

## Call Chain

Automatic worker flow:

```text
src/server.js
  -> scheduler.start()
  -> tick()
  -> runDueHealthChecks()
  -> prisma.service.findMany({ where: { isActive: true } })
  -> isServiceDueForCheck(service)
  -> checkService(prisma, service)
  -> runHealthCheck(service)
  -> prisma.healthCheck.create(...)
  -> buildServiceStatusUpdate(...)
  -> prisma.service.update(...)
```

Manual API flow:

```text
POST /services/:id/check
  -> src/routes/serviceRoutes.js
  -> findService(prisma, id)
  -> checkService(prisma, service)
  -> runHealthCheck(service)
  -> prisma.healthCheck.create(...)
  -> buildServiceStatusUpdate(...)
  -> prisma.service.update(...)
```

## Current Limitation

The current worker is intentionally simple:

- It runs inside the same Node.js process as the API.
- It checks due services sequentially.
- It does not use BullMQ yet.
- It does not create incidents yet.

This is enough for learning the basic worker concept. Later, HomeOps can move
to Redis and BullMQ when the project needs queue-based background jobs.
