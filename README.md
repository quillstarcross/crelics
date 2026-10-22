# CRELICS

**Search beyond the obvious.** CRELICS is an independent search and discovery workspace being built from scratch in this repository.

- **Live app:** https://quillstarcross.github.io/crelics/
- **Source:** https://github.com/quillstarcross/crelics

## Current capabilities

- Search public reference pages through Wikipedia's API.
- Search scholarly metadata through Crossref.
- Search book catalog records through Open Library.
- Search images through Wikimedia Commons, including links to the original file pages.
- Search news articles through GDELT.
- Use clearly labeled external handoffs for video, places/maps, products, and community discussions.
- Save sources and recent queries in browser-local storage.
- Switch between dark and light themes.
- Open original source pages, copy links, and filter by search lens.

## How search is routed

| Lens | Current route |
| --- | --- |
| All | Wikipedia + Crossref + Open Library |
| Web | Wikipedia reference search |
| Research | Crossref works metadata |
| Books | Open Library catalog |
| Images | Wikimedia Commons |
| News | GDELT article search |
| Videos | External YouTube search handoff |
| Places | External Google Maps search handoff |
| Products | External shopping search handoff |
| Discussions | External Reddit search handoff |

The external-handoff lenses deliberately do **not** pretend that external results are indexed or ranked by CRELICS. They take the query to the selected provider.

## Run locally

This first version is a static site and needs no build step:

1. Clone this repository.
2. Open `index.html` in a browser, or serve the folder with any static HTTP server.
3. Search queries require network access to the selected public APIs.

For example, with Python installed:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Privacy and data handling

Search queries are sent to the selected third-party providers. Saved sources, recent searches, and theme preference are stored in this browser's local storage. This prototype has no CRELICS account system or server-side query history. Provider sites have their own privacy policies and may collect data when you open their links.

## Known limitations

- This is a client-side prototype, not a web crawler, general web index, or production metasearch backend.
- Public APIs can rate-limit, change response formats, or be unavailable.
- Result coverage, summaries, dates, and metadata depend on each provider and may be incomplete.
- CRELICS does not independently verify the truth, credibility, licensing, or safety of returned sources.
- A production system will need server-side provider adapters, stronger observability, caching, rate-limit handling, accessible interaction tests, and a clearly documented data-retention model.

## Engineering roadmap

1. Add regression tests for routing, escaping, and result normalization.
2. Improve error states, timeout handling, and accessible loading announcements.
3. Add provider adapter contracts, caching and request budgets.
4. Evaluate source quality signals without confusing popularity with truth.
5. Design a backend API before adding accounts, shared libraries, or server-side history.
6. Expand sources only where their API terms, reliability, and privacy requirements can be respected.

## Project structure

- `index.html`: self-contained UI, public-source adapters, routing and browser-local persistence.
- `.github/workflows/validate.yml`: CI syntax and app-shell checks.
