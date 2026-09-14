# GPUBridge Frontend

Next.js client for the ColabGen Express API. **No direct Supabase calls from the browser.**

## Env

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://colabgen.onrender.com` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional. Set in the host dashboard, not in git. |

## Flows

- Auth → `POST /auth/signup` · `POST /auth/login` (API uses Supabase server-side; signup auto-confirms email to avoid rate limits)
- Generate → `POST /generate/*` then poll `GET /jobs/:id`
- History → `GET /jobs`

## Deploy

Netlify + `netlify.toml`. Set API `CORS_ORIGIN` to the Netlify URL.
