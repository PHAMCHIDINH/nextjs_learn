This is a Next.js frontend connected directly to the backend API.

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
```

The frontend uses:
- direct browser/API calls to `NEXT_PUBLIC_API_BASE_URL`
- bearer token + cookie credentials for authenticated endpoints

## Test Flow

1) Open `http://localhost:3001`.
2) Register/login from `/auth`.
3) Upload images and create listing from `/post/new`.
4) Verify listing appears in `/dashboard`.

## Scripts

- `npm run dev` -> Next dev server on port `3001`
- `npm run build` -> production build
- `npm run start` -> production server on port `3001`
