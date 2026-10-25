const BASE=(import.meta.env.VITE_API_BASE_URL||'http://localhost:8000/api').replace(/\/$/,'');
export const USE_MOCKS=import.meta.env.VITE_USE_MOCKS!=='false';
export const pick=(mock,real)=>USE_MOCKS?mock:real; // same method names in both modes
let token=null;export const setToken=t=>{token=t;};
export class ApiError extends Error{constructor(m,status=0,details=null){super(m);this.status=status;this.details=details;}}
export async function request(path,{method='GET',body,form,query,timeout=15000,signal}={}){
  const qs=query?'?'+new URLSearchParams(Object.entries(query).filter(([,v])=>v!==''&&v!=null&&v!==false)):'';
  const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),timeout);
  signal?.addEventListener('abort',()=>ctrl.abort());
  const headers={Accept:'application/json'};
  if(token)headers.Authorization=`Bearer ${token}`;
  if(body)headers['Content-Type']='application/json';
  try{
    const res=await fetch(BASE+path+qs,{method,headers,body:form||(body?JSON.stringify(body):undefined),signal:ctrl.signal});
    const text=await res.text();let data=null;
    try{data=text?JSON.parse(text):null;}catch{throw new ApiError('Server returned an invalid response',res.status);}
    if(!res.ok)throw new ApiError(data?.detail||res.statusText||'Request failed',res.status,data);
    return data;
  }catch(e){
    if(e instanceof ApiError)throw e;
    if(e.name==='AbortError')throw new ApiError('Request timed out or was cancelled');
    throw new ApiError('Network error: could not reach the server');
  }finally{clearTimeout(t);}
}
