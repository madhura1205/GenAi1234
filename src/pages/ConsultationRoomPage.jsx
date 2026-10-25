import {useEffect,useMemo,useState} from 'react';import {useParams,useNavigate} from 'react-router-dom';import {Mic,MicOff,Camera,CameraOff,PhoneOff,Wifi,WifiOff,Headphones} from 'lucide-react';
import useAsync from '../hooks/useAsync.js';import svc from '../services/consultationService.js';import hp from '../services/healthPassportService.js';import diagnosis from '../services/diagnosisService.js';
import {createCallAdapter} from '../services/videoService.js';import {Card,Button,Badge,Async,Loading} from '../components/ui.jsx';
export default function Room(){
  const {consultationId}=useParams();const nav=useNavigate();
  const st=useAsync(async()=>{const c=await svc.getConsultation(consultationId);const j=await svc.getJoinDetails(consultationId);const sum=await hp.getHealthSummary();const cs=c.caseId?await diagnosis.getCase(c.caseId):null;return {c,j,sum,cs};},[consultationId]);
  const call=useMemo(()=>createCallAdapter(),[]);const [s,setS]=useState({status:'idle'});const [notes,setNotes]=useState('');
  useEffect(()=>{const u=call.subscribe(setS);return u;},[call]);
  useEffect(()=>{if(st.data){call.join();}},[st.data,call]);
  return <Async state={st}>{({c,sum,cs})=><div className="room">
    <div className="stack"><div className="note amber">Demo call mode: no real audio/video connection is made. Signaling and STUN/TURN are not configured.</div>
      <div className="stage">
        <div className="remote">{s.status==='connected'||s.status==='reconnecting'?<><b>{c.doctor}</b><small>{c.specialty} (remote placeholder)</small></>:<Loading text={s.status==='ended'?'Call ended':'Connecting…'}/>}
          <div className="local">{s.camera?<small>You (camera preview placeholder)</small>:<small>{s.audioOnly?'Audio-only mode':'Camera off'}</small>}</div></div>
        <div className="status"><Badge tone={s.status==='connected'?'green':s.status==='ended'?'grey':'amber'}>{s.status}</Badge>
          <Badge tone={s.quality==='poor'?'red':'green'}>{s.quality==='poor'?<WifiOff size={12}/>:<Wifi size={12}/>} network {s.quality}</Badge>{s.status==='reconnecting'&&<Badge tone="amber">Reconnecting…</Badge>}</div>
        {s.quality==='poor'&&!s.audioOnly&&<div className="note amber">Weak connection. <button className="link" onClick={()=>call.setAudioOnly(true)}>Switch to Audio</button></div>}
        <div className="controls" role="toolbar" aria-label="Call controls">
          <button className="icon-btn big" aria-label={s.mic?'Mute microphone':'Unmute microphone'} onClick={()=>call.toggleMic()}>{s.mic?<Mic/>:<MicOff/>}</button>
          <button className="icon-btn big" aria-label={s.camera?'Turn camera off':'Turn camera on'} onClick={()=>call.toggleCamera()}>{s.camera?<Camera/>:<CameraOff/>}</button>
          <button className="icon-btn big" aria-label="Toggle audio-only mode" aria-pressed={s.audioOnly} onClick={()=>call.setAudioOnly(!s.audioOnly)}><Headphones/></button>
          <button className="icon-btn big end" aria-label="End call" onClick={async()=>{await call.end();nav('/consultations');}}><PhoneOff/></button></div>
        <div className="row"><Button variant="secondary" onClick={()=>call.simulateQuality(s.quality==='poor'?'good':'poor')}>{s.quality==='poor'?'Restore network (demo)':'Simulate weak network (demo)'}</Button></div></div></div>
    <aside className="stack"><Card title="Patient-authorized summary"><dl className="dl"><dt>Allergies</dt><dd>{sum.allergies.join(', ')}</dd><dt>Medications</dt><dd>{sum.medications.join(', ')}</dd><dt>Conditions</dt><dd>{sum.conditions.join(', ')}</dd></dl></Card>
      <Card title="AI case summary">{cs?<><Badge tone="amber">AI-generated, demo</Badge><ol>{cs.differential_diagnoses.map(d=><li key={d.rank}>{d.condition} <small>(ranking score {d.ranking_score})</small></li>)}</ol><p className="muted">Uncertainty: {cs.differential_diagnoses[0].uncertainty}</p></>:<p className="muted">No diagnosis report shared for this consultation.</p>}</Card>
      <Card title="Doctor notes"><label className="field"><span className="sr">Notes</span><textarea rows="5" placeholder="Notes (not saved in demo)" value={notes} onChange={e=>setNotes(e.target.value)}/></label></Card></aside></div>}</Async>;
}
