import {pick,request} from './apiClient.js';import {profile,healthSummary,records,shares,wait,uid} from '../mocks/data.js';
const mock={
  async getPatientProfile(){await wait();return {...profile};},
  async getHealthSummary(){await wait();return healthSummary;},
  async listMedicalRecords(f={}){await wait(200);const q=(f.q||'').toLowerCase();
    return records.filter(r=>(!f.category||f.category==='all'||r.category===f.category)&&(!q||r.title.toLowerCase().includes(q))).map(r=>({...r}));},
  async getMedicalRecord(id){await wait(200);const r=records.find(x=>x.id===id);if(!r)throw new Error('Record not found');return {...r};},
  async uploadMedicalRecord(file,meta,{onProgress}={}){for(let i=1;i<=5;i++){await wait(200);onProgress?.(i*20);}
    const r={id:uid('rec'),title:meta.title||file.name,category:meta.category,date:meta.date,origin:'patient',fileType:file.type,size:file.size,notes:'Held in browser memory only (demo).'};records.unshift(r);return r;},
  async updateMedicalRecord(id,p){await wait(200);const r=records.find(x=>x.id===id);Object.assign(r,p);return {...r};},
  async deleteMedicalRecord(id){await wait(200);const i=records.findIndex(x=>x.id===id);if(i>=0)records.splice(i,1);return {ok:true};},
  async listShares(){await wait(150);return shares.map(s=>({...s}));},
  async createShareRequest(p){await wait(300);const s={id:uid('share'),recipient:p.recipient,recordIds:p.recordIds,createdAt:new Date().toISOString(),expiresAt:p.expiresAt,status:'active'};shares.unshift(s);return s;},
  async revokeShare(id){await wait(200);const s=shares.find(x=>x.id===id);if(s)s.status='revoked';return {...s};}};
const real={
  getPatientProfile:()=>request('/patients/me'),getHealthSummary:()=>request('/patients/me/health-summary'),
  listMedicalRecords:f=>request('/patients/me/records',{query:f}),getMedicalRecord:id=>request(`/patients/me/records/${id}`),
  uploadMedicalRecord:(file,meta)=>{const fd=new FormData();fd.append('file',file);Object.entries(meta).forEach(([k,v])=>fd.append(k,v));return request('/patients/me/records',{method:'POST',form:fd,timeout:60000});},
  updateMedicalRecord:(id,p)=>request(`/patients/me/records/${id}`,{method:'PATCH',body:p}),deleteMedicalRecord:id=>request(`/patients/me/records/${id}`,{method:'DELETE'}),
  listShares:()=>request('/patients/me/shares'),createShareRequest:p=>request('/patients/me/shares',{method:'POST',body:p}),revokeShare:id=>request(`/patients/me/shares/${id}`,{method:'DELETE'})};
export default pick(mock,real);
