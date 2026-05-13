# HomeOps

HomeOps is a self-hosted mini SRE platform for monitoring personal services running on a homelab or VPS.

The goal is to build a production-like monitoring and incident management system, not just a CRUD dashboard.

## Current Status

This repository is currently in the beginner setup phase.

At this stage, the project focuses on:

- documenting the product idea
- learning Git and GitHub workflow
- defining small milestones
- building the project step by step

The application code has not been built yet.

## Intended MVP

The first useful version of HomeOps should let a user:

- register and log in
- add services to monitor
- run HTTP health checks in the background
- save health check history
- mark services as up or down
- create and resolve incidents automatically
- send an alert when an incident opens or resolves
- view a dashboard and a public status page

## Important Documents

- `PROJECT_BRIEF.md`: product idea, MVP scope, suggested stack, and main entities
- `AGENTS.md`: mentoring and engineering rules for working on this repo
- `docs/`: beginner-friendly workflow, architecture notes, glossary, runbook, and milestones
- `docs/learning-log.md`: place to record what was learned after each task

## Repository Structure

This repository currently contains documentation and project workflow files.

- `.github/`: GitHub templates and workflow configuration
- `.env.example`: safe example of environment variables the project may need
- `.gitignore`: tells Git which local files should not be committed
- `AGENTS.md`: rules for how Codex should mentor and work in this repo
- `GLOBAL_AGENTS.md`: broader agent instructions copied into the project
- `PROJECT_BRIEF.md`: main product brief for HomeOps
- `README.md`: quick entry point for understanding the project
- `docs/`: detailed learning, workflow, architecture, and operations notes

The app source code will be added later, after the repository foundation is clear.

## Learning Workflow

HomeOps is built with small, reviewable tasks.

For each task, the workflow is:

1. Understand the goal.
2. Define acceptance criteria.
3. Think about edge cases.
4. Create a Git branch.
5. Make the smallest useful change.
6. Verify the result.
7. Review the diff.
8. Commit with a Conventional Commit message.
9. Open a Pull Request.
10. Update the learning log.

## Next Step

The next tiny milestone is to keep improving the repository foundation before adding application code.

A good next task is to document the current repository structure so a beginner can understand what each file is for.
