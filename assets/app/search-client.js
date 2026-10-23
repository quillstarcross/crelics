const API='https://crelics-search.quillstarcross.workers.dev/search';
export async function searchWeb({query,page=1,mode='adaptive',seen=[],limit=20}){
 const params=new URLSearchParams({q:query,page:String(page),limit:String(limit),mode,seen:JSON.stringify(seen)});
 const response=await fetch(API+'?'+params,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});
 const body=await response.json();
 if(!response.ok)throw new Error(body.error||'Search service unavailable');
 return body;
}
