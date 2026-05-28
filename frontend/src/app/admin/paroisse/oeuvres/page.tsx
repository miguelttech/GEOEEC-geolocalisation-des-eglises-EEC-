'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { useOutside } from '@/components/admin/atoms';
import { OEUVRES_PAROISSE } from '@/components/admin/dataParoisse';
import { OEUVRE_TYPES } from '@/components/admin/data';

const C = '#E67A2E';
const PAROISSE = 'Bafoussam-Centre';
const DISTRICT = 'Bafoussam Centre';
const REGION = 'MIFI';

interface Toast { id:number; type:'success'|'info'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

const TYPE_COLOR: Record<string,string> = { Scolaire:'#5B9BD5', Médical:'#5AC472', Social:'#FFD600', Immeuble:'#94A3B8', Agropastoral:C };

function RowMenu({ onView, onEdit }: { onView:()=>void; onEdit:()=>void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, ()=>setOpen(false));
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button className="icon-btn" onClick={()=>setOpen(o=>!o)}><I.more size={15}/></button>
      {open && <div className="menu" style={{ top:'calc(100% + 4px)', right:0, minWidth:160 }}>
        <button onClick={()=>{setOpen(false);onView();}}><I.eye size={13}/>Voir</button>
        <button onClick={()=>{setOpen(false);onEdit();}}><I.pencil size={13}/>Modifier</button>
      </div>}
    </div>
  );
}

function OeuvreFormPanel({ o, onClose, onSave }: { o:any; onClose:()=>void; onSave:()=>void }) {
  const isNew = !o;
  const [nom, setNom] = React.useState(o?.nom||'');
  const [type, setType] = React.useState(o?.type||'Scolaire');
  const [benef, setBenef] = React.useState(String(o?.beneficiaires||''));
  const [annee, setAnnee] = React.useState(String(o?.annee||new Date().getFullYear()));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:460 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{isNew?'Nouvelle œuvre':`Modifier — ${o?.nom}`}</h2>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 130px)', display:'flex', flexDirection:'column', gap:14 }}>
          {[{label:'RÉGION',value:REGION},{label:'DISTRICT',value:DISTRICT},{label:'PAROISSE',value:PAROISSE}].map(f=>(
            <div key={f.label}>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>{f.label}</div>
              <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
                <I.shield size={12}/> {f.value} — scopé
              </div>
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM DE L'ŒUVRE *</label>
            <input className="input" value={nom} onChange={e=>setNom(e.target.value)} style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>TYPE</label>
            <select className="input" value={type} onChange={e=>setType(e.target.value)} style={{ width:'100%' }}>
              {OEUVRE_TYPES.map(t=><option key={t.key} value={t.key}>{t.key}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>BÉNÉFICIAIRES</label>
            <input className="input" type="number" value={benef} onChange={e=>setBenef(e.target.value)} style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>ANNÉE DE CRÉATION</label>
            <input className="input" type="number" value={annee} onChange={e=>setAnnee(e.target.value)} style={{ width:'100%' }}/>
          </div>
          <div style={{ background:'rgba(255,193,7,0.06)', border:'1px solid rgba(255,193,7,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(255,193,7,0.85)' }}>
            <I.shield size={12}/> Soumis au district Bafoussam Centre pour validation.
          </div>
        </div>
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={onSave}><I.check size={14}/>{isNew?'Proposer':'Proposer la modification'}</button>
        </div>
      </div>
    </div>
  );
}

export default function OeuvresParoissePage() {
  const { toasts, add: addToast } = useToast();
  const [editO, setEditO] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(230,122,46,0.06)', border:'1px solid rgba(230,122,46,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(230,122,46,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={13}/> Œuvres liées à la paroisse Bafoussam-Centre. Modifications soumises au district pour validation.
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>{setEditO(null);setShowForm(true);}}><I.plus size={14}/>Proposer une œuvre</button>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead><tr><th>Nom</th><th>Type</th><th style={{textAlign:'right'}}>Bénéficiaires</th><th>Année</th><th>Responsable</th><th>Statut</th><th style={{width:40}}></th></tr></thead>
          <tbody>
            {OEUVRES_PAROISSE.map(o=>(
              <tr key={o.id}>
                <td style={{ fontWeight:500 }}>{o.nom}</td>
                <td>
                  <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:(TYPE_COLOR[o.type]||'#94A3B8')+'18', color:TYPE_COLOR[o.type]||'#94A3B8' }}>{o.type}</span>
                </td>
                <td className="mono" style={{ textAlign:'right' }}>{o.beneficiaires?.toLocaleString('fr')??'—'}</td>
                <td className="mono" style={{ color:'var(--text-3)',fontSize:12 }}>{o.annee}</td>
                <td style={{ fontSize:12, color:'var(--text-2)' }}>{o.responsable}</td>
                <td><span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600, background:'rgba(90,196,114,0.12)', color:'#5AC472' }}>Actif</span></td>
                <td><RowMenu onView={()=>{}} onEdit={()=>{setEditO(o);setShowForm(true);}}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showForm && <OeuvreFormPanel o={editO} onClose={()=>{setShowForm(false);setEditO(null);}}
        onSave={()=>{setShowForm(false);setEditO(null);addToast({type:'warn',title:'Proposition soumise',body:'En attente de validation — district Bafoussam Centre'});}}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
