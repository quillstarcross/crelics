const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)][0]?.[1];
assert.ok(script, 'application script exists');

function extract(pattern, label) {
  const match = script.match(pattern);
  assert.ok(match, label + ' can be located in the application');
  return match[0];
}

const safeUrlSource = extract(/const safeUrl=s=>[\s\S]*?;\nconst setStatus/, 'URL sanitizer').replace(/\nconst setStatus$/, '');
const linkSource = extract(/function linkFor\(q\)[\s\S]*?\nasync function getJson/, 'external provider links').replace(/\nasync function getJson$/, '');
const providerSource = extract(/function providerPlan\(lens\)[\s\S]*?\nfunction unique/, 'provider routing').replace(/\nfunction unique$/, '');
const normalizeSource = extract(/function normalize\(x\)[\s\S]*?\nasync function reference/, 'record normalizer').replace(/\nasync function reference$/, '');

const context = {
  URL, encodeURIComponent, hasSearchBackend: () => false,
  reference: () => {}, research: () => {}, books: () => {}, images: () => {}, news: () => {}, webSearch: () => {}
};
vm.createContext(context);
vm.runInContext(safeUrlSource + '\n' + linkSource + '\n' + providerSource + '\n' + normalizeSource + '\nglobalThis.__test = { safeUrl, linkFor, providerPlan, normalize };', context);

test('URL sanitizer allows HTTP(S) and rejects unsafe or malformed URLs', () => {
  assert.equal(context.__test.safeUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(context.__test.safeUrl('http://example.com'), 'http://example.com/');
  assert.equal(context.__test.safeUrl('javascript:alert(1)'), null);
  assert.equal(context.__test.safeUrl('data:text/html,hello'), null);
  assert.equal(context.__test.safeUrl('not a url'), null);
});

test('record normalization rejects unsafe links and preserves source metadata', () => {
  assert.equal(context.__test.normalize({title:'bad',url:'javascript:alert(1)'}), null);
  const item = context.normalize({id:'abc',title:'Example',url:'https://example.com',source:'Test source',kind:'Research',date:'2026'});
  assert.equal(item.title, 'Example');
  assert.equal(item.source, 'Test source');
  assert.equal(item.date, '2026');
  assert.equal(item.url, 'https://example.com/');
});

test('dedicated lenses route to the correct public source adapter', () => {
  assert.equal(context.__test.providerPlan('research').map(x => x.name).join(','), 'Crossref research');
  assert.equal(context.providerPlan('books').map(x => x.name).join(','), 'Open Library books');
  assert.equal(context.providerPlan('images').map(x => x.name).join(','), 'Wikimedia Commons');
  assert.equal(context.providerPlan('news').map(x => x.name).join(','), 'GDELT news index');
  assert.deepEqual(Array.from(context.providerPlan('web')), []);
  assert.deepEqual(Array.from(context.providerPlan('all')), []);
  context.hasSearchBackend = () => true;
  assert.equal(context.providerPlan('web').map(x => x.name).join(','), 'Live web search');
  assert.equal(context.providerPlan('all').map(x => x.name).join(','), 'Live web search');
});

test('external-only lenses do not accidentally return unrelated API providers', () => {
  for (const lens of ['videos','places','products','discussions']) {
    assert.deepEqual(Array.from(context.providerPlan(lens)), []);
  }
});

test('external search links encode queries and use the intended destinations', () => {
  const links = context.__test.linkFor('robotics & AI');
  assert.match(links.videos[1], /^https:\/\/www\.youtube\.com\/results\?/);
  assert.match(links.places[1], /^https:\/\/www\.google\.com\/maps\/search\//);
  assert.match(links.products[1], /tbm=shop/);
  assert.match(links.discussions[1], /^https:\/\/www\.reddit\.com\/search\//);
  assert.ok(links.google[1].includes('robotics%20%26%20AI'));
  assert.ok(links.bing[1].includes('robotics%20%26%20AI'));
  assert.ok(links.brave[1].includes('robotics%20%26%20AI'));
});

test('app shell exposes investigation, compare, source map, saved and privacy views', () => {
  for (const marker of ['data-view="compare"', 'data-view="sources"', 'data-view="saved"', 'data-view="about"', 'id="exportBtn"']) {
    assert.ok(html.includes(marker), 'missing UI marker: ' + marker);
  }
});

test('integrated web search is configured through a server endpoint, never a browser API key', () => {
  assert.match(html, /SEARCH_API_ENDPOINT='https:\/\/crelics-search\.quillstarcross\.workers\.dev\/search'/);
  assert.match(html, /async function webSearch\(q,page=1\)/);
  assert.match(html, /limit:'20'/);
  assert.match(html, /async function loadMore\(\)/);
  assert.match(html, /function observeLoadMore\(\)/);
  for (const mode of ['adaptive','lucy','hari','spock','sherlock','doctor','valerian']) {
    assert.ok(html.includes("'"+mode+"'"), 'missing discovery POV: '+mode);
  }
  assert.doesNotMatch(html, /TAVILY_API_KEY\s*[:=]/);
});
