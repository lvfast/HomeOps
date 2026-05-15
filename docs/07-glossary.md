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
