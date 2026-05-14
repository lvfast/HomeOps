# Learning Log

Use this file to record what you learned after each task.

## 2026-05-14

### What we worked on

We reviewed the current HomeOps project state and updated the project roadmap.

### What changed

We decided to move from very small technical PRs to larger feature-slice PRs.

The new roadmap is documented in `docs/06-milestones.md`.

### Commands used

```bash
rg --files
git status --short --branch
npm.cmd test
```

### Concepts learned

- A feature slice is one Pull Request that delivers a meaningful product
  capability end to end.
- A micro refactor is a very small technical cleanup that may not create visible
  product value by itself.
- HomeOps should now prioritize domain progress: Service, HealthCheck,
  Incident, Alert, Metrics, and Dashboard.

### What confused me

TBD

### Questions to revisit

- Should the first database PR use Prisma only, or also introduce a repository
  layer?
- Should the scheduler start simple with a worker loop before BullMQ?

### Next tiny step

Start PR 1: runtime configuration and database foundation.

## Entry template

### Date

YYYY-MM-DD

### What we worked on

TBD

### What changed

TBD

### Commands used

```bash
TBD
```

### Concepts learned

TBD

### What confused me

TBD

### Questions to revisit

TBD

### Next tiny step

TBD
