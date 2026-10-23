const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = p => fs.readFileSync(p, 'utf8');
const html = read('index.html');
const app = read('assets/crelics.js');
const css = read('assets/crelics.css');
const worker = read('worker/index.js');
const core = read('worker/core.js');
const provider = read('worker/providers/tavily.js');

test('frontend structure is split into semantic shell, design system, and application module', () => {
  assert.match(html, /href="\.\/assets\/crelics\.css/);
  assert.match(html, /type="module" src="\.\/assets\/crelics\.js/);
  assert.doesNotMatch(html, /<style>/i);
  assert.doesNotMatch(html, /<script>(?!\s*<)/i);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(app, /function run\(/);
  assert.match(app, /crelics\.saved/);
});

test('the six perspectives and source lenses are discoverable in application architecture', () => {
  for (const mode of ['adaptive','lucy','hari','spock','sherlock','doctor','valerian']) assert.ok(app.includes("'" + mode + "'") || provider.includes(mode), 'missing POV ' + mode);
  for (const lens of ['web','research','books','images','news','videos','places','products','discussions']) assert.ok(app.includes("'" + lens + "'"), 'missing lens ' + lens);
});

test('Worker entry point delegates HTTP policy and search-provider behavior to modules', () => {
  assert.match(worker, /from "\.\/core\.js"/);
  assert.match(worker, /from "\.\/providers\/tavily\.js"/);
  assert.match(worker, /parseSearchRequest/);
  assert.match(worker, /searchTavily/);
  assert.match(core, /query\.length<2\|\|query\.length>300/);
  assert.match(core, /ALLOWED_ORIGINS/);
});

test('provider adapter bounds requests, normalizes URLs, and progressively expands queries', () => {
  assert.match(provider, /AbortSignal\.timeout\(15000\)/);
  assert.match(provider, /\["http:","https:"\]/);
  assert.match(provider, /seen\.has\(url\)/);
  assert.match(provider, /export function queryVariants/);
  assert.match(provider, /primary evidence data methodology limitations and uncertainty/);
  assert.match(provider, /connections across science technology arts culture and society/);
});

test('frontend uses the real search API and states progressive coverage honestly', () => {
  assert.match(app, /https:\/\/crelics-search\.quillstarcross\.workers\.dev\/search/);
  assert.match(app, /coverage is not exhaustive/i);
  assert.match(readmeSafe(), /not infinite search/i);
});
function readmeSafe() { return read('README.md'); }
