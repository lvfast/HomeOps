# Environment

This document explains how the project environment is managed.

## Goal

The project should be reproducible.

Another machine should be able to run the project using only:

- The repository
- The documented setup commands
- The required environment variables

## Local environment

TBD

## Dependencies

All dependencies must be recorded in the appropriate file:

- Python: `requirements.txt`, `pyproject.toml`, or similar
- Node.js: `package.json` and lock file
- Docker: `Dockerfile` and `docker-compose.yml`

## Environment variables

Use `.env.example` to document required variables.

Never commit `.env`.

## Rebuild from scratch

TBD

When setup becomes real, document the exact steps here.
