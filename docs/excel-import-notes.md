# Excel Import Notes

The uploaded workbook appears to use:

- One sheet per store or monitored group
- Row 4 for date headers
- Four columns per date:
  - store employee
  - in/out
  - duration
  - EE employee
- Two rows per shift block:
  - start row with scheduled start time
  - second row with scheduled end time

## Import behavior currently implemented

- Reads `.xlsb` files from the `data` folder
- Parses weekly schedule rows from the time clock layout
- Creates or updates stores and monitored employees
- Creates schedules
- Imports actual observed in/out values into `time_entries`

## Known limitations

- Summary rows lower in the workbook are ignored
- Duration values are not yet stored separately
- Multi-sheet import works, but store-name normalization may need tuning if workbook titles vary
- Duplicate-name employees without stable employee codes may need manual cleanup

