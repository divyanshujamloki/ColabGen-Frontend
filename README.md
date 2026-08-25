# GPUBridge Frontend

Professional Next.js + TypeScript UI for [GPUBridge](../GPUBridge): Supabase Auth, image/video generation, and job history.

## Quick start

1. Copy env and fill values (same Supabase project as the API):

   ```bash
   cp .env.example .env.local
   ```

2. Install and run (port **3001** so it does not clash with the API on 3000):

   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3001](http://localhost:3001).

4. Keep the Express API running (`GPUBridge/apps/api`, port 3000) with CORS allowing `http://localhost:3001`, and the Colab worker up when generating.

## Docs

Full architecture, flows, and API contract: [`docs/FRONTEND.md`](docs/FRONTEND.md).

Backend API reference: [`GPUBridge/docs/API.md`](../GPUBridge/docs/API.md).

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Auth (`@supabase/ssr`)
- Express generate API (Bearer JWT)
