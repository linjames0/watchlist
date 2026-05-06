// GET  /api/state           → returns { edits, userRows }   (public)
// PUT  /api/state           → replaces state                (requires x-edit-password header)
import { kv } from "@vercel/kv";

const KEY = "watchlist:state";
const EMPTY = { edits: {}, userRows: [] };

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const state = await kv.get(KEY);
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(state || EMPTY);
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
    return;
  }

  if (req.method === "PUT") {
    const expected = process.env.EDIT_PASSWORD;
    if (!expected) {
      res.status(500).json({ error: "EDIT_PASSWORD env var is not set on the server" });
      return;
    }
    const provided = req.headers["x-edit-password"];
    if (provided !== expected) {
      res.status(401).json({ error: "wrong or missing password" });
      return;
    }
    try {
      // Vercel parses JSON body automatically when content-type is application/json
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const next = {
        edits:    (body.edits && typeof body.edits === "object" && !Array.isArray(body.edits)) ? body.edits : {},
        userRows: Array.isArray(body.userRows) ? body.userRows : [],
      };
      await kv.set(KEY, next);
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
    return;
  }

  res.setHeader("Allow", "GET, PUT");
  res.status(405).json({ error: "method not allowed" });
}
