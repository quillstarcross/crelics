# CRELICS

**Search with a different point of view.** CRELICS is a web-discovery engine inspired by the image's porcelain, branching, and crimson visual language. Its product architecture separates the interface, discovery experience, request policy, and upstream search provider.

- **Live app:** https://quillstarcross.github.io/crelics/
- **Source:** https://github.com/quillstarcross/crelics
- **Search API:** https://crelics-search.quillstarcross.workers.dev

## Product architecture

```text
index.html                  Semantic application shell
assets/
  crelics.css               Visual design system and responsive layouts
  crelics.js                Search orchestration and UI state
worker/
  index.js                  HTTP entry point and route orchestration
  core.js                   Request validation, CORS and URL normalization
  providers/
    tavily.js               Search-provider adapter and query expansion
tests/
  core.test.cjs             Structural and safety regression checks
wrangler.toml               Cloudflare Worker deployment configuration
.github/workflows/
  deploy-worker.yml         Worker deployment automation
```

## The design language is the product language

The source image is translated into the whole experience rather than used as a decorative wallpaper:

- **Porcelain:** pale sculptural surfaces, quiet negative space, and layered cards.
- **Crimson blossoms:** a restrained red signal for actions, active states, and discovery.
- **Black branches:** a metaphor for source provenance and connections between ideas.
- **The fractures:** multiple paths through a question, never a claim that one answer is complete.

The CSS design system is separate from the HTML and application logic. The interface is mobile-first, keyboard-accessible, and respects reduced-motion preferences.

## Search architecture

The browser module manages query state, source lenses, perspective selection, saved items, history, and progressive results. The Worker entry point validates requests and handles HTTP policy. Its core module owns validation and URL normalization. The Tavily adapter handles provider-specific requests, result normalization, deduplication, and POV-inspired query expansion.

The six perspectives are **query strategies**, not six autonomous AI agents:

- **Adaptive:** general discovery.
- **Lucy:** cross-disciplinary connections.
- **Hari Seldon:** historical patterns and possible futures.
- **Spock:** evidence, methods, and uncertainty.
- **Sherlock Holmes:** original documents and corroboration.
- **The Doctor:** alternative routes and overlooked terminology.
- **Valerian:** connected fields and wider context.

CRELICS currently uses Tavily for web search. Progressive requests explore alternate query formulations because this provider does not expose numeric offset pagination through this integration. This is not infinite search and does not guarantee exhaustive coverage.

## Current source lenses

The interface offers All Web, Web, Research, Books, Images, News, Videos, Places, Products, and Discussions. The active Worker provides general web results; category-specific sources and rich media integrations are not all implemented as dedicated backend providers yet. The UI must not imply otherwise. Dedicated image/video/place/product/discussion retrieval is a future provider-layer expansion.

## Configuration and deployment

- Set `TAVILY_API_KEY` as a **Cloudflare Worker secret**. Never put provider secrets in browser code.
- `wrangler.toml` defines the Worker entry point.
- The GitHub Actions workflow deploys the Worker when relevant backend files change.
- GitHub Pages serves the static frontend.
- Saved sources, search history, and appearance preference are stored locally in the user's browser.

## Reliability and privacy

- Query length and pagination are bounded.
- Only HTTP(S) source links are accepted from the provider.
- Search requests are sent to the configured provider.
- Local saves and history are stored in browser storage.
- Search results depend on the provider's index, ranking, and availability. Verify important claims at the original source.

## Development

The project uses native browser JavaScript modules and Cloudflare Worker ES modules; no frontend bundler is required. Run the test suite with Node.js:

```sh
node --test tests/core.test.cjs
```
