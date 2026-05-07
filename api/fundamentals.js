// GET /api/fundamentals?symbol=AAPL
// Proxies Finnhub's /stock/metric endpoint so the FINNHUB_API_KEY stays server-side.
export default async function handler(req, res) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "FINNHUB_API_KEY env var is not set on the server" });
    return;
  }
  const { symbol } = req.query || {};
  if (!symbol || typeof symbol !== "string") {
    res.status(400).json({ error: "missing 'symbol' query param" });
    return;
  }
  const sym = encodeURIComponent(symbol.trim().toUpperCase());
  const url = `https://finnhub.io/api/v1/stock/metric?symbol=${sym}&metric=all&token=${apiKey}`;
  try {
    const upstream = await fetch(url);
    const text = await upstream.text();
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    // fundamentals don't move intraday; cache hard
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=21600, stale-while-revalidate=86400");
    res.status(upstream.status).send(text);
  } catch (e) {
    res.status(502).json({ error: "upstream fetch failed", detail: String(e) });
  }
}
