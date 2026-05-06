// Vercel serverless function: proxy to massive.com that injects the API key.
// Used by the static index.html so the key never ships to the browser.
export default async function handler(req, res) {
  const apiKey = process.env.MASSIVE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "MASSIVE_API_KEY env var is not set on the server" });
    return;
  }
  const base = (process.env.MASSIVE_BASE || "https://api.massive.com").replace(/\/$/, "");

  const { path, ...rest } = req.query || {};
  if (!path || typeof path !== "string" || !path.startsWith("/")) {
    res.status(400).json({ error: "missing or invalid 'path' query param (must start with /)" });
    return;
  }

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) {
    if (v === undefined || v === null) continue;
    params.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  // include key as both query param (most common for these APIs) and header (fallback)
  params.set("apiKey", apiKey);
  const url = base + path + (params.toString() ? `?${params.toString()}` : "");

  try {
    const upstream = await fetch(url, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    const text = await upstream.text();
    const ct = upstream.headers.get("content-type") || "application/json";
    res.setHeader("Content-Type", ct);
    // small CDN cache so reloads don't burn the rate limit
    res.setHeader("Cache-Control", "public, max-age=120, s-maxage=300, stale-while-revalidate=600");
    res.status(upstream.status).send(text);
  } catch (e) {
    res.status(502).json({ error: "upstream fetch failed", detail: String(e) });
  }
}
