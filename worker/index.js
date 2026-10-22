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
    const page = Math.max(1, Math.min(100, Number.parseInt(url.searchParams.get("page") || "1", 10) || 1));
    const limit = Math.max(10, Math.min(20, Number.parseInt(url.searchParams.get("limit") || "20", 10) || 20));
    let seenUrls = [];
    try {
      const parsed = JSON.parse(url.searchParams.get("seen") || "[]");
      if (Array.isArray(parsed)) seenUrls = parsed.filter(x => typeof x === "string").slice(-100).map(normalizeUrl);
    } catch {}
    const seen = new Set(seenUrls.filter(Boolean));
    // Tavily does not expose a numeric offset. Page one uses the exact query;
    // later pages use distinct discovery formulations, then deduplicate against
    // URLs already delivered to the browser. This creates progressive exploration
    // without pretending that any upstream index is literally infinite.
    const expansions = [
      "",
      "additional independent sources and useful references",
      "primary sources reports data and original research",
      "different perspectives examples case studies",
      "recent developments and expert analysis",
      "guides documentation and detailed explanations",
      "datasets institutions and official publications",
      "historical context related topics and further reading"
    ];
    const base = expansions[(page - 1) % expansions.length];
    const queryVariants = page === 1
      ? [q]
      : [base ? q + " " + base : q + " further reading",
         q + " " + expansions[(page) % expansions.length],
         q + " " + expansions[(page + 2) % expansions.length]];
    const collected = [];
    const found = new Set();
    try {
      for (const searchQuery of queryVariants) {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "content-type": "application/json", "accept": "application/json" },
          body: JSON.stringify({
            api_key: env.TAVILY_API_KEY,
            query: searchQuery,
            topic: "general",
            search_depth: "advanced",
            max_results: limit,
            include_answer: false,
            include_raw_content: false
          }),
          signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) {
          if (!collected.length) {
            const status = response.status === 429 ? 503 : 502;
            return json({ error: status === 503 ? "Search provider is busy or rate-limited. Try again shortly." : "Search provider request failed." }, status, corsOrigin);
          }
          continue;
        }
        const data = await response.json();
        for (const item of (Array.isArray(data.results) ? data.results : [])) {
          const normalized = normalizeUrl(item.url);
          if (!normalized || seen.has(normalized) || found.has(normalized)) continue;
          found.add(normalized);
          collected.push({
            title: String(item.title || "Untitled result").slice(0, 300),
            url: normalized,
            description: String(item.content || "").slice(0, 1200),
            source: hostname(normalized),
            date: String(item.published_date || "")
          });
          if (collected.length >= limit) break;
        }
        if (collected.length >= limit) break;
      }
      return json({
        query: q, page, results: collected, count: collected.length,
        hasMore: collected.length > 0 && page < 100, provider: "Tavily",
        note: "Results are progressively discovered from the connected search provider; coverage is not exhaustive."
      }, 200, corsOrigin);
    } catch (error) {
      return json({ error: error?.name === "TimeoutError" ? "Search timed out. Try again." : "Search service is temporarily unavailable." }, 502, corsOrigin);
    }
  }
};
function safeHttpUrl(value) {
  try { const u = new URL(value); return ["http:", "https:"].includes(u.protocol) ? u.href : ""; }
  catch { return ""; }
}
function normalizeUrl(value) {
  const safe = safeHttpUrl(value);
  if (!safe) return "";
  try { const u = new URL(safe); u.hash = ""; if (u.pathname.length > 1) u.pathname = u.pathname.replace(/\\/$/, ""); return u.href.toLowerCase(); }
  catch { return ""; }
}
function hostname(value) {
  try { return new URL(value).hostname.replace(/^www\./, ""); }
  catch { return "Web"; }
}
