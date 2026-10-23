const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = p => fs.readFileSync(p,'utf8');
const html=read('index.html'), entry=read('assets/crelics.js'), css=read('assets/crelics.css');
const config=read('assets/app/config.js'), storage=read('assets/app/storage.js'), utils=read('assets/app/utils.js'), app=read('assets/app/main.js'), client=read('assets/app/search-client.js');
const worker=read('worker/index.js'), core=read('worker/core.js'), provider=read('worker/providers/tavily.js'), readme=read('README.md');
test('frontend has a clean shell, design system, and modular ES-module entry',()=>{
 assert.match(html,/href="\.\/assets\/crelics\.css/);assert.match(html,/type="module" src="\.\/assets\/crelics\.js/);
 assert.doesNotMatch(html,/<style>/i);assert.doesNotMatch(html,/<script>(?!\s*<)/i);
 assert.match(entry,/import '\.\/app\/main\.js'/);assert.match(css,/prefers-reduced-motion/);assert.match(css,/@media\(max-width:520px\)/);
 assert.match(app,/from '\.\/search-client\.js'/);assert.match(app,/function render\(/);assert.match(storage,/localStorage/);assert.match(utils,/function esc/);
});
test('the image-inspired POV and search territories are explicit product configuration',()=>{
 for(const mode of ['adaptive','lucy','hari','spock','sherlock','doctor','valerian'])assert.ok(config.includes("'"+mode+"'"),'missing perspective '+mode);
 for(const lens of ['web','research','books','images','news','videos','places','products','discussions'])assert.ok(config.includes("'"+lens+"'"),'missing territory '+lens);
 assert.match(css,/--red:#a80e27/);assert.match(css,/--branch:#252428/);
});
test('search client keeps provider transport separate from interface orchestration',()=>{
 assert.match(client,/URLSearchParams/);assert.match(client,/AbortSignal\.timeout/);assert.match(client,/Search service unavailable/);
 assert.match(app,/searchWeb\(\{query:q,page,mode,seen,limit:20\}\)/);
 assert.match(app,/crelics\.saved/);assert.match(app,/crelics\.history/);
});
test('Worker entry delegates HTTP policy and provider logic to modules',()=>{
 assert.match(worker,/from "\.\/core\.js"/);assert.match(worker,/from "\.\/providers\/tavily\.js"/);
 assert.match(worker,/parseSearchRequest/);assert.match(worker,/searchTavily/);assert.match(core,/ALLOWED_ORIGINS/);
 assert.match(provider,/export function queryVariants/);assert.match(provider,/seen\.has\(url\)/);
});
test('documentation describes real provider limits rather than infinite search',()=>{
 assert.match(readme,/not exhaustive/i);assert.match(readme,/not infinite search/i);assert.match(readme,/search-client\.js/);assert.match(provider,/const TERRITORIES/);
});
