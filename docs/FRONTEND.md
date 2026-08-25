# GPUBridge Frontend

Next.js (App Router) + TypeScript client for the GPUBridge Express API and Supabase Auth.

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
| `NEXT_PUBLIC_API_BASE_URL` | Express base URL, e.g. `http://localhost:3000` |

Frontend only uses public anon credentials. Express keeps service role, Cloudinary, and GPU worker secrets.

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

### Generate flow

1. Optional: `GET /health` — show GPU online/offline.
2. `POST /generate/image` or `POST /generate/video` with JSON body (see API contract).
3. Request stays open until Colab finishes and Cloudinary upload completes (synchronous).
4. Response: `{ id, type, status, url, seed, inferenceMs }`.
5. UI shows image or video preview; job also appears in history.

### History flow

1. Authenticated Supabase client selects from `public.jobs` ordered by `created_at` desc.
2. RLS policy `jobs_select_own` limits rows to `auth.uid() = user_id`.
3. Result URLs are Cloudinary links from successful jobs.

## API contract (Express)

Base: `NEXT_PUBLIC_API_BASE_URL` (default local `http://localhost:3000`).

Auth header for generate/jobs: `Authorization: Bearer <supabase_access_token>`.

Error shape: `{ "error": "string", "jobId"?: "uuid" }`.  
Validation: `400` `{ "error": "Invalid body", "details": ... }`.  
Unauthorized: `401`.

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | no | `{ ok, gpu }` |
| POST | `/generate/image` | yes | SDXL Turbo; steps 1–8 |
| POST | `/generate/video` | yes | ~2s clip; steps 10–40 |
| GET | `/jobs/:id` | yes | Own job only |

Full field tables: sibling repo [`GPUBridge/docs/API.md`](../../GPUBridge/docs/API.md). Swagger: `http://localhost:3000/docs`.

### Image body

| Field | Required | Constraints |
|-------|----------|-------------|
| `prompt` | yes | 1–2000 chars |
| `negative_prompt` | no | string |
| `steps` | no | 1–8, default 4 |
| `seed` | no | int |
| `width` / `height` | no | 256–1024, default 512 |
| `guidance_scale` | no | 0–15; use **0** for Turbo |

### Video body

| Field | Required | Constraints |
|-------|----------|-------------|
| `prompt` | yes | 1–2000 chars |
| `negative_prompt` | no | string |
| `steps` | no | 10–40, default 10 |
| `fps` | no | 4–12, default 8 |
| `seed` | no | int |

## Local run

Prerequisites:

1. Supabase project with `public.jobs` migration applied.
2. Express API running (`apps/api`, port 3000) with CORS allowing this origin.
3. Colab GPU worker + `GPU_WORKER_URL` when generating for real.

Frontend:

```bash
cd GPUBridge_frontend
cp .env.example .env.local   # fill values
npm install
npm run dev                  # http://localhost:3001
```

API (sibling):

```bash
cd GPUBridge/apps/api
npm run dev                  # http://localhost:3000
```

Set `CORS_ORIGIN=http://localhost:3001` on the API (or rely on the default local allowlist).

## Known limits

- Generate is **synchronous** — expect 10s+ for image, longer for video; keep the tab open.
- One Colab T4: do **not** run image and video at the same time (UI disables the other modality while generating).
- If `/health` shows `gpu.ok: false`, generation will fail until the worker/ngrok is back.
- History uses Supabase RLS directly; there is no Express `GET /jobs` list in v1.
- Email confirmation: if Supabase requires email confirm, users must confirm before sign-in works.
