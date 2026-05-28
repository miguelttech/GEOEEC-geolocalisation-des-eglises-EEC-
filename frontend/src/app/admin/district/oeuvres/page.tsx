'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, useOutside } from '@/components/admin/atoms';
import { OEUVRES_DISTRICT, PAROISSES_DISTRICT } from '@/components/admin/dataDistrict';
import { OEUVRE_TYPES } from '@/components/admin/data';

const C = '#9B72CF';
const DISTRICT = 'Bafoussam Centre';
const REGION = 'MIFI';

interface Toast { id:number; type:'success'|'info'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id = Date.now(); setToasts(p => [...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

const TYPE_COLOR: Record<string, string> = {
  Scolaire:'#5B9BD5', Médical:'#5AC472', Agropastoral:'#E67A2E', Immeuble:'#94A3B8',
  Social:'#FFD600', Artisanal:C, Autre:'#475569',
};

function TypePill({ type }: { type: string }) {
  const color = TYPE_COLOR[type] || '#94A3B8';
  return <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:color+'18', color }}>{type}</span>;
}

function RowMenu({ onView, onEdit, onPdf }: { onView:()=>void; onEdit:()=>void; onPdf:()=>void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o=>!o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top:'calc(100% + 4px)', right:0, minWidth:180 }}>
          <button onClick={()=>{setOpen(false);onView();}}><I.eye size={13}/>Voir les détails</button>
          <button onClick={()=>{setOpen(false);onEdit();}}><I.pencil size={13}/>Modifier</button>
          <button onClick={()=>{setOpen(false);onPdf();}}><I.download size={13}/>Générer PDF</button>
        </div>
      )}
    </div>
  );
}

function OeuvreFormPanel({ o, onClose, onSave }: { o: any; onClose:()=>void; onSave:()=>void }) {
  const isNew = !o;
  const paroisseOptions = PAROISSES_DISTRICT.map(p => p.nom);
  const [nom, setNom] = React.useState(o?.nom || '');
  const [type, setType] = React.useState(o?.type || 'Scolaire');
  const [paroisse, setParoisse] = React.useState(o?.paroisse || paroisseOptions[0]);
  const [beneficiaires, setBeneficiaires] = React.useState(String(o?.beneficiaires || ''));
  const [annee, setAnnee] = React.useState(String(o?.annee || new Date().getFullYear()));
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:480 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{isNew ? 'Nouvelle œuvre' : `Modifier — ${o?.nom}`}</h2>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 130px)', display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>RÉGION</div>
            <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
              <I.shield size={12}/> {REGION} — scopée
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>DISTRICT</div>
            <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
              <I.shield size={12}/> {DISTRICT} — scopé
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM DE L'ŒUVRE *</label>
            <input className="input" value={nom} onChange={e=>setNom(e.target.value)} placeholder="Ex : École primaire EPC..." style={{ width:'100%' }}/>
          </div>
          <Dropdown label="TYPE D'ŒUVRE" value={type} options={OEUVRE_TYPES.map(t=>t.key)} onChange={setType}/>
          <Dropdown label="PAROISSE LIÉE" value={paroisse} options={paroisseOptions} onChange={setParoisse}/>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>BÉNÉFICIAIRES</label>
            <input className="input" type="number" value={beneficiaires} onChange={e=>setBeneficiaires(e.target.value)} placeholder="0" style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>ANNÉE DE CRÉATION</label>
            <input className="input" type="number" value={annee} onChange={e=>setAnnee(e.target.value)} placeholder="2024" style={{ width:'100%' }}/>
          </div>
        </div>
        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={onSave}>
            <I.check size={14}/>{isNew ? 'Créer' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OeuvresDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [typeFilter, setTypeFilter] = React.useState('Tous types');
  const [search, setSearch] = React.useState('');
  const [editO, setEditO] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);

  const types = ['Tous types', ...Array.from(new Set(OEUVRES_DISTRICT.map(o => o.type)))];

  const filtered = OEUVRES_DISTRICT.filter(o => {
    if (typeFilter !== 'Tous types' && o.type !== typeFilter) return false;
    if (search && !o.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const typeCounts = OEUVRE_TYPES.map(t => ({ key: t.key, color: t.color, count: OEUVRES_DISTRICT.filter(o => o.type === t.key).length }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Type mini-stats */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {typeCounts.filter(t => t.count > 0).map(t => (
          <div key={t.key} className="card" style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', flex:'0 0 auto' }}
            onClick={() => setTypeFilter(typeFilter === t.key ? 'Tous types' : t.key)}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:t.color, flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'var(--text-2)' }}>{t.key}</span>
            <span className="sg-md" style={{ fontSize:14, color:t.color }}>{t.count}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200, maxWidth:320 }}>
          <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une œuvre…" style={{ width:'100%' }}/>
        </div>
        <Dropdown value={typeFilter} options={types} onChange={setTypeFilter} width={160}/>
        <button className="btn" style={{ marginLeft:'auto', background:C, color:'#fff', border:`1px solid ${C}` }}
          onClick={() => { setEditO(null); setShowForm(true); }}><I.plus size={14}/>Nouvelle œuvre</button>
      </div>

      <div style={{ fontSize:12, color:'var(--text-3)' }}>
        <b style={{ color:'var(--text)' }}>{filtered.length}</b> œuvre{filtered.length > 1 ? 's' : ''} · {DISTRICT}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Nom</th><th>Type</th><th>Paroisse</th><th style={{textAlign:'right'}}>Bénéficiaires</th><th>Année</th><th>Statut</th><th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td style={{ fontWeight:500 }}>{o.nom}</td>
                <td><TypePill type={o.type}/></td>
                <td style={{ fontSize:12, color:'var(--text-2)' }}>{o.paroisse}</td>
                <td className="mono" style={{ textAlign:'right' }}>{o.beneficiaires?.toLocaleString('fr') ?? '—'}</td>
                <td className="mono" style={{ color:'var(--text-3)', fontSize:12 }}>{o.annee}</td>
                <td><span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600, background:'rgba(90,196,114,0.12)', color:'#5AC472' }}>Actif</span></td>
                <td>
                  <RowMenu onView={() => {}} onEdit={() => { setEditO(o); setShowForm(true); }}
                    onPdf={() => addToast({ type:'info', title:'Génération PDF…', body:o.nom })}/>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>Aucune œuvre trouvée</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && <OeuvreFormPanel o={editO} onClose={() => { setShowForm(false); setEditO(null); }}
        onSave={() => { setShowForm(false); setEditO(null); addToast({ type:'success', title: editO ? 'Œuvre modifiée' : 'Œuvre créée' }); }}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
