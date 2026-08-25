# GPUBridge / ColabGen Frontend

Next.js UI for [ColabGen API](https://colabgen.onrender.com). The browser talks **only** to Express — auth, jobs, and generate. Supabase stays on the server.

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev   # http://localhost:3001
```

Only env needed: `NEXT_PUBLIC_API_BASE_URL=https://colabgen.onrender.com`

## Deploy (Netlify)

1. Import private repo `ColabGen-Frontend`
2. Env: `NEXT_PUBLIC_API_BASE_URL=https://colabgen.onrender.com`
3. On Render API: `CORS_ORIGIN=https://colabgen.netlify.app`

## API used by the UI

| Call | Path |
|------|------|
| Signup | `POST /auth/signup` |
| Login | `POST /auth/login` |
| Me | `GET /auth/me` |
| Generate | `POST /generate/image\|video` → poll `GET /jobs/:id` |
| History | `GET /jobs` |

Docs: [`docs/FRONTEND.md`](docs/FRONTEND.md)
