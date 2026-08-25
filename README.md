# GPUBridge / ColabGen Frontend

Next.js + TypeScript UI for [ColabGen API](https://colabgen.onrender.com): Supabase Auth, async image/video generation, job history.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3001
```

Production API: `https://colabgen.onrender.com` (async: **202** + poll `/jobs/:id`).

## Deploy on Netlify (private repo OK)

Netlify’s free plan **can** deploy from a **private** GitHub repo — authorize Netlify when connecting the repo.

1. [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project** → GitHub → `ColabGen-Frontend` (private is fine).
2. Build settings are in `netlify.toml` (`npm run build`, publish `.next`). Netlify auto-detects Next.js 16.
3. **Site configuration → Environment variables** (needed at **build** time):

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://colabgen.onrender.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

4. Deploy. You’ll get a URL like `https://something.netlify.app`.
5. On the **API** (Render): set `CORS_ORIGIN` to that Netlify URL (comma-list OK, or `*` while testing).
6. Supabase Auth → URL config: add the Netlify URL to Site URL / Redirect URLs.

## Docs

[`docs/FRONTEND.md`](docs/FRONTEND.md)
