import { ALLOWED_ORIGINS, corsOptions, json, parseSearchRequest } from "./core.js";
import { queryVariants, searchTavily } from "./providers/tavily.js";

export default {
  async fetch(request, env) {
    const url=new URL(request.url), origin=request.headers.get("Origin")||"";
    const corsOrigin=ALLOWED_ORIGINS.has(origin)?origin:"https://quillstarcross.github.io";
    if(request.method==="OPTIONS") return corsOptions(corsOrigin);
    if(origin&&!ALLOWED_ORIGINS.has(origin)) return json({error:"Origin not allowed"},403,corsOrigin);
    if(request.method!=="GET") return json({error:"Use GET"},405,corsOrigin);
    if(url.pathname==="/health") return json({ok:true,service:"CRELICS Search API",providerConfigured:Boolean(env.TAVILY_API_KEY),architecture:"modular-search-v1"},200,corsOrigin);
    if(url.pathname!=="/search") return json({error:"Not found"},404,corsOrigin);
    if(!env.TAVILY_API_KEY) return json({error:"Search provider is not configured. Add TAVILY_API_KEY as a Worker secret."},503,corsOrigin);
    const params=parseSearchRequest(url);
    if(params.error) return json({error:params.error},params.status,corsOrigin);
    const {query,page,mode,limit,seen}=params;
    try {
      const results=await searchTavily({query:queryVariants(query,page,mode),apiKey:env.TAVILY_API_KEY,limit,seen});
      return json({query,page,results,count:results.length,hasMore:results.length>0&&page<100,provider:"Tavily",note:"Results are progressively discovered from the connected search provider; coverage is not exhaustive."},200,corsOrigin);
    } catch(error) {
      const status=error.status||502;
      return json({error:error.name==="TimeoutError"?"Search timed out. Try again.":error.message||"Search service is temporarily unavailable."},status,corsOrigin);
    }
  }
};
