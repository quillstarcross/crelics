# CRELICS

**Search beyond the obvious.** CRELICS is an independent search and discovery workspace built around progressive web discovery, cross-disciplinary exploration, source traceability, and user-controlled investigation.

- **Live app:** https://quillstarcross.github.io/crelics/
- **Source:** https://github.com/quillstarcross/crelics

## Search experience

- **Progressive web search:** results appear inside CRELICS. The first batch contains up to 20 records; scrolling toward the end automatically discovers more, and a manual “Load more results” control is available as well.
- **Adaptive discovery POVs:** Adaptive, Lucy (cross-disciplinary connections), Hari (historical patterns and futures), Spock (logic, evidence and uncertainty), Sherlock (source tracing and corroboration), The Doctor (adaptive search strategy), and Valerian (interconnected exploration). These modes influence the discovery queries used for later batches.
- **Focused lenses:** Research uses Crossref metadata; Books uses Open Library; Images uses Wikimedia Commons; News uses GDELT. Video, places, products and discussions currently provide clearly labelled external handoffs rather than pretending CRELICS has its own index for them.
- **Investigation tools:** save sources, review local search history, compare records, inspect publisher domains, export results, and switch between dark and light themes.

## What “more results” means

CRELICS does not currently crawl and index the whole web itself. Its integrated web results come from Tavily, which does not expose a simple numeric page offset for its search API. To keep discovery moving beyond the first batch, CRELICS requests up to 20 results at a time, uses alternate query formulations informed by the selected discovery POV, and removes URLs already delivered. Scrolling can continue while the upstream provider returns new sources. It is a progressive discovery stream, **not a guarantee of literally infinite or exhaustive results**. Coverage, availability, ranking and usage limits still depend on the upstream provider. Building a truly independent, Google-scale web index would require a crawler, index infrastructure, ranking systems, spam defenses and substantial ongoing compute.

## Search backend

The static GitHub Pages interface calls a Cloudflare Worker, which keeps the Tavily key server-side. The private key must never be placed in index.html or committed to the repository.

- Worker source: worker/index.js
- Worker configuration: wrangler.toml
- Required Worker secret: TAVILY_API_KEY
- Health check: https://crelics-search.quillstarcross.workers.dev/health

## Run locally

The interface is static and needs no build step. Serve the folder with python -m http.server 8000 and open http://localhost:8000. The Worker requires Wrangler and a local secret in .dev.vars (never commit it).

## Privacy and limitations

Queries are sent to the provider configured for the selected lens. Saved sources, recent searches and theme preference stay in browser localStorage; the static app does not maintain CRELICS server-side search history. CRELICS does not automatically verify truth or treat a publisher-domain count as a credibility score. Inspect original sources, authors, dates, methods and supporting evidence. API terms, ranking, availability and data practices apply.
