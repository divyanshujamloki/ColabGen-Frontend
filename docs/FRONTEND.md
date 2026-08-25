# GPUBridge Frontend

Next.js (App Router) + TypeScript client for the GPUBridge / ColabGen Express API and Supabase Auth.

## Product overview

GPUBridge lets signed-in users generate images and short videos via a Colab GPU worker. The Express API authenticates Supabase JWTs, runs generation, uploads to Cloudinary, and stores jobs in Postgres. This frontend owns auth UI, generate forms, result preview, and job history.

## Page map

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Landing — brand, headline, CTA |
| `/login` | Public | Email/password sign in |
| `/signup` | Public | Email/password sign up |
| `/generate` | Auth | Image and video generation |
| `/history` | Auth | Own jobs list (Supabase RLS) |

## Environment

Copy `.env.example` → `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same project as the API (`SUPABASE_URL`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (never service_role) |
| `NEXT_PUBLIC_API_BASE_URL` | Express base — local `http://localhost:3000` or `https://colabgen.onrender.com` |

## Architecture

```
Browser
  → Next.js
      → Supabase Auth (signUp / signIn / session)
      → Express API (Bearer access_token)
          → Colab GPU → Cloudinary → jobs row
      → Supabase DB select on public.jobs (RLS: own rows only)
```

### Auth flow

1. User signs up or signs in via Supabase Auth (`@supabase/ssr`).
2. Session cookies are refreshed in Next middleware.
3. Protected routes (`/generate`, `/history`) redirect to `/login` if unauthenticated.
4. Generate calls send `Authorization: Bearer <access_token>` from the session.

### Generate flow (async — production / Render)

Production API uses `ASYNC_GENERATION=1` (default when `NODE_ENV=production`):

1. Optional: `GET /health` — show GPU online/offline.
2. `POST /generate/image|video` → **202** `{ id, type, status: "running" }`.
3. Poll `GET /jobs/:id` every ~2s until `status` is `succeeded` or `failed`.
4. On success, media is at **`result_url`** (snake_case on the job row).
5. Local sync mode (`ASYNC_GENERATION=0`) may still return **200** with `{ url, … }` — the client handles both.

### History flow

1. Authenticated Supabase client selects from `public.jobs` ordered by `created_at` desc.
2. RLS policy `jobs_select_own` limits rows to `auth.uid() = user_id`.
3. Result URLs are Cloudinary links from successful jobs.

## API contract (Express)

Base: `NEXT_PUBLIC_API_BASE_URL` (production: `https://colabgen.onrender.com`).

Auth: `Authorization: Bearer <supabase_access_token>`.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | no | `{ ok, gpu }` |
| POST | `/generate/image` | yes | **202** async or **200** sync |
| POST | `/generate/video` | yes | same |
| GET | `/jobs/:id` | yes | Poll until done; use `result_url` |

Swagger: https://colabgen.onrender.com/docs

## Local run

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3001
```

Set API `CORS_ORIGIN` to include `http://localhost:3001` when developing against the live API.

## Deploy (Render)

1. Push this repo; Render → **New** → **Blueprint** (`render.yaml`).
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` before build.
3. On API service, set `CORS_ORIGIN` to the frontend URL.
4. Add frontend URL to Supabase Auth Site URL / Redirect URLs.

## Known limits

- Production generate is **async** — UI polls `/jobs/:id` (up to ~10 minutes).
- One Colab T4: do not run image and video at the same time.
- Render free tier sleeps after idle; first request may cold-start.
- No Express `GET /jobs` list — history uses Supabase RLS.
