# CRELICS

**Search beyond the obvious.** CRELICS is an independent search and discovery workspace being built from scratch in this repository.

- **Live app:** https://quillstarcross.github.io/crelics/
- **Source:** https://github.com/quillstarcross/crelics

## Search behavior

- **General Web Search / Web:** intended to show live web search results directly inside CRELICS through a server-side search adapter. Until the Worker is deployed and configured, these lenses provide direct provider links instead of routing through Wikipedia.
- **Research:** Crossref scholarly metadata.
- **Books:** Open Library catalog.
- **Images:** Wikimedia Commons.
- **News:** GDELT news index.
- **Videos, places, products, discussions:** clearly labelled direct provider handoffs; CRELICS does not claim to index these results itself.
- Save sources and recent queries locally, compare records, export investigation data, and switch themes.

## Enable integrated web search

The frontend is a GitHub Pages static site, so a private search API key must never be placed in `index.html`. The included Cloudflare Worker proxies Tavily search and keeps its key server-side.

1. Create a free Tavily account and create an API key: https://www.tavily.com/
2. Create/deploy the Worker from this repository using Cloudflare's dashboard or Wrangler. Worker source: `worker/index.js`; configuration: `wrangler.toml`.
3. Add the key to the Worker as a **Secret** named `TAVILY_API_KEY` (Cloudflare dashboard → Workers & Pages → your Worker → Settings → Variables and Secrets → Add → Secret). Never commit the key to GitHub.
4. Verify `https://YOUR-WORKER.workers.dev/health` reports `ok: true` and `providerConfigured: true`.
5. In `index.html`, replace `https://crelics-search.YOUR-SUBDOMAIN.workers.dev/search` with your deployed Worker URL plus `/search`. Commit the change. General Web Search and Web will then render provider results in CRELICS.

Official references: Cloudflare Worker secrets documentation: https://developers.cloudflare.com/workers/configuration/secrets/ and Tavily API documentation: https://help.tavily.com/articles/4840311948-tavily-search-api.

## Run locally

The UI is static and needs no build step. Serve the folder with `python -m http.server 8000` and open `http://localhost:8000`. The Worker requires Wrangler and a local secret in `.dev.vars` (never commit it); see Cloudflare's secrets guide.

## Privacy and limitations

Search queries are sent to the provider configured for the selected lens. The integrated search backend forwards the query to Tavily and returns web results; CRELICS does not independently verify truth or guarantee exhaustive coverage. Saved sources, recent searches and theme preference remain in browser localStorage. Provider terms, usage limits, availability, ranking and data practices apply. The Worker allows the GitHub Pages origin and localhost development origins; configure any custom domain explicitly before using it.
