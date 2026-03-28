# Architecture Overview

## High-level design

- `apps/web`: Next.js frontend for dashboards, data entry, and reports
- `apps/api`: Express API for auth, RBAC, master data, schedules, time entries, rule validation, and exports
- `PostgreSQL`: source of truth for users, schedules, observed entries, violations, and audit logs

## Core backend modules

- `auth`: register, login, token issuance, current-user lookup
- `users`: user management and role assignment
- `stores`: store CRUD and activation status
- `employees`: monitored US retail employee directory with photos
- `schedules`: weekly schedules and shift assignment
- `observations`: manual observation entry with actual and official times
- `rules`: modular rule engine and validation pipeline
- `violations`: mistake detection, filtering, dashboards
- `reports`: weekly, 3-day, store-wise, and staff performance exports

## Rule engine approach

- Input: schedule row, actual observed event, existing nearby shifts, configurable thresholds
- Processing: run a list of independent rule handlers
- Output:
  - normalized official times
  - warnings
  - blocking errors
  - persisted violations

Each rule handler receives the same context and returns a structured result. New rules can be added without changing the observation controller.

## Security

- Passwords hashed with bcrypt
- JWT-based authentication for API requests
- Role-based authorization at route level
- Audit log records for sensitive actions

