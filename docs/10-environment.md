# Environment

This document explains how the project environment is managed.

## Goal

The project should be reproducible.

Another machine should be able to run the project using only:

- The repository
- The documented setup commands
- The required environment variables

## Local environment

Local development uses:

- Node.js and npm for the backend API
- Docker Compose for PostgreSQL and Redis
- Prisma for database schema and migrations

The usual setup flow is:

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:migrate
npm start
```

On Windows PowerShell, if `npm test` is blocked by execution policy, use:

```bash
npm.cmd test
```

## Dependencies

All dependencies must be recorded in the appropriate file:

- Python: `requirements.txt`, `pyproject.toml`, or similar
- Node.js: `package.json` and lock file
- Docker: `Dockerfile` and `docker-compose.yml`

Current Node.js dependencies are recorded in:

- `package.json`
- `package-lock.json`

Current Docker services are recorded in:

- `docker-compose.yml`

## Environment variables

Use `.env.example` to document required variables.

Never commit `.env`.

Current variables:

- `NODE_ENV`: app environment, such as `development`
- `APP_PORT`: HTTP port for the API
- `DATABASE_URL`: PostgreSQL connection URL used by Prisma
- `REDIS_URL`: Redis connection URL for future background jobs

## Rebuild from scratch

To rebuild the local environment from scratch:

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis
npm run prisma:migrate
npm run prisma:generate
npm.cmd test
```

If Docker commands fail, first check that Docker Desktop is running.
