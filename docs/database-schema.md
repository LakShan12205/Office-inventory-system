# Database Schema Summary

## Main entities

- `roles`: Admin, Manager, Monitoring Employee
- `users`: Sri Lanka office users
- `stores`: monitored retail stores
- `monitored_employees`: US store employees being watched on CCTV
- `monitored_employee_photos`: employee photos and references
- `store_assignments`: which monitoring staff can work which stores
- `schedules`: planned store employee shifts
- `time_entries`: actual observed and official adjusted times
- `violations`: rule warnings and blocking mistakes
- `comments`: operator notes linked to time entries
- `rule_configs`: configurable thresholds and flags
- `audit_logs`: traceability for admin actions

## Key behavior modeled

- Schedules store `scheduled_in_at` and `scheduled_out_at`
- Time entries store both `actual_*` and `official_*` timestamps
- Violations store rule code, severity, auto-generated message, and whether resolved
- Rule configuration allows future changes without rewriting core logic

