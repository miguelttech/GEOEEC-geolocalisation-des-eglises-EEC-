'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, StatusPill, NiveauPill, GpsCell, CompleteBar, useOutside } from '@/components/admin/atoms';
import { PAROISSES_DISTRICT, ParoisseDistrict } from '@/components/admin/dataDistrict';

const C = '#9B72CF';
const DISTRICT = 'Bafoussam Centre';
const REGION = 'MIFI';

interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id = Date.now(); setToasts(p => [...p,{...t,id}]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t => <div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body && <div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function RowMenu({ onView, onEdit }: { onView: () => void; onEdit: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 180 }}>
          <button onClick={() => { setOpen(false); onView(); }}><I.eye size={13}/>Voir les détails</button>
          <button onClick={() => { setOpen(false); onEdit(); }}><I.pencil size={13}/>Modifier</button>
          <button onClick={() => setOpen(false)}><I.download size={13}/>Exporter PDF</button>
        </div>
      )}
    </div>
  );
}

function ParoisseViewPanel({ p, onClose, onEdit }: { p: ParoisseDistrict; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{p.nom}</h2>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{REGION} · {DISTRICT}</div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-outline" style={{ padding:'6px 12px', fontSize:12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 72px)', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <NiveauPill niveau={p.niveau}/><StatusPill statut={p.statut}/><GpsCell ok={p.gps}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[{label:'Fidèles', value:p.fideles.toLocaleString('fr'), color:'#5AC472'},{label:'Ouvriers', value:p.ouvriers, color:'var(--text)'}].map(s => (
              <div key={s.label} className="card" style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize:20, marginTop:4, color:s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Localisation</div>
            {[{label:'Région', value:REGION},{label:'District', value:DISTRICT},{label:'Niveau', value:p.niveau}].map(r => (
              <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                <span style={{ color:'var(--text-3)' }}>{r.label}</span>
                <span style={{ fontWeight:500 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Complétion de fiche</div>
            <CompleteBar pct={p.complete} />
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:6 }}>{p.complete}% des champs renseignés</div>
          </div>
          <div style={{ fontSize:11, color:'var(--text-3)', borderTop:'1px solid var(--border)', paddingTop:10 }}>
            Modifié {p.modifie} · par {p.modPar}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParoisseFormPanel({ p, onClose, onSave }: { p: ParoisseDistrict | null; onClose: () => void; onSave: () => void }) {
  const isNew = !p;
  const [nom, setNom] = React.useState(p?.nom || '');
  const [niveau, setNiveau] = React.useState(p?.niveau || 'PAROISSE');
  const [fideles, setFideles] = React.useState(String(p?.fideles || ''));
  const [statut, setStatut] = React.useState(p?.statut || 'actif');
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>{isNew ? 'Nouvelle paroisse' : `Modifier — ${p?.nom}`}</h2>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 130px)', display:'flex', flexDirection:'column', gap:14 }}>
          {/* Champs verrouillés */}
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>RÉGION</div>
            <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
              <I.shield size={12}/> {REGION} — scopée à votre portée
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>DISTRICT</div>
            <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
              <I.shield size={12}/> {DISTRICT} — scopée à votre portée
            </div>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM DE LA PAROISSE *</label>
            <input className="input" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Bafoussam-Cite" style={{ width:'100%' }}/>
          </div>
          <div>
            <Dropdown label="NIVEAU" value={niveau} options={['PAROISSE','STATION','ANNEXE']} onChange={v => setNiveau(v as any)}/>
          </div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>FIDÈLES TOTAUX</label>
            <input className="input" type="number" value={fideles} onChange={e => setFideles(e.target.value)} placeholder="0" style={{ width:'100%' }}/>
          </div>
          <div>
            <Dropdown label="STATUT" value={statut} options={['actif','en_attente','inactif']} onChange={v => setStatut(v as 'actif'|'inactif'|'en_attente')}/>
          </div>
          <div style={{ background:`rgba(155,114,207,0.06)`, border:`1px solid rgba(155,114,207,0.20)`, borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(155,114,207,0.85)' }}>
            <I.shield size={12}/> Les modifications seront soumises à la région MIFI pour validation finale.
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

const PER_PAGE = 10;

export default function ParoisseDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [niveau, setNiveau] = React.useState('Tous niveaux');
  const [gps, setGps] = React.useState('GPS — tous');
  const [statut, setStatut] = React.useState('Tous statuts');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [viewP, setViewP] = React.useState<ParoisseDistrict | null>(null);
  const [editP, setEditP] = React.useState<ParoisseDistrict | null | 'new'>( null);
  const [showForm, setShowForm] = React.useState(false);

  const filtered = PAROISSES_DISTRICT.filter(p => {
    if (niveau !== 'Tous niveaux' && p.niveau !== niveau) return false;
    if (gps === 'Avec GPS' && !p.gps) return false;
    if (gps === 'Sans GPS' && p.gps) return false;
    if (statut !== 'Tous statuts' && p.statut !== statut) return false;
    if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:200, maxWidth:300 }}>
          <input className="input" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher une paroisse…" style={{ width:'100%' }}/>
        </div>
        <Dropdown value={niveau} options={['Tous niveaux','PAROISSE','STATION','ANNEXE']} onChange={v => { setNiveau(v); setPage(1); }} width={160}/>
        <Dropdown value={gps}    options={['GPS — tous','Avec GPS','Sans GPS']}           onChange={v => { setGps(v);    setPage(1); }} width={140}/>
        <Dropdown value={statut} options={['Tous statuts','actif','en_attente','inactif']} onChange={v => { setStatut(v); setPage(1); }} width={150}/>
        <button className="btn" style={{ marginLeft:'auto', background:C, color:'#fff', border:`1px solid ${C}` }}
          onClick={() => { setEditP('new'); setShowForm(true); }}><I.plus size={14}/>Nouvelle paroisse</button>
      </div>

      <div style={{ fontSize:12, color:'var(--text-3)' }}>
        <b style={{ color:'var(--text)' }}>{filtered.length}</b> paroisse{filtered.length > 1 ? 's' : ''} · district {DISTRICT}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Paroisse</th>
              <th>Niveau</th>
              <th style={{ textAlign:'right' }}>Fidèles</th>
              <th style={{ textAlign:'right' }}>Ouvriers</th>
              <th>GPS</th>
              <th>Score</th>
              <th>Statut</th>
              <th>Modifié</th>
              <th style={{ width:40 }}></th>
            </tr>
          </thead>
          <tbody>
            {paged.map(p => (
              <tr key={p.id} onClick={() => setViewP(p)} style={{ cursor:'pointer' }}>
                <td style={{ fontWeight:500 }}>{p.nom}</td>
                <td><NiveauPill niveau={p.niveau}/></td>
                <td className="mono" style={{ textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{p.fideles.toLocaleString('fr')}</td>
                <td className="mono" style={{ textAlign:'right' }}>{p.ouvriers}</td>
                <td><GpsCell ok={p.gps}/></td>
                <td style={{ width:100 }}><CompleteBar pct={p.complete}/></td>
                <td><StatusPill statut={p.statut}/></td>
                <td style={{ fontSize:11, color:'var(--text-3)' }}>{p.modifie}</td>
                <td onClick={e => e.stopPropagation()}>
                  <RowMenu onView={() => setViewP(p)} onEdit={() => { setEditP(p); setShowForm(true); }}/>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>
                <I.church size={36} style={{ opacity:0.3, display:'block', margin:'0 auto 8px' }}/>Aucune paroisse correspondante
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} className={`btn btn-ghost${page === i+1 ? ' active' : ''}`}
              style={{ padding:'4px 10px', fontSize:12, ...(page===i+1 ? {background:`rgba(155,114,207,0.15)`,color:C} : {}) }}
              onClick={() => setPage(i+1)}>{i+1}</button>
          ))}
        </div>
      )}

      {viewP && !showForm && <ParoisseViewPanel p={viewP} onClose={() => setViewP(null)} onEdit={() => { setEditP(viewP); setShowForm(true); setViewP(null); }}/>}
      {showForm && <ParoisseFormPanel p={editP === 'new' ? null : editP} onClose={() => { setShowForm(false); setEditP(null); }}
        onSave={() => { setShowForm(false); setEditP(null); addToast({ type:'success', title: editP === 'new' ? 'Paroisse créée' : 'Modifications enregistrées', body:'En attente de validation régionale' }); }}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
