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
- Background health check scheduler
- Incident lifecycle and timeline

Future components:

- Web app
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

Background check flow:

API process starts
  -> start health check worker
  -> every WORKER_POLL_INTERVAL_SECONDS
  -> find active services
  -> skip services checked too recently
  -> check due services
  -> save HealthCheck in PostgreSQL
  -> update Service status fields

Incident lifecycle flow:

Health check updates Service status
  -> if Service transitions to DOWN
  -> create OPEN Incident
  -> create CREATED IncidentEvent

Health check updates Service status
  -> if Service transitions from DOWN to UP
  -> resolve active Incident
  -> calculate durationSeconds
  -> create RESOLVED IncidentEvent
```
