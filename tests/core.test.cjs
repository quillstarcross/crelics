const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = [...html.matchAll(/<script>([\\s\\S]*?)<\\/script>/gi)][0]?.[1];
assert.ok(script, 'application script exists');

function extract(pattern, label) {
  const match = script.match(pattern);
  assert.ok(match, label + ' can be located in the application');
  return match[0];
}

const safeUrlSource = extract(/const safeUrl=value=>[\\s\\S]*?;(?=\\nconst esc)/, 'URL sanitizer');
const escapeSource = extract(/const esc=value=>[\\s\\S]*?;(?=\\nconst setStatus)/, 'HTML escaping helper');
const externalSource = extract(/function externalLinks\\(q\\)[\\s\\S]*?\\nasync function fetchJson/, 'external search routing').replace(/\\nasync function fetchJson$/, '');
const providersSource = extract(/function providersFor\\(cat\\)[\\s\\S]*?\\nfunction renderExternalSearch/, 'provider routing').replace(/\\nfunction renderExternalSearch$/, '');

const context = {
  URL,
  encodeURIComponent,
  searchCrossref: () => {},
  searchBooks: () => {},
  searchImages: () => {},
  searchNews: () => {},
  searchWikipedia: () => {}
};
vm.createContext(context);
vm.runInContext(safeUrlSource + '\\n' + escapeSource + '\\n' + externalSource + '\\n' + providersSource, context);

test('URL sanitizer allows HTTP(S) and rejects unsafe or malformed URLs', () => {
  assert.equal(context.safeUrl('https://example.com/path'), 'https://example.com/path');
  assert.equal(context.safeUrl('http://example.com'), 'http://example.com/');
  assert.equal(context.safeUrl('javascript:alert(1)'), null);
  assert.equal(context.safeUrl('data:text/html,hello'), null);
  assert.equal(context.safeUrl('not a url'), null);
});

test('HTML escaping protects text interpolated into result cards', () => {
  assert.equal(context.esc('<img src=x onerror="x">'), '&lt;img src=x onerror=&quot;x&quot;&gt;');
  assert.equal(context.esc("O'Reilly & Co"), 'O&#39;Reilly &amp; Co');
  assert.equal(context.esc(null), '');
});

test('dedicated lenses route only to their intended direct provider', () => {
  assert.equal(context.providersFor('research').map(x => x.name).join(','), 'Research papers');
  assert.equal(context.providersFor('books').map(x => x.name).join(','), 'Books');
  assert.equal(context.providersFor('images').map(x => x.name).join(','), 'Images');
  assert.equal(context.providersFor('news').map(x => x.name).join(','), 'News');
  assert.equal(context.providersFor('web').map(x => x.name).join(','), 'Wikipedia');
});

test('external-only lenses do not accidentally return unrelated API providers', () => {
  for (const category of ['videos', 'places', 'products', 'discussions']) {
    assert.deepEqual(Array.from(context.providersFor(category)), []);
  }
});

test('external search links preserve the query and use the intended destination', () => {
  const links = context.externalLinks('robotics & AI');
  assert.match(links.videos[1], /^https:\/\/www\\.youtube\\.com\\/results\\?/);
  assert.match(links.places[1], /^https:\/\/www\\.google\\.com\\/maps\\/search\\//);
  assert.match(links.products[1], /tbm=shop/);
  assert.match(links.discussions[1], /^https:\/\/www\\.reddit\\.com\\/search\\//);
  assert.ok(links.web[1].includes('robotics%20%26%20AI'));
});
