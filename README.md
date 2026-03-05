This is a Next.js frontend connected to the backend API through a local proxy route.

## Getting Started

1) Start backend + PostgreSQL first:

```bash
cd ../backend-repo
npm run docker:up
```

2) Start frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:3001`.

## Environment

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
BACKEND_API_URL=http://localhost:3000
```

The frontend uses:
- `/api/users` (Next route handler proxy)
- backend target from `BACKEND_API_URL` (or fallback `NEXT_PUBLIC_API_BASE_URL`)

## Test Flow

1) Open `http://localhost:3001`.
2) Create a user from the UI form.
3) Confirm list updates from backend data.

## Scripts

- `npm run dev` -> Next dev server on port `3001`
- `npm run build` -> production build
- `npm run start` -> production server on port `3001`
