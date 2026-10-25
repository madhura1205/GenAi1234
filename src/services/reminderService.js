import {pick,request} from './apiClient.js';import {reminders,notifPrefs,wait,uid} from '../mocks/data.js';
const find=id=>reminders.find(r=>r.id===id);const log=(r,event)=>r.history.unshift({at:new Date().toISOString(),event});
const mock={
  async listReminders(f={}){await wait(200);return reminders.filter(r=>!f.status||f.status==='all'||r.status===f.status).map(r=>({...r}));},
  async createReminder(p){await wait(250);const r={...p,id:uid('rem'),status:'scheduled',history:[]};reminders.unshift(r);return r;},
  async updateReminder(id,p){await wait(250);const r=find(id);const {action,...rest}=p;Object.assign(r,rest);if(action){r.status=action;log(r,action);}return {...r};},
  async completeReminder(id){await wait(200);const r=find(id);r.status='completed';log(r,'completed');return {...r};},
  async cancelReminder(id){await wait(200);const r=find(id);r.status='cancelled';log(r,'cancelled');return {...r};},
  async getNotificationPreferences(){await wait(100);return {...notifPrefs};},
  async updateNotificationPreferences(p){await wait(150);Object.assign(notifPrefs,p);return {...notifPrefs};}};
const real={listReminders:f=>request('/reminders',{query:f}),createReminder:p=>request('/reminders',{method:'POST',body:p}),
  updateReminder:(id,p)=>request(`/reminders/${id}`,{method:'PATCH',body:p}),completeReminder:id=>request(`/reminders/${id}/complete`,{method:'POST'}),
  cancelReminder:id=>request(`/reminders/${id}`,{method:'DELETE'}),getNotificationPreferences:()=>request('/reminders/preferences'),
  updateNotificationPreferences:p=>request('/reminders/preferences',{method:'PATCH',body:p})};
export default pick(mock,real);
