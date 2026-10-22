const ALLOWED_ORIGINS = new Set([
  "https://quillstarcross.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
]);
const json = (body, status = 200, origin = "") => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=60, s-maxage=60",
    "access-control-allow-origin": origin || "https://quillstarcross.github.io",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Accept"
  }
});
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://quillstarcross.github.io";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": corsOrigin,
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "Accept",
      "access-control-max-age": "86400"
    }});
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed" }, 403, corsOrigin);
    if (request.method !== "GET") return json({ error: "Use GET" }, 405, corsOrigin);
    if (url.pathname === "/health") return json({ ok: true, service: "CRELICS Search API", providerConfigured: Boolean(env.TAVILY_API_KEY) }, 200, corsOrigin);
    if (url.pathname !== "/search") return json({ error: "Not found" }, 404, corsOrigin);
    const q = (url.searchParams.get("q") || "").trim();
    if (q.length < 2 || q.length > 300) return json({ error: "Query must be between 2 and 300 characters" }, 400, corsOrigin);
    if (!env.TAVILY_API_KEY) return json({ error: "Search provider is not configured. Add TAVILY_API_KEY as a Worker secret." }, 503, corsOrigin);
    const limit = Math.max(1, Math.min(10, Number.parseInt(url.searchParams.get("limit") || "10", 10) || 10));
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify({
          api_key: env.TAVILY_API_KEY,
          query: q,
          topic: "general",
          search_depth: "basic",
          max_results: limit,
          include_answer: false,
          include_raw_content: false
        }),
        signal: AbortSignal.timeout(12000)
      });
      if (!response.ok) {
        const status = response.status === 429 ? 503 : 502;
        return json({ error: status === 503 ? "Search provider is busy or rate-limited. Try again shortly." : "Search provider request failed." }, status, corsOrigin);
      }
      const data = await response.json();
      const results = (Array.isArray(data.results) ? data.results : []).map(item => ({
        title: String(item.title || "Untitled result").slice(0, 300),
        url: safeHttpUrl(item.url),
        description: String(item.content || "").slice(0, 1200),
        source: hostname(item.url),
        date: String(item.published_date || "")
      })).filter(item => item.url);
      return json({ query: q, results, count: results.length, provider: "Tavily" }, 200, corsOrigin);
    } catch (error) {
      return json({ error: error?.name === "TimeoutError" ? "Search timed out. Try again." : "Search service is temporarily unavailable." }, 502, corsOrigin);
    }
  }
};
function safeHttpUrl(value) {
  try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; }
  catch { return ""; }
}
function hostname(value) {
  try { return new URL(value).hostname.replace(/^www\./, ""); }
  catch { return "Web"; }
}
