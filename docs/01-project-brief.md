# HomeOps — Mini SRE Platform

HomeOps is a self-hosted mini SRE platform for monitoring personal services running on a homelab or VPS.

The goal is to build a production-like monitoring and incident management system, not just a CRUD dashboard.

## Main idea

Users can register services they want to monitor, such as:

- API server
- Frontend app
- Database admin page
- Grafana
- Self-hosted tools
- Any HTTP endpoint with a health check URL

The system will periodically check these services in the background. If a service fails several times in a row, HomeOps marks it as DOWN, creates an incident, records a timeline, and sends an alert. When the service recovers, HomeOps automatically resolves the incident and records the downtime duration.

## Core flow

1. User adds a service with:
   - name
   - health check URL
   - expected status code
   - check interval
   - timeout
   - failure threshold

2. Background worker checks the service periodically.

3. Each health check result is saved:
   - success or failure
   - HTTP status code
   - response time
   - error message if failed
   - timestamp

4. If the service fails N times in a row:
   - mark service as DOWN
   - create an incident
   - add incident timeline event
   - send Telegram or Discord alert

5. If a DOWN service becomes healthy again:
   - mark service as UP
   - resolve the open incident
   - calculate downtime duration
   - add timeline event
   - send recovery alert

## MVP features

### Authentication

Basic login/register system.

### Service management

Users can:

- create service
- edit service
- delete service
- pause/resume monitoring
- view service status

### Health check system

A background worker periodically checks all active services.

The worker should support:

- HTTP GET check
- timeout handling
- expected status code validation
- response time measurement
- consecutive failure counting

### Incident management

Incidents are created automatically when a service is considered down.

Incident statuses:

- OPEN
- ACKNOWLEDGED
- RESOLVED

Incident severities:

- SEV1
- SEV2
- SEV3

Each incident should have a timeline.

### Alerting

Send alert when:

- incident is created
- incident is resolved

Use Telegram Bot or Discord Webhook.

Avoid alert spam. Do not send an alert for every failed check.

### Dashboard

The dashboard should show:

- total services
- services up
- services down
- open incidents
- recent incidents
- service status list
- recent health checks

### Service detail page

Show:

- current status
- URL
- uptime percentage
- average response time
- recent health checks
- incident history

### Public status page

A simple public page that shows the current status of all monitored services.

Example:

- API Server: Operational
- Dashboard: Operational
- Grafana: Major Outage

## Suggested tech stack

Frontend:

- Next.js
- Tailwind CSS

Backend:

- NestJS
- Prisma
- PostgreSQL

Worker / Queue:

- Redis
- BullMQ

Deployment:

- Docker Compose

Notification:

- Telegram Bot or Discord Webhook

## Main database entities

### User

- id
- email
- passwordHash
- createdAt

### Service

- id
- userId
- name
- url
- expectedStatusCode
- intervalSeconds
- timeoutSeconds
- failureThreshold
- currentStatus
- consecutiveFailures
- isActive
- lastCheckedAt
- lastSuccessAt
- lastFailureAt
- createdAt
- updatedAt

### HealthCheck

- id
- serviceId
- status
- statusCode
- responseTimeMs
- errorMessage
- checkedAt

### Incident

- id
- serviceId
- title
- severity
- status
- startedAt
- resolvedAt
- durationSeconds
- createdAt
- updatedAt

### IncidentEvent

- id
- incidentId
- type
- message
- metadata
- createdAt

### Notification

- id
- incidentId
- channel
- status
- errorMessage
- sentAt

## Important system design requirements

This project should demonstrate system thinking.

It should include:

- background jobs instead of doing checks inside API requests
- failure threshold to avoid false positives
- incident state machine
- alert deduplication
- health check history
- automatic recovery detection
- Docker-based deployment
- clear README and architecture explanation

## What makes this project different from a CRUD app

HomeOps is not just about creating and editing records.

It simulates real production concerns:

- service downtime
- monitoring
- alerting
- incident lifecycle
- recovery tracking
- uptime metrics
- background processing
- system reliability

## Initial version scope

Build HomeOps v1 with:

- auth
- service CRUD
- background health checks
- health check history
- auto incident creation
- auto incident resolution
- incident timeline
- Telegram or Discord alerts
- dashboard
- public status page
- Docker Compose setup