export const ALLOWED_ORIGINS = new Set(["https://quillstarcross.github.io","http://localhost:8000","http://127.0.0.1:8000"]);
export function json(body,status=200,origin="") { return new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"public, max-age=30, s-maxage=30","access-control-allow-origin":origin||"https://quillstarcross.github.io","access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"Accept","x-content-type-options":"nosniff"}}); }
export function corsOptions(origin) { return new Response(null,{status:204,headers:{"access-control-allow-origin":origin,"access-control-allow-methods":"GET, OPTIONS","access-control-allow-headers":"Accept","access-control-max-age":"86400"}}); }
export function parseSearchRequest(url) {
  const query=(url.searchParams.get("q")||"").trim();
  if(query.length<2||query.length>300) return {error:"Query must be between 2 and 300 characters",status:400};
  const page=Math.max(1,Math.min(100,Number.parseInt(url.searchParams.get("page")||"1",10)||1));
  const mode=(url.searchParams.get("mode")||"adaptive").toLowerCase();
  const limit=Math.max(10,Math.min(20,Number.parseInt(url.searchParams.get("limit")||"20",10)||20));
  let seen=[];
  try { const parsed=JSON.parse(url.searchParams.get("seen")||"[]"); if(Array.isArray(parsed)) seen=parsed.filter(x=>typeof x==="string").slice(-100).map(normalizeUrl).filter(Boolean); } catch {}
  return {query,page,mode,limit,seen:new Set(seen)};
}
export function normalizeUrl(value) { const safe=safeHttpUrl(value);if(!safe)return "";try{const u=new URL(safe);u.hash="";if(u.pathname.length>1)u.pathname=u.pathname.replace(/\/$/,"");return u.href.toLowerCase()}catch{return ""} }
function safeHttpUrl(value) { try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return ""} }
