const EXPANSIONS = {
  adaptive: ["", "additional independent sources and useful references", "primary sources reports data and original research", "different perspectives examples case studies", "recent developments and expert analysis", "guides documentation and detailed explanations", "datasets institutions and official publications", "historical context related topics and further reading"],
  lucy: ["", "connections across science technology arts culture and society", "interdisciplinary applications and unexpected connections", "related fields analogous ideas and cross-disciplinary research", "different disciplines perspectives and examples"],
  hari: ["", "historical trends long term patterns and future scenarios", "timeline data forecasts and historical comparisons", "emerging trends leading indicators and possible futures", "historical context recurring patterns and projections"],
  spock: ["", "primary evidence data methodology limitations and uncertainty", "systematic reviews datasets and peer reviewed evidence", "conflicting evidence assumptions and alternative explanations", "official statistics methods and reproducible findings"],
  sherlock: ["", "original documents primary sources and corroborating evidence", "authors dates source documents and traceable references", "case studies investigative reports and supporting evidence", "independent confirmation and source provenance"],
  doctor: ["", "alternative search terms unexpected sources and adjacent concepts", "new angles practical examples and less obvious sources", "different approaches and overlooked evidence", "related terms specialist sources and alternative explanations"],
  valerian: ["", "connected worlds communities ecosystems and wider context", "visual explainers interactive resources maps and related topics", "global perspectives cultures institutions and connected fields", "exploratory resources and surprising connections"]
};
export function queryVariants(query, page, mode) {
  const expansions = EXPANSIONS[mode] || EXPANSIONS.adaptive;
  if (page === 1) return [query];
  const base = expansions[(page - 1) % expansions.length];
  return [
    base ? query + " " + base : query + " further reading",
    query + " " + expansions[page % expansions.length],
    query + " " + expansions[(page + 2) % expansions.length]
  ];
}
export async function searchTavily({ query, apiKey, limit, seen, fetchImpl = fetch }) {
  const collected = [], found = new Set();
  for (const searchQuery of query) {
    const response = await fetchImpl("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", "accept": "application/json" },
      body: JSON.stringify({ api_key: apiKey, query: searchQuery, topic: "general", search_depth: "advanced", max_results: limit, include_answer: false, include_raw_content: false }),
      signal: AbortSignal.timeout(15000)
    });
    if (!response.ok) {
      if (!collected.length) {
        const status = response.status === 429 ? 503 : 502;
        throw Object.assign(new Error(status === 503 ? "Search provider is busy or rate-limited. Try again shortly." : "Search provider request failed."), { status });
      }
      continue;
    }
    const data = await response.json();
    for (const item of (Array.isArray(data.results) ? data.results : [])) {
      const url = normalizeUrl(item.url), safe = safeHttpUrl(item.url);
      if (!url || !safe || seen.has(url) || found.has(url)) continue;
      found.add(url);
      collected.push({ title: String(item.title || "Untitled result").slice(0,300), url:safe, description:String(item.content || "").slice(0,1200), source:hostname(url), date:String(item.published_date || "") });
      if (collected.length >= limit) break;
    }
    if (collected.length >= limit) break;
  }
  return collected;
}
function safeHttpUrl(value) { try { const u=new URL(value); return ["http:","https:"].includes(u.protocol)?u.href:""; } catch { return ""; } }
function normalizeUrl(value) { const safe=safeHttpUrl(value); if(!safe)return ""; try {const u=new URL(safe);u.hash="";if(u.pathname.length>1)u.pathname=u.pathname.replace(/\/$/,"");return u.href.toLowerCase();}catch{return "";} }
function hostname(value) { try{return new URL(value).hostname.replace(/^www\./,"");}catch{return "Web";} }
