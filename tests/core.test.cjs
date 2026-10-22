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
  URL, encodeURIComponent,
  reference: () => {}, research: () => {}, books: () => {}, images: () => {}, news: () => {}
};
vm.createContext(context);
vm.runInContext(safeUrlSource + '\n' + linkSource + '\n' + providerSource + '\n' + normalizeSource, context);

test('URL sanitizer allows HTTP(S) and rejects unsafe or malformed URLs', () => {
  assert.equal(context.safeUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(context.safeUrl('http://example.com'), 'http://example.com/');
  assert.equal(context.safeUrl('javascript:alert(1)'), null);
  assert.equal(context.safeUrl('data:text/html,hello'), null);
  assert.equal(context.safeUrl('not a url'), null);
});

test('record normalization rejects unsafe links and preserves source metadata', () => {
  assert.equal(context.normalize({title:'bad',url:'javascript:alert(1)'}), null);
  const item = context.normalize({id:'abc',title:'Example',url:'https://example.com',source:'Test source',kind:'Research',date:'2026'});
  assert.equal(item.title, 'Example');
  assert.equal(item.source, 'Test source');
  assert.equal(item.date, '2026');
  assert.equal(item.url, 'https://example.com/');
});

test('dedicated lenses route to the correct public source adapter', () => {
  assert.equal(context.providerPlan('research').map(x => x.name).join(','), 'Crossref research');
  assert.equal(context.providerPlan('books').map(x => x.name).join(','), 'Open Library books');
  assert.equal(context.providerPlan('images').map(x => x.name).join(','), 'Wikimedia Commons');
  assert.equal(context.providerPlan('news').map(x => x.name).join(','), 'GDELT news index');
  assert.equal(context.providerPlan('web').map(x => x.name).join(','), 'Wikipedia reference');
  assert.deepEqual(Array.from(context.providerPlan('all'), x => x.name), ['Wikipedia reference','Crossref research','Open Library books']);
});

test('external-only lenses do not accidentally return unrelated API providers', () => {
  for (const lens of ['videos','places','products','discussions']) {
    assert.deepEqual(Array.from(context.providerPlan(lens)), []);
  }
});

test('external search links encode queries and use the intended destinations', () => {
  const links = context.linkFor('robotics & AI');
  assert.match(links.videos[1], /^https:\/\/www\.youtube\.com\/results\?/);
  assert.match(links.places[1], /^https:\/\/www\.google\.com\/maps\/search\//);
  assert.match(links.products[1], /tbm=shop/);
  assert.match(links.discussions[1], /^https:\/\/www\.reddit\.com\/search\//);
  assert.ok(links.web[1].includes('robotics%20%26%20AI'));
});

test('app shell exposes investigation, compare, source map, saved and privacy views', () => {
  for (const marker of ['data-view="compare"', 'data-view="sources"', 'data-view="saved"', 'data-view="about"', 'id="exportBtn"']) {
    assert.ok(html.includes(marker), 'missing UI marker: ' + marker);
  }
});
