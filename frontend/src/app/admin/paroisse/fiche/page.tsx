'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { I } from '@/components/admin/icons';
import { CompleteBar } from '@/components/admin/atoms';
import { MOCK_PAROISSE, CHAMPS_COMPLETION } from '@/components/admin/dataParoisse';

const C = '#E67A2E';
const MiniLeafletMap = dynamic(() => import('@/components/admin/MiniLeafletMap'), { ssr: false });

interface Toast { id:number; type:'success'|'info'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function Section({ title, children }: { title:string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border)', paddingBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

function LockedField({ label, value }: { label:string; value:string }) {
  return (
    <div>
      <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>{label}</div>
      <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={11}/> {value}
      </div>
    </div>
  );
}

export default function FicheParoissePage() {
  const { toasts, add: addToast } = useToast();
  const [editMode, setEditMode] = React.useState(false);
  const [pasteur, setPasteur] = React.useState(MOCK_PAROISSE.pasteur);
  const [adresse, setAdresse] = React.useState(MOCK_PAROISSE.adresse);
  const [contact, setContact] = React.useState(MOCK_PAROISSE.contact);
  const [description, setDescription] = React.useState(MOCK_PAROISSE.description);
  const [communiants, setCommuniants] = React.useState(String(MOCK_PAROISSE.communiants));
  const [nonCommuniants, setNonCommuniants] = React.useState(String(MOCK_PAROISSE.nonCommuniants));
  const [baptemes, setBaptemes] = React.useState(String(MOCK_PAROISSE.baptemes));
  const [mariages, setMariages] = React.useState(String(MOCK_PAROISSE.mariages));
  const [deces, setDeces] = React.useState(String(MOCK_PAROISSE.deces));
  const [lat, setLat] = React.useState(String(MOCK_PAROISSE.lat));
  const [lng, setLng] = React.useState(String(MOCK_PAROISSE.lng));

  const renseignes = CHAMPS_COMPLETION.filter(c => c.renseigne).length;
  const pct = Math.round(renseignes / CHAMPS_COMPLETION.length * 100);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* En-tête */}
      <div className="card" style={{ padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 className="sg" style={{ fontSize:22, margin:0 }}>{MOCK_PAROISSE.nom}</h1>
            <span style={{ padding:'3px 10px', borderRadius:4, fontSize:12, fontWeight:700, background:`rgba(230,122,46,0.15)`, color:C }}>PAROISSE</span>
            <span style={{ padding:'3px 10px', borderRadius:4, fontSize:12, fontWeight:700, background:'rgba(90,196,114,0.12)', color:'#5AC472' }}>Actif</span>
          </div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>{MOCK_PAROISSE.district} · {MOCK_PAROISSE.region} · Modifié {MOCK_PAROISSE.modifie} par {MOCK_PAROISSE.modPar}</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-3)' }}>Complétion</div>
          <div style={{ width:100 }}><CompleteBar pct={pct}/></div>
          <div style={{ fontSize:13, fontWeight:700, color:C }}>{pct}%</div>
          {!editMode
            ? <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}`, marginLeft:8 }} onClick={() => setEditMode(true)}><I.pencil size={14}/>Modifier la fiche</button>
            : <><button className="btn btn-ghost" onClick={() => setEditMode(false)}>Annuler</button>
               <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>{setEditMode(false); addToast({type:'warn',title:'Proposition soumise',body:'Modifications envoyées au district Bafoussam Centre pour validation'});}}>
                 <I.check size={14}/>Proposer la modification
               </button></>
          }
        </div>
      </div>

      {/* Bandeau si en édition */}
      {editMode && (
        <div style={{ background:'rgba(255,193,7,0.07)', border:'1px solid rgba(255,193,7,0.25)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(255,193,7,0.90)', display:'flex', alignItems:'center', gap:8 }}>
          <I.shield size={13}/>
          Mode édition activé. Vos modifications seront soumises au <b>district Bafoussam Centre</b> pour validation avant publication.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Colonne gauche */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <Section title="Identité">
            <LockedField label="RÉGION" value={MOCK_PAROISSE.region + ' — scopée'}/>
            <LockedField label="DISTRICT" value={MOCK_PAROISSE.district + ' — scopé'}/>
            <LockedField label="CATÉGORIE" value={MOCK_PAROISSE.categorie + ' — modifiable par Admin District uniquement'}/>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>PASTEUR EN CHARGE</div>
              {editMode
                ? <input className="input" value={pasteur} onChange={e=>setPasteur(e.target.value)} style={{ width:'100%' }}/>
                : <div style={{ fontSize:13, padding:'9px 0' }}>{pasteur}</div>}
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>ADRESSE PHYSIQUE</div>
              {editMode
                ? <input className="input" value={adresse} onChange={e=>setAdresse(e.target.value)} style={{ width:'100%' }}/>
                : <div style={{ fontSize:13, padding:'9px 0' }}>{adresse}</div>}
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>CONTACT</div>
              {editMode
                ? <input className="input" value={contact} onChange={e=>setContact(e.target.value)} style={{ width:'100%' }}/>
                : <div style={{ fontSize:13, padding:'9px 0' }}>{contact}</div>}
            </div>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>DESCRIPTION</div>
              {editMode
                ? <textarea className="input" value={description} onChange={e=>setDescription(e.target.value)} rows={3} style={{ width:'100%', resize:'vertical' }}/>
                : <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.5, padding:'4px 0' }}>{description}</div>}
            </div>
          </Section>

          <Section title="Statistiques 2025">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { label:'COMMUNIANTS',    val:communiants,    set:setCommuniants,    color:'#5AC472' },
                { label:'NON-COMMUNIANTS',val:nonCommuniants, set:setNonCommuniants, color:'var(--text)' },
                { label:'BAPTÊMES',       val:baptemes,       set:setBaptemes,       color:'#5B9BD5' },
                { label:'MARIAGES',       val:mariages,       set:setMariages,       color:'#5AC472' },
                { label:'DÉCÈS',          val:deces,          set:setDeces,          color:'#94A3B8' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>{f.label}</div>
                  {editMode
                    ? <input className="input" type="number" value={f.val} onChange={e=>f.set(e.target.value)} style={{ width:'100%' }}/>
                    : <div className="sg-md" style={{ fontSize:22, color:f.color, paddingTop:4 }}>{Number(f.val).toLocaleString('fr')}</div>}
                </div>
              ))}
            </div>
          </Section>

        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <Section title="Géolocalisation GPS">
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: MOCK_PAROISSE.gps ? '#5AC472' : '#FF8A7A' }}/>
              <span style={{ fontSize:13, color: MOCK_PAROISSE.gps ? '#5AC472' : '#FF8A7A', fontWeight:600 }}>
                {MOCK_PAROISSE.gps ? '✓ Coordonnées GPS renseignées' : '✗ Aucune coordonnée GPS'}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>LATITUDE</div>
                {editMode
                  ? <input className="input mono" value={lat} onChange={e=>setLat(e.target.value)} style={{ width:'100%' }}/>
                  : <div className="mono" style={{ fontSize:13, padding:'9px 0', color:C }}>{lat}</div>}
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>LONGITUDE</div>
                {editMode
                  ? <input className="input mono" value={lng} onChange={e=>setLng(e.target.value)} style={{ width:'100%' }}/>
                  : <div className="mono" style={{ fontSize:13, padding:'9px 0', color:C }}>{lng}</div>}
              </div>
            </div>
            <div style={{ height:220, borderRadius:8, overflow:'hidden' }}>
              <MiniLeafletMap height={220}/>
            </div>
            {editMode && <div style={{ fontSize:11, color:'var(--text-3)' }}>La modification GPS est soumise au district pour validation.</div>}
          </Section>

          <Section title="Complétion de la fiche">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ flex:1 }}><CompleteBar pct={pct}/></div>
              <div style={{ fontSize:18, fontWeight:700, color:C }}>{pct}%</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {CHAMPS_COMPLETION.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                  <span style={{ color: c.renseigne ? '#5AC472' : '#FF8A7A', flexShrink:0 }}>{c.renseigne ? '✓' : '✗'}</span>
                  <span style={{ color: c.renseigne ? 'var(--text-2)' : 'var(--text-3)' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

      <ToastStack toasts={toasts}/>
    </div>
  );
}
