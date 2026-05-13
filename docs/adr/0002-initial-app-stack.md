# ADR 0002: Initial App Stack

## Status

Draft

## Context

HomeOps will eventually include a frontend, backend API, database, background worker, queue, notifications, and Docker Compose setup.

Building all of that at once would be too large for the current learning stage.

The next milestone is to make the project runnable locally with the smallest useful application code.

## Decision

Start with a minimal backend API server first.

The first app component should be an API server that can later support:

- health check endpoints
- service management endpoints
- incident management logic
- tests
- future database access
- future background worker integration

Do not add the frontend, PostgreSQL, Redis, BullMQ, notifications, or Docker in the first runnable milestone.

## Consequences

Positive:

- The first code milestone stays small.
- The project starts near the core monitoring logic.
- It is easier to test API behavior before adding a user interface.
- Future features can build on the same backend foundation.

Negative:

- There will not be a visual dashboard at first.
- Some final MVP components are intentionally delayed.
- The architecture will need to expand later when the frontend, database, and worker are added.
