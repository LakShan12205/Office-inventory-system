# Office Workstation Inventory Management System

Full-stack MVP for managing 12 office workstations, asset assignments, machine repairs, temporary replacement machines, and automatic alert tracking.

## Project Structure

```text
.
|-- apps/
|   |-- api/
|   |   |-- prisma/
|   |   |   |-- schema.prisma
|   |   |   `-- seed.ts
|   |   `-- src/
|   |       |-- app.ts
|   |       |-- config/
|   |       |-- db/
|   |       |-- middleware/
|   |       `-- modules/
|   |           |-- alerts/
|   |           |-- assets/
|   |           |-- dashboard/
|   |           |-- repairs/
|   |           |-- replacements/
|   |           |-- shared/
|   |           `-- workstations/
|   `-- web/
|       `-- src/
|           |-- app/
|           |   |-- alerts/
|           |   |-- assets/
|           |   |-- dashboard/
|           |   |-- repairs/
|           |   |-- replacements/
|           |   `-- workstations/
|           |-- components/
|           |   |-- forms/
|           |   |-- layout/
|           |   `-- ui/
|           `-- lib/
|-- package.json
`-- README.md
```

## Stack

- Frontend: Next.js App Router, TypeScript, Tailwind CSS
- Backend: Express in `apps/api`
- Database: PostgreSQL
- ORM: Prisma

## Core Features

- Dashboard with workstation, asset, repair, replacement, and overdue metrics
- Workstation list and workstation detail pages
- Asset list and individual asset history pages
- Machine repair management with full repair history
- Temporary replacement tracking linked to repairs
- Automatic alerts for overdue repairs, active replacements, returned originals, incomplete records, and repeated repairs
- Search and filters for workstation code, asset code, serial number, type, status, and alert priority

## Environment

Root `.env` should include:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/workstation_inventory"
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
PORT=4000
USE_MOCK_DATA=true
```

`USE_MOCK_DATA=true` is the default development mode. It serves in-memory dummy office data through the same API contracts used by the Prisma/PostgreSQL implementation.

## Run Locally With Dummy Data First

1. Install dependencies.

```bash
npm install
```

2. Make sure `USE_MOCK_DATA=true` in `.env`.

3. Start both apps.

```bash
npm run dev
```

4. Open:

- Web: `http://localhost:3000`
- API health: `http://localhost:4000/health`

## Switch To Real PostgreSQL Later

1. Set `USE_MOCK_DATA=false` in `.env`.

2. Generate the Prisma client.

```bash
npm run db:generate
```

3. Apply the Prisma schema to PostgreSQL.

```bash
npm run db:migrate
```

4. Seed the database with 12 workstations and sample repair/replacement scenarios.

```bash
npm run db:seed
```

5. Start both apps.

```bash
npm run dev
```

## Useful Routes

- `/dashboard`
- `/workstations`
- `/workstations/[id]`
- `/assets`
- `/assets/[id]`
- `/repairs`
- `/repairs/new`
- `/alerts`
- `/replacements`

## Notes

- The seed script intentionally includes:
  - one machine currently in repair
  - one overdue repair
  - one workstation using a temporary replacement
  - one original returned but replacement still active
  - one repeated-repair warning case
- The API supports two modes behind the same route layer:
  - mock mode for dummy office data and UI-first development
  - Prisma/PostgreSQL mode for real office data later
- Automatic alerts are recalculated by the API when dashboard, workstation, repair, replacement, and alert endpoints are queried.
- Important history is preserved through status changes and dated assignment records rather than hard deletion.
