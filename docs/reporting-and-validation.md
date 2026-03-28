# Reporting And Validation Plan

## Report generation logic

- Weekly report: group time entries by week, store, and employee
- 3-day report: rolling window filter with the same observation fields
- Violation report: filter by rule code, severity, store, and monitoring staff
- Monitoring staff performance report: counts of entries, violations, missing comments, and correction rate

## Export feature

- CSV export for quick spreadsheet use
- Excel export with separate sheets for entries and violations
- Printable report view in the frontend for manager review

## Validation and error handling

- Request payloads validated with Zod
- Business rule issues returned as structured warnings and errors
- Unexpected API failures handled by a shared Express error middleware
- Duplicate or invalid schedule conflicts blocked before persistence

## Future improvements

- Upload real employee photos to object storage
- Add schedule import from Excel
- Add live activity queue for monitoring staff
- Add supervisor approval workflow for disputed entries
- Add timezone-aware store calendars and daylight-saving handling
- Add audit screens and staff productivity analytics

