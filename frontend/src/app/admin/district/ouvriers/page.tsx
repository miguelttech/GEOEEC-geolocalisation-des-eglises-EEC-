'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, useOutside } from '@/components/admin/atoms';
import { OUVRIERS_DISTRICT, PAROISSES_DISTRICT } from '@/components/admin/dataDistrict';

const C = '#9B72CF';
const DISTRICT = 'Bafoussam Centre';
const REGION = 'MIFI';

const GRADES = ['Pasteur','Aide-Pasteur','Prédicateur','Évangéliste','Aide-Évangéliste','Catéchiste','Diacre','Autre'];

interface Toast { id:number; type:'success'|'info'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function GradePill({ grade }: { grade: string }) {
  const colors: Record<string,string> = { Pasteur:'#5B9BD5','Aide-Pasteur':'#7BAED4', Prédicateur:C, Évangéliste:'#5AC472','Aide-Évangéliste':'#7ED49A', Catéchiste:'#E67A2E', Diacre:'#FFD600' };
  const color = colors[grade] || '#94A3B8';
  return <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:color+'18', color }}>{grade}</span>;
}

function RowMenu({ onView, onEdit }: { onView:()=>void; onEdit:()=>void }) {
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
        </div>
      )}
    </div>
  );
}

function OuvrierViewPanel({ o, onClose }: { o: any; onClose:()=>void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:440 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:o.color+'22', color:o.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>{o.initials}</div>
            <div>
              <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{o.nom}</h2>
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{o.grade}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 72px)', display:'flex', flexDirection:'column', gap:14 }}>
          <div className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Affectation</div>
            {[{label:'Région', v:REGION},{label:'District', v:DISTRICT},{label:'Paroisse', v:o.paroisse}].map(r=>(
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text-3)' }}>{r.label}</span><span style={{ fontWeight:500 }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Contact</div>
            {[{label:'Téléphone', v:o.tel},{label:'Email', v:o.email}].map(r=>(
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text-3)' }}>{r.label}</span><span className="mono" style={{ fontSize:12 }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>En poste depuis</div>
            <div style={{ fontSize:13 }}>{new Date(o.priseFonction).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' })}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: o.statut==='actif' ? '#5AC472' : '#FF8A7A', flexShrink:0 }}/>
            <span style={{ fontSize:12, color:'var(--text-2)', textTransform:'capitalize' }}>{o.statut}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OuvrierFormPanel({ o, onClose, onSave }: { o: any; onClose:()=>void; onSave:()=>void }) {
  const isNew = !o;
  const paroisseOptions = PAROISSES_DISTRICT.map(p => p.nom);
  const [nom, setNom] = React.useState(o?.nom || '');
  const [grade, setGrade] = React.useState(o?.grade || 'Pasteur');
  const [paroisse, setParoisse] = React.useState(o?.paroisse || paroisseOptions[0]);
  const [tel, setTel] = React.useState(o?.tel || '');
  const [email, setEmail] = React.useState(o?.email || '');
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:480 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{isNew ? 'Nouvel ouvrier' : `Modifier — ${o?.nom}`}</h2>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 130px)', display:'flex', flexDirection:'column', gap:14 }}>
          {[{label:'RÉGION', val:REGION},{label:'DISTRICT', val:DISTRICT}].map(f => (
            <div key={f.label}>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>{f.label}</div>
              <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
                <I.shield size={12}/> {f.val} — scopé
              </div>
            </div>
          ))}
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM COMPLET *</label>
            <input className="input" value={nom} onChange={e=>setNom(e.target.value)} placeholder="NOM Prénom" style={{ width:'100%' }}/>
          </div>
          <Dropdown label="GRADE" value={grade} options={GRADES} onChange={setGrade}/>
          <Dropdown label="PAROISSE D'AFFECTATION" value={paroisse} options={paroisseOptions} onChange={setParoisse}/>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>TÉLÉPHONE</label>
            <input className="input" value={tel} onChange={e=>setTel(e.target.value)} placeholder="+237 6xx xx xx xx" style={{ width:'100%' }}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>EMAIL</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom.nom@eec.cm" style={{ width:'100%' }}/>
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

export default function OuvriersDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [gradeFilter, setGradeFilter] = React.useState('Tous grades');
  const [paroisseFilter, setParoisseFilter] = React.useState('Toutes paroisses');
  const [search, setSearch] = React.useState('');
  const [viewO, setViewO] = React.useState<any>(null);
  const [editO, setEditO] = React.useState<any>(null);
  const [showForm, setShowForm] = React.useState(false);

  const paroisseOptions = ['Toutes paroisses', ...Array.from(new Set(OUVRIERS_DISTRICT.map(o => o.paroisse)))];

  const filtered = OUVRIERS_DISTRICT.filter(o => {
    if (gradeFilter !== 'Tous grades' && o.grade !== gradeFilter) return false;
    if (paroisseFilter !== 'Toutes paroisses' && o.paroisse !== paroisseFilter) return false;
    if (search && !o.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const gradeCounts = GRADES.map(g => ({ grade:g, count: OUVRIERS_DISTRICT.filter(o => o.grade === g).length })).filter(g => g.count > 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Grade mini-stats */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {gradeCounts.map(g => (
          <div key={g.grade} className="card" style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:8, cursor:'pointer', flex:'0 0 auto' }}
            onClick={() => setGradeFilter(gradeFilter === g.grade ? 'Tous grades' : g.grade)}>
            <span style={{ fontSize:11, color:'var(--text-2)' }}>{g.grade}</span>
            <span className="sg-md" style={{ fontSize:14, color:C }}>{g.count}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200, maxWidth:300 }}>
          <input className="input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher un ouvrier…" style={{ width:'100%' }}/>
        </div>
        <Dropdown value={gradeFilter}    options={['Tous grades', ...GRADES]}  onChange={setGradeFilter}    width={170}/>
        <Dropdown value={paroisseFilter} options={paroisseOptions}             onChange={setParoisseFilter} width={200}/>
        <button className="btn" style={{ marginLeft:'auto', background:C, color:'#fff', border:`1px solid ${C}` }}
          onClick={() => { setEditO(null); setShowForm(true); }}><I.plus size={14}/>Nouvel ouvrier</button>
      </div>

      <div style={{ fontSize:12, color:'var(--text-3)' }}>
        <b style={{ color:'var(--text)' }}>{filtered.length}</b> ouvrier{filtered.length > 1 ? 's' : ''} · {DISTRICT}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead>
            <tr><th>Ouvrier</th><th>Grade</th><th>Paroisse</th><th>Téléphone</th><th>Email</th><th>Statut</th><th style={{width:40}}></th></tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} onClick={() => setViewO(o)} style={{ cursor:'pointer' }}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:o.color+'22', color:o.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{o.initials}</div>
                    <span style={{ fontWeight:500 }}>{o.nom}</span>
                  </div>
                </td>
                <td><GradePill grade={o.grade}/></td>
                <td style={{ fontSize:12, color:'var(--text-2)' }}>{o.paroisse}</td>
                <td className="mono" style={{ fontSize:11 }}>{o.tel}</td>
                <td className="mono" style={{ fontSize:11, color:'var(--text-3)' }}>{o.email}</td>
                <td><div style={{ display:'flex', alignItems:'center', gap:6 }}><div style={{ width:6, height:6, borderRadius:'50%', background: o.statut==='actif' ? '#5AC472' : '#FF8A7A' }}/><span style={{ fontSize:11, textTransform:'capitalize', color:'var(--text-2)' }}>{o.statut}</span></div></td>
                <td onClick={e=>e.stopPropagation()}>
                  <RowMenu onView={() => setViewO(o)} onEdit={() => { setEditO(o); setShowForm(true); }}/>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>Aucun ouvrier trouvé</td></tr>}
          </tbody>
        </table>
      </div>

      {viewO && !showForm && <OuvrierViewPanel o={viewO} onClose={() => setViewO(null)}/>}
      {showForm && <OuvrierFormPanel o={editO} onClose={() => { setShowForm(false); setEditO(null); }}
        onSave={() => { setShowForm(false); setEditO(null); addToast({ type:'success', title: editO ? 'Ouvrier modifié' : 'Ouvrier créé' }); }}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
