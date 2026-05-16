# Architecture

## Current state

This project is in the backend foundation phase.

Architecture should stay simple until there is a real need for more complexity.

## Principles

- Start simple.
- Prefer clear code over clever code.
- Add abstractions only when repeated patterns appear.
- Document important decisions in ADR files.

## Current components

- Express API server
- PostgreSQL database
- Prisma schema and migrations
- Docker Compose for local PostgreSQL and Redis
- Manual health check runner
- Service status transition logic

Future components:

- Web app
- Background worker
- Queue
- Alert notifications
- Reverse proxy
- Monitoring
- Backup job

## Architecture diagram

```text
Client or Postman
  -> Express API
  -> Prisma Client
  -> PostgreSQL

Manual check flow:

Client or Postman
  -> POST /services/:id/check
  -> runHealthCheck(service)
  -> monitored service URL
  -> save HealthCheck in PostgreSQL
  -> update Service status fields
```
