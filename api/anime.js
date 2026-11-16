const UPSTREAM = "https://apii.nexadev.my.id/anime";
const ALLOWED = new Set(["recent", "completed", "search", "page", "details", "stream"]);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const incoming = new URL(req.url || "/api/anime", "https://arcvnmd.local");
    const target = new URL(UPSTREAM);
    for (const [key, value] of incoming.searchParams.entries()) {
      if (ALLOWED.has(key) && value !== "") target.searchParams.set(key, value);
    }

    // Empty search is not a search request; show the recent catalogue instead.
    const hasAction = ["recent", "completed", "search", "details", "stream"]
      .some(key => target.searchParams.has(key) && target.searchParams.get(key));
    if (!hasAction) target.searchParams.set("recent", "1");
    if (!target.searchParams.has("page") && !target.searchParams.has("details") && !target.searchParams.has("stream")) {
      target.searchParams.set("page", "1");
    }

    const upstream = await fetch(target.toString(), {
      method: "GET",
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 arcvnMD" },
      signal: AbortSignal.timeout(25000)
    });
    const body = await upstream.text();
    let data;
    try { data = JSON.parse(body); }
    catch {
      return res.status(502).json({
        success: false,
        message: "Nexadev mengembalikan respons non-JSON",
        upstreamStatus: upstream.status,
        preview: body.slice(0, 180)
      });
    }
    return res.status(upstream.status).json(data);
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: "Tidak dapat menghubungi API Nexadev",
      error: error?.message || "Unknown error"
    });
  }
}
