# GPUBridge / ColabGen Frontend

Next.js UI for [ColabGen API](https://colabgen.onrender.com). The browser talks **only** to Express — auth, jobs, and generate. Supabase stays on the server.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3001
```

Env:

- `NEXT_PUBLIC_API_BASE_URL=https://colabgen.onrender.com` (required)
- `NEXT_PUBLIC_SUPPORT_EMAIL` (optional; set in the host dashboard, not in git)

## Deploy (Netlify)

1. Import the repo
2. Env: `NEXT_PUBLIC_API_BASE_URL=https://colabgen.onrender.com`
3. Optional: `NEXT_PUBLIC_SUPPORT_EMAIL` in the Netlify UI (do not commit it)
4. On Render API: `CORS_ORIGIN=https://colabgen.netlify.app`

## Before making this repo public

- [ ] Confirm `.env.local` and real secrets are untracked (`git status`, `git log --all -- .env .env.local`)
- [ ] Keep backend secrets (Supabase service role, DB URLs, worker keys) only on the API host
- [ ] Never prefix service keys with `NEXT_PUBLIC_` — those values ship to the browser
- [ ] Set `NEXT_PUBLIC_SUPPORT_EMAIL` in Netlify if you want a public contact; leave it unset to hide the address

## API used by the UI

| Call | Path |
|------|------|
| Signup | `POST /auth/signup` |
| Login | `POST /auth/login` |
| Me | `GET /auth/me` |
| Generate | `POST /generate/image\|video` → poll `GET /jobs/:id` |
| History | `GET /jobs` |

Docs: [`docs/FRONTEND.md`](docs/FRONTEND.md)
