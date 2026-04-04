# Office Workstation Inventory Management System

Presentation-ready office inventory demo built with `Next.js`, `TypeScript`, and `Tailwind CSS`.

This project is currently configured as a `dummy-data demo only`. It uses in-memory mock office data and local Next.js API routes inside `apps/web`. No real database is required to run the current demo.

## Current Demo Scope

The system is designed around office workstation operations and includes:

- workstation-based inventory tracking
- individual asset tracking with asset codes and serial numbers
- repair logging and repair history
- replacement asset management
- alert tracking
- workstation-first replacement workflow with flow grouping

## Demo Modules

- `Dashboard`
  - office overview
  - machines in repair
  - active replacements
  - follow-up alerts
  - latest alerts
  - recent repair activity
- `Workstations`
  - workstation list
  - workstation detail
  - assigned assets
  - workstation repair history
- `Assets`
  - asset list
  - asset detail page
  - add asset form
  - filtering, search, and pagination
- `Repairs`
  - repair list
  - new repair form
  - workstation-linked repair workflow
- `Replacements`
  - flow-based replacement list
  - compact rows like `Flow-01 | WS-11 | Monitor`
  - details panel with actions
  - returned replacement history kept for demo purposes
- `Alerts`
  - alert summary
  - review actions
  - mark as read / dismiss flow in mock mode

## Current Project Structure

```text
.
|-- apps/
|   |-- api/
|   |   |-- prisma/
|   |   |-- src/
|   |   `-- ...
|   `-- web/
|       `-- src/
|           |-- app/
|           |   |-- alerts/
|           |   |-- api/
|           |   |-- assets/
|           |   |-- dashboard/
|           |   |-- repairs/
|           |   |-- replacements/
|           |   `-- workstations/
|           |-- components/
|           |   |-- alerts/
|           |   |-- forms/
|           |   |-- layout/
|           |   |-- replacements/
|           |   `-- ui/
|           `-- lib/
|-- package.json
`-- README.md
```

## Tech Stack

- Frontend: `Next.js App Router`
- Language: `TypeScript`
- Styling: `Tailwind CSS`
- Demo API: `Next.js Route Handlers`
- Data mode: `in-memory mock office data`
- Monorepo: `npm workspaces`

## Dummy Data Model

The demo currently uses realistic office dummy data for:

- 12 workstations
- workstation-linked assets
- repair records
- replacement records
- alert records

The replacement workflow supports demo scenarios such as:

- active temporary replacement
- returned replacement
- overdue repair with replacement
- permanent replacement case

## Replacement Workflow

The replacements module now follows a workstation-first workflow.

### Flow rules

- `Flow-01` = `WS-07` to `WS-12`
- `Flow-02` = `WS-01` to `WS-06`

### Main list behavior

Each replacement row stays compact and simple:

- `[Flow-01] | WS-11 | Monitor`
- `[Flow-02] | WS-03 | Machine`

Only the flow is shown as a colored badge in the main row.

### Details panel behavior

Clicking a row opens a details panel showing:

- original asset code
- replacement asset code
- assigned user
- reason
- issued date
- return date
- current status
- current location

### Replacement actions

Available actions in the details panel:

- `New Replacement`
- `Change Replacement`
- `Mark Returned`
- `View Details`

### Business rule in demo mode

When the original repaired asset returns:

- the replacement record is not deleted
- the replacement is marked as `RETURNED` or `CLOSED`
- the return date is stored in demo state
- the replacement asset is moved back to store in demo state
- replacement history remains visible for presentation

## Assets Module Notes

The assets page supports:

- search by asset code, serial number, brand, and model
- type, status, and location filtering
- quick category filter buttons
- pagination with URL state
- add asset form
- asset detail page with history sections

## Repairs Module Notes

The repairs module supports:

- new repair creation
- workstation-linked repair logging
- machine selection from available assets
- optional replacement linkage in the demo flow

## Dashboard Notes

The dashboard is structured as:

- hero section
- KPI cards
- quick actions
- recent repair activity
- latest alerts

It is optimized for presentation and uses the same dummy data contracts as the rest of the demo.

## Environment

For the current demo, root `.env` can stay minimal:

```env
USE_MOCK_DATA=true
```

Optional:

```env
NEXT_PUBLIC_API_URL=
```

For this demo setup:

- keep `USE_MOCK_DATA=true`
- leave `NEXT_PUBLIC_API_URL` empty unless you explicitly want an external API

## Run Locally

1. Open the project folder:

```powershell
cd "C:\Users\ASUS\Documents\New project"
```

2. Install dependencies:

```powershell
npm install
```

3. Start the web demo:

```powershell
npm.cmd run dev -w apps/web
```

4. Open in browser:

- [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

## Main Demo Routes

- `/dashboard`
- `/workstations`
- `/workstations/[id]`
- `/assets`
- `/assets/new`
- `/assets/[id]`
- `/repairs`
- `/repairs/new`
- `/alerts`
- `/replacements`

## Important Demo Notes

- this demo does not require PostgreSQL
- this demo does not require Prisma migrations
- the current presentation workflow runs entirely from mock data
- mock changes are stored in memory during the running session only
- restarting the app resets the dummy data back to its seeded state

## Future Expansion

The repository still contains `apps/api` and Prisma-related structure for future expansion, but the current demo should be treated as:

- `web-only`
- `dummy-data only`
- `presentation-focused`

That keeps the project simple and safe for demos while preserving a path for real backend integration later if needed.
