# Watchlist

Cream-and-ink editable spreadsheet of AI-infrastructure tickers (semis, hyperscalers, ODMs, power, photonics, networking) with 1D / 5D / 1M / 6M / 1Y % changes pulled from massive.com. Notes, Buy/Sell, and Short/Long are shared across all visitors via Vercel KV; only people with the password can edit.

## Files

- `index.html` — the static page (UI + client logic)
- `api/proxy.js` — proxies the browser's market-data calls to massive.com (keeps the API key server-side)
- `api/fundamentals.js` — proxies fundamentals calls to Finnhub (P/E, EV/EBITDA, gross margin, FCF, etc.)
- `api/state.js` — GET/PUT the shared edits + user-added rows in Vercel KV
- `package.json` / `.env.example` / `.gitignore`

## Deploy to Vercel

1. **Push to GitHub.** Already done.

2. **Import** the repo at [vercel.com/new](https://vercel.com/new) — accept defaults (no build step).

3. **Add a KV store.** In the Vercel dashboard: Project → **Storage** → **Create Database** → Marketplace → **Upstash for Redis** (or "KV"). Connect it to the project. Vercel injects the connection env vars automatically.

4. **Set the secrets** in Project → Settings → Environment Variables:
   - `MASSIVE_API_KEY` — your massive.com key (prices + history)
   - `FINNHUB_API_KEY` — sign up free at [finnhub.io](https://finnhub.io); 60 calls/min covers the watchlist daily
   - `EDIT_PASSWORD` — the shared password that unlocks editing
   - (optional) `MASSIVE_BASE` — override the upstream API host

5. **Redeploy** so the new env vars take effect (Deployments → ⋯ → Redeploy).

Visitors land on a read-only view. To edit, click 🔒 unlock and enter the password — your browser remembers it. Notes, Buy/Sell, Short/Long, and added rows sync to KV and show up for everyone.

## Local dev

```sh
npm i -g vercel
vercel link
vercel env pull       # pulls MASSIVE_API_KEY, EDIT_PASSWORD, KV_* into .env.local
vercel dev            # http://localhost:3000
```

## How it works

- **Market data** — `/api/proxy?path=/v3/snapshot&...` handles current prices + 1-day change in one batched call; per-ticker daily aggregates fill 5D/1M/6M/1Y. Per-ticker history is cached in `localStorage` keyed by today's date so same-day reloads are instant.
- **Shared state** — edits and user-added rows live under the `watchlist:state` key in Vercel KV. The page `GET`s `/api/state` on load and debounce-`PUT`s the full state on every edit.
- **Auth** — `PUT /api/state` requires an `x-edit-password` header. Without it, edits silently revert. The password is set in env, not in code.

## Tweaks

- Change the seed list of tickers in the `SEED` array near the top of `<script>` in `index.html`.
- The `pickSnapshotPctPrice()` helper handles a few variants of the upstream JSON shape — extend if your account returns a different field layout.
- The proxy adds `s-maxage=300` so repeat hits across users don't burn your rate limit.
