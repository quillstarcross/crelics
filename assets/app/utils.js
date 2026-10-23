export const $=selector=>document.querySelector(selector);
export const $$=selector=>[...document.querySelectorAll(selector)];
export function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
export function host(url){try{return new URL(url).hostname.replace(/^www\\./,'')}catch{return 'Web source'}}
