# Glossary

This file explains technical terms used in the project.

## Repository

A folder managed by Git. It stores code and history.

## Commit

A saved snapshot of changes in Git.

## Branch

A separate line of work in Git.

## Pull Request

A request to merge changes from one branch into another, usually after review.

## Issue

A task, bug, or feature request tracked in GitHub.

## CI

Continuous Integration. A system that automatically runs checks such as tests and builds.

## Environment variable

A configuration value provided outside the code, often used for secrets or environment-specific settings.

## `.env`

A local file containing environment variables. It should not be committed.

## `.env.example`

A safe example file showing which environment variables are needed.

## Dependency

A library or package that the project needs in order to run.

## Lint

A tool that checks code style and common mistakes.

## Test

A check that verifies code behaves as expected.

## CRUD

Create, Read, Update, Delete. These are the four basic operations for managing
records such as HomeOps services.

## Validation

Checking input before using it. For example, HomeOps validates that a service
URL is an HTTP or HTTPS URL before saving it.

## Health check

A check that asks whether a service is healthy. In HomeOps, the first health
check type sends an HTTP GET request to the service URL.

## Service status

The current health state of a monitored service. HomeOps currently uses
`UNKNOWN`, `UP`, and `DOWN`.

## State transition

A change from one state to another. For example, a service can transition from
`UP` to `DOWN` after enough failed health checks.

## Consecutive failures

Failed checks in a row. HomeOps resets this number to `0` after a successful
health check.

## Failure threshold

The number of consecutive failed checks required before HomeOps marks a service
as `DOWN`.

## Worker

A part of the application that does background work without waiting for a user
to call an API endpoint. In HomeOps, the first worker automatically checks
active services.

## Scheduler

Logic that runs work on a repeated schedule. In HomeOps, the scheduler wakes up
every few seconds and looks for services that are due for a health check.

## Polling

Checking something repeatedly at an interval. HomeOps uses polling to look for
services that need a new health check.

## Incident

A recorded outage or problem. In HomeOps, an incident is created when a service
becomes `DOWN`.

## Incident lifecycle

The path an incident follows from open to resolved. HomeOps currently supports
`OPEN`, `ACKNOWLEDGED`, and `RESOLVED`.

## Incident timeline

The event history of an incident. For example, HomeOps records when an incident
was created, acknowledged, and resolved.

## Acknowledge

Marking that someone has seen the incident and knows it needs attention. This
does not mean the service has recovered.

## Resolve

Marking that the incident is finished. In HomeOps, recovery from `DOWN` to `UP`
automatically resolves the active incident for that outage.

## Notification

A record of an alert attempt. HomeOps stores notification records so it can see
whether an incident alert was sent, failed, or skipped.

## Webhook

A URL that accepts an HTTP request from another system. HomeOps uses a Discord
Webhook URL to send incident alerts into a Discord channel.

## Alert

A message sent to tell someone that something important happened. In HomeOps,
alerts are sent when incidents open or resolve.

## Response time

How long a request takes to receive a response. HomeOps stores response time in
milliseconds.

## Uptime percentage

The percentage of health checks that succeeded in a selected time range. For
example, if 9 out of 10 checks succeed, uptime is 90%.

## Metrics

Numbers that summarize system behavior. In HomeOps, metrics include uptime
percentage, average response time, total checks, successful checks, and failed
checks.

## Dashboard summary

A small API response that gives the future dashboard enough data to show the
current system overview.

## Public status

A safe status view for people who only need to know whether active services are
operational, unknown, or in outage.

## Timeout

The maximum time HomeOps waits for a service to respond before marking that
check as failed.

## Docker

A tool for packaging an application with its runtime environment.

## Docker Compose

A tool for running multiple containers together using a `docker-compose.yml`
file. In HomeOps, it is used to start PostgreSQL and Redis for local
development.

## Container

A running isolated environment created from a Docker image.

## PostgreSQL

A relational database. HomeOps will use it to store services, health checks,
incidents, and notifications.

## Redis

An in-memory data store. HomeOps will use it later for background jobs and
queues.

## Prisma

A database toolkit for Node.js. HomeOps uses it to define the database schema,
create migrations, and generate a database client.

## Migration

A versioned database change. It records how the database structure changes over
time.

## Deployment

The process of putting an application onto a server so it can run outside your local machine.

## Rollback

Returning to a previous working version when a new version has problems.

## Runbook

A document that explains how to operate, debug, backup, restore, or recover a system.
