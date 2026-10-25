import {pick,request} from './apiClient.js';import {consultations,doctors,wait,uid} from '../mocks/data.js';
const mock={
  async listConsultations(){await wait();return {items:[...consultations],doctors};},
  async getConsultation(id){await wait();const c=consultations.find(x=>x.id===id);if(!c)throw new Error('Consultation not found');return c;},
  async createConsultation(p){await wait();const d=doctors.find(x=>x.id===p.doctorId);
    const c={id:uid('con'),doctor:d.name,specialty:d.specialty,scheduledAt:p.slot,type:p.type,status:'scheduled',reason:p.reason||'',caseId:p.shareCaseId||null};consultations.unshift(c);return c;},
  async getJoinDetails(id){await wait();return {consultation_id:id,room:'demo-room',demo:true,ice_servers:[]};},
  async cancelConsultation(id){await wait();const c=consultations.find(x=>x.id===id);if(c)c.status='cancelled';return c;}};
const real={listConsultations:()=>request('/consultations'),getConsultation:id=>request(`/consultations/${id}`),
  createConsultation:p=>request('/consultations',{method:'POST',body:p}),getJoinDetails:id=>request(`/consultations/${id}/join`),
  cancelConsultation:id=>request(`/consultations/${id}`,{method:'DELETE'})};
export default pick(mock,real);
