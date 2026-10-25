import {useState} from 'react';import {Navigation,Phone,LocateFixed,Map} from 'lucide-react';
import useAsync from '../hooks/useAsync.js';import svc,{getLocation} from '../services/clinicService.js';import {Card,Button,Badge,Modal,Async,Empty,useToast} from '../components/ui.jsx';
const blank={q:'',type:'all',specialty:'all',radiusKm:25};
export default function Clinics(){
  const [f,setF]=useState(blank);const [loc,setLoc]=useState(null);const [locErr,setLocErr]=useState('');const [sel,setSel]=useState(null);const toast=useToast();
  const st=useAsync(()=>svc.searchClinics({...f,...(loc||{})}),[f,loc]);
  async function locate(){setLocErr('');try{setLoc(await getLocation());toast('Location set');}catch(e){setLocErr(e.message);}}
  return <div className="split">
    <div className="stack"><Card title="Search & filters"><div className="stack">
      <input aria-label="Search by location or name" placeholder="Search by name or address" value={f.q} onChange={e=>setF({...f,q:e.target.value})}/>
      <Button variant="secondary" icon={LocateFixed} onClick={locate}>Use current location</Button>{locErr&&<em className="err-t" role="alert">{locErr}</em>}{loc&&<small>Using your device location (not stored).</small>}
      <label className="field"><span>Radius: {f.radiusKm} km{!loc&&' (applies once location is set)'}</span><input type="range" min="1" max="100" value={f.radiusKm} onChange={e=>setF({...f,radiusKm:+e.target.value})}/></label>
      <select aria-label="Facility type" value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="all">All types</option><option value="clinic">Clinic</option><option value="hospital">Hospital</option><option value="primary care">Primary care</option><option value="emergency">Emergency</option></select>
      <select aria-label="Specialty" value={f.specialty} onChange={e=>setF({...f,specialty:e.target.value})}><option value="all">All specialties</option><option>General Medicine</option><option>Internal Medicine</option><option>Emergency</option></select>
      <Button variant="ghost" onClick={()=>{setF(blank);setLoc(null);}}>Clear filters</Button></div></Card>
      <Async state={st}>{list=>!list.length?<Empty title="No facilities found" text="Try widening the radius or clearing filters."/>:list.map(c=><Card key={c.id} className="clinic"><h3>{c.name}</h3><div className="row wrap"><Badge tone="teal">{c.type}</Badge>{c.distanceKm!=null&&<Badge>{c.distanceKm} km</Badge>}</div><small>{c.address}</small>
        <div className="row wrap"><a className="btn secondary" href={svc.getDirectionsUrl(c)} target="_blank" rel="noreferrer"><Navigation size={16}/>Directions</a>
          {c.phone?<a className="btn secondary" href={`tel:${c.phone}`}><Phone size={16}/>Call</a>:<Button variant="secondary" disabled>No phone listed</Button>}<Button variant="ghost" onClick={()=>setSel(c)}>View details</Button></div></Card>)}</Async></div>
    <div className="map"><Map size={32}/><b>Map not configured</b><p>No map provider key is set, so no interactive map is shown. Connect a maps provider to render facilities here; the list shows results from the clinic service.</p><Badge tone="amber">Sample facilities are fictional</Badge></div>
    {sel&&<Modal title={sel.name} onClose={()=>setSel(null)}><dl className="dl"><dt>Type</dt><dd>{sel.type}</dd><dt>Address</dt><dd>{sel.address}</dd><dt>Specialties</dt><dd>{sel.specialties.join(', ')}</dd><dt>Services</dt><dd>Not verified</dd></dl></Modal>}</div>;
}
