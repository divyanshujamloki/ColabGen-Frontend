# GPUBridge / ColabGen Frontend

Next.js + TypeScript UI for [ColabGen API](https://colabgen.onrender.com): Supabase Auth, async image/video generation, job history.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3001
```

Production API: `https://colabgen.onrender.com` (async: **202** + poll `/jobs/:id`).

## Deploy on Render

1. Connect this GitHub repo → Blueprint (`render.yaml`) or **New Web Service**.
2. Build: `npm ci && npm run build` · Start: `npm start`
3. Env (required at **build** time):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://colabgen.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |

4. On the API Render service, set `CORS_ORIGIN` to this frontend’s URL.
5. Add the frontend URL in Supabase Auth redirect allowlist.

## Docs

[`docs/FRONTEND.md`](docs/FRONTEND.md)
