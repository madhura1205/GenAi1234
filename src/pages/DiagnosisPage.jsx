import {useState,useRef} from 'react';import {useNavigate} from 'react-router-dom';import {Check,Loader2,Circle} from 'lucide-react';
import {Card,Button,Field,Badge,useToast,Async,Empty,ErrorState} from '../components/ui.jsx';import useAsync from '../hooks/useAsync.js';
import diagnosis,{reportsProgress} from '../services/diagnosisService.js';import research from '../services/researchService.js';
const steps=['Symptom understanding','Differential diagnosis','Literature retrieval','Clinical case retrieval','Evidence synthesis'];
const blank={age:'',sex:'',conditions:'',medications:'',allergies:'',symptoms:[{name:'',duration:'',severity:'moderate',onset:'gradual'}],additional:'',negatives:'',history:'',notes:'',useHealthPassport:false,confirm:false};
const list=s=>s.split(',').map(x=>x.trim()).filter(Boolean);
function Research(){
  const base=useAsync(()=>research.getBaselineComparison());const abl=useAsync(()=>research.getAblationResults());
  const rows=base.data?.rows;
  return <div className="stack"><DemoNote/>
    <Card title="Baseline vs multi-agent"><Async state={base}>{d=>!d.rows?.length?<Empty title="No evaluation data available" text="Connect an evaluation dataset or backend results."/>:
      <>{d.is_sample&&<Badge tone="amber">Sample data, not measured results</Badge>}<div className="scroll"><table><thead><tr><th>Metric</th><th>Baseline</th><th>Multi-agent</th></tr></thead><tbody>{rows.map(r=><tr key={r.metric}><td>{r.metric}</td><td>{r.baseline}</td><td>{r.multi}</td></tr>)}</tbody></table></div></>}</Async></Card>
    <Card title="Agent ablations"><Async state={abl}>{d=>!d.rows?.length?<Empty title="No ablation data"/>:
      <div className="scroll"><table><thead><tr><th>Configuration</th><th>Top-1</th><th>Top-5 recall</th></tr></thead><tbody>{d.rows.map(r=><tr key={r.config}><td>{r.config}</td><td>{r.top1}</td><td>{r.top5}</td></tr>)}</tbody></table></div>}</Async></Card></div>;
}
const DemoNote=()=><div className="note amber">Research Mode figures shown here are clearly marked sample values for UI demonstration. They are not measured results.</div>;
export default function DiagnosisPage(){
  const [tab,setTab]=useState('assess');const [f,setF]=useState(blank);const [err,setErr]=useState({});
  const [run,setRun]=useState({state:'idle',step:-1,error:null});const ctrl=useRef();const nav=useNavigate();const toast=useToast();
  const set=(k,v)=>setF(x=>({...x,[k]:v}));const sym=(i,k,v)=>set('symptoms',f.symptoms.map((s,j)=>j===i?{...s,[k]:v}:s));
  async function submit(e){
    e.preventDefault();const er={};
    if(!f.age||+f.age<0||+f.age>120)er.age='Enter a valid age (0-120).';
    if(!f.symptoms.some(s=>s.name.trim()))er.symptoms='Describe at least one symptom.';
    if(!f.confirm)er.confirm='Please confirm you have reviewed the information.';
    setErr(er);if(Object.keys(er).length)return;
    const payload={age:+f.age,sex:f.sex||null,conditions:list(f.conditions),medications:list(f.medications),allergies:list(f.allergies),
      symptoms:f.symptoms.filter(s=>s.name.trim()),additional_symptoms:list(f.additional),negative_symptoms:list(f.negatives),history:f.history,notes:f.notes,use_health_passport:f.useHealthPassport};
    ctrl.current=new AbortController();setRun({state:'loading',step:-1,error:null});
    try{const r=await diagnosis.analyzeCase(payload,{signal:ctrl.current.signal,onProgress:i=>setRun(x=>({...x,step:i}))});
      toast('Analysis complete');nav(`/diagnosis/results/${r.case_id}`);}
    catch(x){setRun(ctrl.current.signal.aborted?{state:'cancelled',step:-1,error:null}:{state:'failed',step:-1,error:x});}
  }
  if(run.state==='loading')return <Card title="Analyzing case"><div className="stack">
    {reportsProgress?<><Badge tone="amber">Mock workflow (demo)</Badge><ol className="steps">{steps.map((s,i)=><li key={s} className={i<run.step?'done':i===run.step?'now':''}>{i<run.step?<Check size={16}/>:i===run.step?<Loader2 className="spin" size={16}/>:<Circle size={16}/>}{s}</li>)}</ol></>
      :<Loading2/>}
    <Button variant="secondary" onClick={()=>ctrl.current.abort()}>Cancel analysis</Button></div></Card>;
  return <div className="stack">
    <div className="tabs" role="tablist"><button role="tab" aria-selected={tab==='assess'} onClick={()=>setTab('assess')}>New assessment</button><button role="tab" aria-selected={tab==='research'} onClick={()=>setTab('research')}>Research Mode</button></div>
    {tab==='research'?<Research/>:<form onSubmit={submit} noValidate className="stack">
      {run.state==='failed'&&<ErrorState error={run.error}/>}{run.state==='cancelled'&&<div className="note amber">Analysis was cancelled.</div>}
      <div className="note">This is a structured case form, not a chat. Decision support only; it does not provide a diagnosis.</div>
      <Card title="Patient information"><div className="grid3">
        <Field label="Age *" error={err.age}><input type="number" value={f.age} onChange={e=>set('age',e.target.value)}/></Field>
        <Field label="Sex (optional)"><select value={f.sex} onChange={e=>set('sex',e.target.value)}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Other</option></select></Field>
        <Field label="Existing conditions" hint="Comma separated"><input value={f.conditions} onChange={e=>set('conditions',e.target.value)}/></Field>
        <Field label="Current medications" hint="Comma separated"><input value={f.medications} onChange={e=>set('medications',e.target.value)}/></Field>
        <Field label="Known allergies" hint="Comma separated"><input value={f.allergies} onChange={e=>set('allergies',e.target.value)}/></Field></div></Card>
      <Card title="Symptoms" action={<Button type="button" variant="secondary" onClick={()=>set('symptoms',[...f.symptoms,{name:'',duration:'',severity:'moderate',onset:'gradual'}])}>Add symptom</Button>}>
        {err.symptoms&&<em className="err-t" role="alert">{err.symptoms}</em>}
        {f.symptoms.map((s,i)=><div className="grid5f" key={i}>
          <Field label={`Symptom ${i+1}`}><input value={s.name} onChange={e=>sym(i,'name',e.target.value)}/></Field>
          <Field label="Duration"><input placeholder="e.g. 3 days" value={s.duration} onChange={e=>sym(i,'duration',e.target.value)}/></Field>
          <Field label="Severity"><select value={s.severity} onChange={e=>sym(i,'severity',e.target.value)}><option>mild</option><option>moderate</option><option>severe</option></select></Field>
          <Field label="Onset"><select value={s.onset} onChange={e=>sym(i,'onset',e.target.value)}><option>sudden</option><option>gradual</option><option>worsening</option><option>improving</option></select></Field>
          {f.symptoms.length>1&&<Button type="button" variant="ghost" onClick={()=>set('symptoms',f.symptoms.filter((_,j)=>j!==i))}>Remove</Button>}</div>)}
        <div className="grid2"><Field label="Additional symptoms" hint="Comma separated"><input value={f.additional} onChange={e=>set('additional',e.target.value)}/></Field>
          <Field label="Relevant negative symptoms" hint="Symptoms you do NOT have"><input value={f.negatives} onChange={e=>set('negatives',e.target.value)}/></Field></div></Card>
      <Card title="Additional context"><Field label="Relevant medical history"><textarea rows="3" value={f.history} onChange={e=>set('history',e.target.value)}/></Field>
        <Field label="Notes (optional)"><textarea rows="2" value={f.notes} onChange={e=>set('notes',e.target.value)}/></Field>
        <label className="check"><input type="checkbox" checked={f.useHealthPassport} onChange={e=>set('useHealthPassport',e.target.checked)}/>Use relevant information from my Health Passport</label></Card>
      <label className="check"><input type="checkbox" checked={f.confirm} onChange={e=>set('confirm',e.target.checked)}/>I have reviewed this information before submission.</label>{err.confirm&&<em className="err-t" role="alert">{err.confirm}</em>}
      <div className="row"><Button type="submit">Analyze Case</Button><Button type="button" variant="secondary" onClick={()=>{setF(blank);setErr({});setRun({state:'idle'});}}>Clear Form</Button></div></form>}</div>;
}
const Loading2=()=><div className="state"><Loader2 className="spin" size={22}/><p>Analyzing… the backend does not report per-agent progress.</p></div>;
