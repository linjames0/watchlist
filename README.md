# Companies — AI Infrastructure Watchlist

Editable cream-and-ink spreadsheet of ~50 AI-infrastructure tickers (semis, hyperscalers, ODMs, power, photonics, networking) with 1D / 5D / 1M / 6M / 1Y % changes pulled from massive.com.

## Files

- `index.html` — the static page (UI + client logic)
- `api/proxy.js` — Vercel serverless function that proxies to massive.com so the API key stays server-side
- `package.json` / `.gitignore` / `.env.example`

## Deploy to Vercel

1. **Push these files** to `github.com/linjames0/companies`:
   ```sh
   git clone https://github.com/linjames0/companies.git
   cd companies
   # copy the contents of this folder into the repo
   git add .
   git commit -m "watchlist"
   git push
   ```

2. **Import the repo** at [vercel.com/new](https://vercel.com/new) — keep all defaults (no build step).

3. **Set the env var** in Vercel → Project → Settings → Environment Variables:
   - Name: `MASSIVE_API_KEY`
   - Value: your massive.com key
   - (Optional) `MASSIVE_BASE` if your account uses a non-default host

4. **Deploy.** Visit the URL — the page calls `/api/proxy` which forwards to massive with the key attached.

## Local dev

```sh
npm i -g vercel
vercel env add MASSIVE_API_KEY     # paste your key
vercel dev
```

Then open http://localhost:3000.

## How it works

- `index.html` renders the table, loads cell edits from `localStorage`, then calls `/api/proxy?path=/v3/snapshot&...` for current prices and `/api/proxy?path=/v2/aggs/ticker/<T>/range/1/day/<from>/<to>` for each ticker's daily history.
- Per-ticker history is cached in `localStorage` keyed by today's date — same-day reloads are instant; a new day triggers a fresh fetch.
- The proxy attaches the API key as both `?apiKey=` and `Authorization: Bearer <key>` so it works regardless of which auth scheme the upstream prefers.

## Notes

- The proxy adds a CDN cache header (`s-maxage=300`) so repeat hits across users don't burn your rate limit.
- If your massive plan returns the snapshot in a slightly different JSON shape, `pickSnapshotPctPrice()` in `index.html` already accepts several variants — extend it there if needed.
