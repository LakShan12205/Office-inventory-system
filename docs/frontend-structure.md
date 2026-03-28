# Frontend Structure

## Pages

- `/login`: user sign-in
- `/dashboard`: admin and manager summary cards
- `/stores`: store master data view
- `/employees`: employee photo directory
- `/observations`: sample fast-entry screen for Phase 2

## Main components

- `components/providers/auth-provider.tsx`: client auth state
- `components/layout/protected.tsx`: redirects unauthenticated users
- `components/layout/app-shell.tsx`: sidebar and layout shell
- `components/auth/login-form.tsx`: login form and token storage

## UX direction

- Large touch-friendly controls for fast entry
- High-contrast warning colors for rule issues
- Pink state reserved for early-out scenarios
- Employee photo panel alongside shift details for identity support

