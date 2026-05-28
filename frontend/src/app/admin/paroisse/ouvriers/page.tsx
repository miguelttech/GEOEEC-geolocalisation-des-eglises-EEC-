'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { useOutside } from '@/components/admin/atoms';
import { OUVRIERS_PAROISSE } from '@/components/admin/dataParoisse';

const C = '#E67A2E';
const PAROISSE = 'Bafoussam-Centre';
const DISTRICT = 'Bafoussam Centre';
const REGION = 'MIFI';
const GRADES = ['Pasteur','Aide-Pasteur','Prédicateur','Évangéliste','Aide-Évangéliste','Catéchiste','Diacre','Autre'];

interface Toast { id:number; type:'success'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function RowMenu({ onView }: { onView:()=>void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, ()=>setOpen(false));
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button className="icon-btn" onClick={()=>setOpen(o=>!o)}><I.more size={15}/></button>
      {open && <div className="menu" style={{ top:'calc(100% + 4px)', right:0, minWidth:140 }}>
        <button onClick={()=>{setOpen(false);onView();}}><I.eye size={13}/>Voir le profil</button>
      </div>}
    </div>
  );
}

function OuvrierViewPanel({ o, onClose }: { o:any; onClose:()=>void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:420 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:o.color+'22', color:o.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>{o.initials}</div>
            <div><h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{o.nom}</h2><div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{o.grade}</div></div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Affectation</div>
            {[{l:'Paroisse',v:PAROISSE},{l:'District',v:DISTRICT},{l:'Région',v:REGION}].map(r=>(
              <div key={r.l} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:'var(--text-3)' }}>{r.l}</span><span style={{ fontWeight:500 }}>{r.v}</span></div>
            ))}
          </div>
          <div className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Contact</div>
            {[{l:'Téléphone',v:o.tel},{l:'Email',v:o.email}].map(r=>(
              <div key={r.l} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}><span style={{ color:'var(--text-3)' }}>{r.l}</span><span className="mono" style={{ fontSize:12 }}>{r.v}</span></div>
            ))}
          </div>
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>En poste depuis</div>
            <div style={{ fontSize:13 }}>{new Date(o.priseFonction).toLocaleDateString('fr-FR',{year:'numeric',month:'long',day:'numeric'})}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OuvrierFormPanel({ onClose, onSave }: { onClose:()=>void; onSave:()=>void }) {
  const [nom, setNom] = React.useState('');
  const [grade, setGrade] = React.useState('Pasteur');
  const [tel, setTel] = React.useState('');
  const [email, setEmail] = React.useState('');
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:460 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>Proposer un ouvrier</h2>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 130px)', display:'flex', flexDirection:'column', gap:14 }}>
          {[{label:'RÉGION',val:REGION},{label:'DISTRICT',val:DISTRICT},{label:'PAROISSE',val:PAROISSE}].map(f=>(
            <div key={f.label}>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>{f.label}</div>
              <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
                <I.shield size={12}/> {f.val} — scopé
              </div>
            </div>
          ))}
          <div><label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM COMPLET *</label><input className="input" value={nom} onChange={e=>setNom(e.target.value)} placeholder="NOM Prénom" style={{ width:'100%' }}/></div>
          <div><label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>GRADE</label>
            <select className="input" value={grade} onChange={e=>setGrade(e.target.value)} style={{ width:'100%' }}>
              {GRADES.map(g=><option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>TÉLÉPHONE</label><input className="input" value={tel} onChange={e=>setTel(e.target.value)} placeholder="+237 6xx xx xx xx" style={{ width:'100%' }}/></div>
          <div><label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>EMAIL</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom.nom@eec.cm" style={{ width:'100%' }}/></div>
          <div style={{ background:'rgba(255,193,7,0.06)', border:'1px solid rgba(255,193,7,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(255,193,7,0.85)' }}>
            <I.shield size={12}/> Cette proposition sera soumise au district Bafoussam Centre pour validation.
          </div>
        </div>
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={onSave} disabled={!nom}><I.check size={14}/>Proposer au district</button>
        </div>
      </div>
    </div>
  );
}

export default function OuvriersParoissePage() {
  const { toasts, add: addToast } = useToast();
  const [viewO, setViewO] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(230,122,46,0.06)', border:'1px solid rgba(230,122,46,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(230,122,46,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={13}/> Ouvriers affectés à la paroisse Bafoussam-Centre. Les suppressions ne sont pas autorisées.
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:12, color:'var(--text-3)' }}><b style={{ color:'var(--text)' }}>{OUVRIERS_PAROISSE.length}</b> ouvriers affectés</div>
        <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>setShowForm(true)}><I.plus size={14}/>Proposer un ouvrier</button>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead><tr><th>Ouvrier</th><th>Grade</th><th>Téléphone</th><th>Email</th><th>En poste depuis</th><th>Statut</th><th style={{width:40}}></th></tr></thead>
          <tbody>
            {OUVRIERS_PAROISSE.map(o=>(
              <tr key={o.id} onClick={()=>setViewO(o)} style={{ cursor:'pointer' }}>
                <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><div style={{ width:28, height:28, borderRadius:'50%', background:o.color+'22', color:o.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{o.initials}</div><span style={{ fontWeight:500 }}>{o.nom}</span></div></td>
                <td><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:o.color+'18', color:o.color }}>{o.grade}</span></td>
                <td className="mono" style={{ fontSize:11 }}>{o.tel}</td>
                <td className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>{o.email}</td>
                <td style={{ fontSize:12, color:'var(--text-3)' }}>{new Date(o.priseFonction).toLocaleDateString('fr-FR',{year:'numeric',month:'short'})}</td>
                <td><div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:6, height:6, borderRadius:'50%', background:o.statut==='actif'?'#5AC472':'#FF8A7A' }}/><span style={{ fontSize:11, color:'var(--text-2)', textTransform:'capitalize' }}>{o.statut}</span></div></td>
                <td onClick={e=>e.stopPropagation()}><RowMenu onView={()=>setViewO(o)}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {viewO && <OuvrierViewPanel o={viewO} onClose={()=>setViewO(null)}/>}
      {showForm && <OuvrierFormPanel onClose={()=>setShowForm(false)} onSave={()=>{setShowForm(false);addToast({type:'warn',title:'Proposition soumise',body:'En attente de validation — district Bafoussam Centre'});}}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
