'use client';
import React from 'react';
import { I } from '@/components/admin/icons';

const C = '#9B72CF';

interface Toast { id:number; type:'success'|'info'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

const HISTORIQUE = [
  { date:'25/05/2026', type:'Import ouvriers', fichier:'ouvriers_BFS_Centre.xlsx', lignes:14, ok:14, erreurs:0, who:'Daniel AWONO' },
  { date:'10/05/2026', type:'Import œuvres',   fichier:'oeuvres_BFS_Centre.xlsx',  lignes:5,  ok:5,  erreurs:0, who:'Daniel AWONO' },
];

function UploadZone({ onFile }: { onFile: (name: string) => void }) {
  const [drag, setDrag] = React.useState(false);
  const [file, setFile] = React.useState<string|null>(null);
  return (
    <div
      onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)}
      onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f){setFile(f.name);onFile(f.name);}}}
      style={{ border:`2px dashed ${drag ? C : 'rgba(255,255,255,0.10)'}`, borderRadius:8, padding:'32px 24px', textAlign:'center', background: drag ? `rgba(155,114,207,0.05)` : 'transparent', transition:'all 200ms', cursor:'pointer' }}
      onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.xlsx,.xls,.csv'; i.onchange=()=>{if(i.files?.[0]){setFile(i.files[0].name);onFile(i.files[0].name);}}; i.click(); }}>
      <I.upload size={28} style={{ color: drag ? C : 'var(--text-3)', display:'block', margin:'0 auto 12px' }}/>
      {file
        ? <div style={{ fontSize:13, fontWeight:600, color:C }}>{file}</div>
        : <>
            <div style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>Glisser le fichier ici ou cliquer pour parcourir</div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>Formats acceptés : .xlsx, .xls, .csv</div>
          </>
      }
    </div>
  );
}

export default function IoDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState<'import'|'export'|'historique'>('import');
  const [step, setStep] = React.useState(1);
  const [modele, setModele] = React.useState<'ouvriers'|'oeuvres'>('ouvriers');
  const [fileName, setFileName] = React.useState<string|null>(null);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      <div style={{ background:`rgba(155,114,207,0.06)`, border:`1px solid rgba(155,114,207,0.20)`, borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(155,114,207,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={13}/>
        Import/Export limité au district Bafoussam Centre. Paroisses : import non autorisé (niveau région requis).
      </div>

      {/* Tabs */}
      <div className="seg" style={{ alignSelf:'flex-start' }}>
        <button className={tab==='import' ? 'on' : ''} onClick={()=>{setTab('import');setStep(1);}}>Import</button>
        <button className={tab==='export' ? 'on' : ''} onClick={()=>setTab('export')}>Export</button>
        <button className={tab==='historique' ? 'on' : ''} onClick={()=>setTab('historique')}>Historique</button>
      </div>

      {tab === 'import' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Stepper */}
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            {['Modèle','Chargement','Validation','Import'].map((s,i) => (
              <React.Fragment key={i}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700,
                    background: step > i+1 ? C : step === i+1 ? `rgba(155,114,207,0.20)` : 'rgba(255,255,255,0.06)',
                    color: step > i+1 ? '#fff' : step === i+1 ? C : 'var(--text-3)',
                    border: step === i+1 ? `2px solid ${C}` : 'none' }}>
                    {step > i+1 ? '✓' : i+1}
                  </div>
                  <span style={{ fontSize:12, color: step === i+1 ? 'var(--text)' : 'var(--text-3)', fontWeight: step === i+1 ? 600 : 400 }}>{s}</span>
                </div>
                {i < 3 && <div style={{ flex:1, height:2, background: step > i+1 ? C : 'rgba(255,255,255,0.06)', margin:'0 8px' }}/>}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Type de données à importer</div>
              <div style={{ display:'flex', gap:12 }}>
                {(['ouvriers','oeuvres'] as const).map(m => (
                  <button key={m} onClick={()=>setModele(m)} style={{ flex:1, padding:'14px 16px', borderRadius:8, border:`2px solid ${modele===m ? C : 'var(--border)'}`, background: modele===m ? `rgba(155,114,207,0.08)` : 'transparent', cursor:'pointer', textAlign:'left' }}>
                    <div style={{ fontSize:13, fontWeight:600, color: modele===m ? C : 'var(--text)' }}>{m.charAt(0).toUpperCase()+m.slice(1)}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>Fichier modèle EEC</div>
                  </button>
                ))}
              </div>
              <button className="btn btn-outline" onClick={()=>addToast({type:'info',title:`Téléchargement modèle ${modele}…`})}><I.download size={13}/>Télécharger le modèle .xlsx</button>
              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>setStep(2)}>Suivant →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Chargement du fichier — {modele}</div>
              <UploadZone onFile={name=>setFileName(name)}/>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Retour</button>
                <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} disabled={!fileName} onClick={()=>setStep(3)}>Valider →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Prévisualisation — {fileName}</div>
              <div style={{ background:'rgba(90,196,114,0.08)', border:'1px solid rgba(90,196,114,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'#5AC472' }}>
                ✓ Fichier valide · {modele === 'ouvriers' ? '14 ouvriers' : '5 œuvres'} détectés · 0 erreur
              </div>
              <table className="data">
                <thead><tr><th>Nom</th><th>{modele==='ouvriers' ? 'Grade' : 'Type'}</th><th>Paroisse</th><th>Statut</th></tr></thead>
                <tbody>
                  {[{nom:'Exemple 1',col:'Pasteur',par:'Bafoussam-Centre'},{nom:'Exemple 2',col:'Catéchiste',par:'Bafoussam-Plateau'}].map((r,i)=>(
                    <tr key={i}><td>{r.nom}</td><td>{r.col}</td><td>{r.par}</td><td><span style={{color:'#5AC472',fontSize:11}}>✓ OK</span></td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <button className="btn btn-ghost" onClick={()=>setStep(2)}>← Retour</button>
                <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>setStep(4)}>Importer →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="card" style={{ padding:'32px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(90,196,114,0.15)', color:'#5AC472', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>✓</div>
              <div style={{ fontSize:16, fontWeight:700 }}>Import terminé avec succès</div>
              <div style={{ fontSize:13, color:'var(--text-3)' }}>Données intégrées dans le district Bafoussam Centre</div>
              <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>{setStep(1);setFileName(null);}}>Nouvel import</button>
            </div>
          )}
        </div>
      )}

      {tab === 'export' && (
        <div className="card" style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Exporter les données — District Bafoussam Centre</div>
          {[
            { label:'Ouvriers du district', desc:'14 ouvriers · format .xlsx', icon:'user' },
            { label:'Œuvres du district',   desc:'5 œuvres · format .xlsx',    icon:'hexagon' },
            { label:'Rapport PDF complet',  desc:'Toutes données · format PDF', icon:'download' },
          ].map((e,i) => {
            const Ic = I[e.icon as keyof typeof I];
            return (
              <div key={i} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:36, height:36, borderRadius:8, background:`rgba(155,114,207,0.12)`, color:C, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {Ic && <Ic size={17}/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:500 }}>{e.label}</div>
                  <div style={{ fontSize:11, color:'var(--text-3)' }}>{e.desc}</div>
                </div>
                <button className="btn btn-outline" onClick={()=>addToast({type:'info',title:`Export — ${e.label}`})}><I.download size={13}/>Exporter</button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'historique' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <table className="data">
            <thead><tr><th>Date</th><th>Type</th><th>Fichier</th><th style={{textAlign:'right'}}>Lignes</th><th style={{textAlign:'right'}}>OK</th><th style={{textAlign:'right'}}>Erreurs</th><th>Par</th></tr></thead>
            <tbody>
              {HISTORIQUE.map((h,i)=>(
                <tr key={i}>
                  <td className="mono" style={{fontSize:12, color:'var(--text-2)'}}>{h.date}</td>
                  <td style={{fontWeight:500}}>{h.type}</td>
                  <td className="mono" style={{fontSize:11, color:'var(--text-3)'}}>{h.fichier}</td>
                  <td className="mono" style={{textAlign:'right'}}>{h.lignes}</td>
                  <td className="mono" style={{textAlign:'right', color:'#5AC472'}}>{h.ok}</td>
                  <td className="mono" style={{textAlign:'right', color: h.erreurs>0?'#FF8A7A':'var(--text-3)'}}>{h.erreurs}</td>
                  <td style={{fontSize:12}}>{h.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ToastStack toasts={toasts}/>
    </div>
  );
}
