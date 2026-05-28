'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { HISTORIQUE_IO_PAROISSE } from '@/components/admin/dataParoisse';

const C = '#E67A2E';
const PAROISSE = 'Bafoussam-Centre';

const TABS = ['Import', 'Export'] as const;
type Tab = typeof TABS[number];

interface Toast { id:number; type:'success'|'info'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

const STEPS = ['Fichier', 'Aperçu', 'Confirmation'] as const;

function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:20 }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background: i <= step ? C : 'rgba(255,255,255,0.08)', color: i <= step ? '#fff' : 'var(--text-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
              {i < step ? '✓' : i + 1}
            </div>
            <span style={{ fontSize:12, color: i <= step ? 'var(--text)' : 'var(--text-3)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.08)', margin:'0 8px', minWidth:24 }}/>}
        </React.Fragment>
      ))}
    </div>
  );
}

function UploadZone({ onFile }: { onFile:(name:string)=>void }) {
  const [drag, setDrag] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  const handleFile = (f: File) => { if (f) onFile(f.name); };
  return (
    <div
      onClick={() => input.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      style={{ border:`2px dashed ${drag ? C : 'rgba(255,255,255,0.12)'}`, borderRadius:8, padding:'32px 20px', textAlign:'center', cursor:'pointer', transition:'border-color 0.15s', background: drag ? 'rgba(230,122,46,0.04)' : 'transparent' }}>
      <input ref={input} type="file" accept=".xlsx,.xls,.csv" style={{ display:'none' }} onChange={e=>{ const f=e.target.files?.[0]; if(f) handleFile(f); }}/>
      <I.upload size={28} style={{ color:'var(--text-3)', marginBottom:8 }}/>
      <div style={{ fontSize:13, color:'var(--text-2)', fontWeight:500 }}>Glissez votre fichier ici ou <span style={{ color:C }}>parcourir</span></div>
      <div style={{ fontSize:11, color:'var(--text-3)', marginTop:4 }}>Excel (.xlsx, .xls) ou CSV — max 10 Mo</div>
    </div>
  );
}

function ImportTab({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  const [step, setStep] = React.useState(0);
  const [fileName, setFileName] = React.useState('');
  const [type, setType] = React.useState<'ouvriers'|'oeuvres'>('ouvriers');

  const reset = () => { setStep(0); setFileName(''); };
  const confirm = () => {
    reset();
    addToast({ type:'success', title:'Import lancé', body:`${fileName} en cours de traitement…` });
  };

  const MOCK_PREVIEW = [
    { nom:'TCHAKOUNTE Paul', grade:'Catéchiste', tel:'+237 697 00 01 01' },
    { nom:'MFOPIT Jeanne',   grade:'Diacre',    tel:'+237 677 00 02 02' },
    { nom:'NGUEMO Albert',   grade:'Autre',     tel:'+237 655 00 03 03' },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(255,193,7,0.06)', border:'1px solid rgba(255,193,7,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(255,193,7,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={12}/> Import limité aux ouvriers et œuvres de votre paroisse. L'import de paroisses n'est pas autorisé à ce niveau.
      </div>

      {step === 0 && (
        <>
          <div style={{ display:'flex', gap:8 }}>
            {(['ouvriers','oeuvres'] as const).map(t => (
              <button key={t} className={`btn${type===t?'':' btn-ghost'}`}
                style={type===t ? { background:C, color:'#fff', border:`1px solid ${C}` } : {}}
                onClick={()=>setType(t)}>
                {t === 'ouvriers' ? 'Ouvriers' : 'Œuvres'}
              </button>
            ))}
          </div>
          <Stepper step={0}/>
          <UploadZone onFile={name => { setFileName(name); setStep(1); }}/>
          <a href="#" style={{ fontSize:12, color:C, textDecoration:'none', display:'flex', alignItems:'center', gap:6 }}>
            <I.download size={12}/> Télécharger le modèle {type === 'ouvriers' ? 'ouvriers' : 'œuvres'} (.xlsx)
          </a>
        </>
      )}

      {step === 1 && (
        <>
          <Stepper step={1}/>
          <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:4 }}>Aperçu — <span style={{ color:'var(--text)' }}>{fileName}</span></div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table className="data">
              <thead><tr><th>Nom</th><th>Grade</th><th>Téléphone</th></tr></thead>
              <tbody>
                {MOCK_PREVIEW.map((r,i) => (
                  <tr key={i}><td>{r.nom}</td><td>{r.grade}</td><td className="mono" style={{ fontSize:11 }}>{r.tel}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize:11, color:'var(--text-3)' }}>3 lignes détectées. Vérifiez les données avant de confirmer.</div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={reset}>Annuler</button>
            <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>setStep(2)}>
              <I.check size={14}/>Valider l'aperçu
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <Stepper step={2}/>
          <div className="card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ fontSize:13, fontWeight:600 }}>Résumé de l'import</div>
            <div style={{ fontSize:12, color:'var(--text-2)' }}>Fichier : <span style={{ color:'var(--text)' }}>{fileName}</span></div>
            <div style={{ fontSize:12, color:'var(--text-2)' }}>Type : <span style={{ color:'var(--text)', textTransform:'capitalize' }}>{type}</span></div>
            <div style={{ fontSize:12, color:'var(--text-2)' }}>Lignes : <span style={{ color:C, fontWeight:600 }}>3</span></div>
            <div style={{ fontSize:12, color:'var(--text-2)' }}>Paroisse : <span style={{ color:'var(--text)' }}>{PAROISSE}</span></div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn btn-ghost" onClick={()=>setStep(1)}>Retour</button>
            <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={confirm}>
              <I.check size={14}/>Lancer l'import
            </button>
          </div>
        </>
      )}

      {/* Historique */}
      {HISTORIQUE_IO_PAROISSE.length > 0 && step === 0 && (
        <div className="card" style={{ padding:0, overflow:'hidden', marginTop:8 }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', fontSize:12, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Historique des imports</div>
          <table className="data">
            <thead><tr><th>Date</th><th>Fichier</th><th>Type</th><th style={{textAlign:'right'}}>Lignes</th><th>Statut</th></tr></thead>
            <tbody>
              {HISTORIQUE_IO_PAROISSE.map((h, i) => (
                <tr key={i}>
                  <td className="mono" style={{ fontSize:11 }}>{h.date}</td>
                  <td style={{ fontSize:12 }}>{h.fichier}</td>
                  <td><span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600, background:'rgba(230,122,46,0.12)', color:C, textTransform:'capitalize' }}>{h.type}</span></td>
                  <td className="mono" style={{ textAlign:'right', fontSize:12 }}>—</td>
                  <td><span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600, background:'rgba(90,196,114,0.12)', color:'#5AC472' }}>{h.statut}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ExportTab({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:4 }}>
        Exportez les données de votre paroisse <b style={{ color:'var(--text)' }}>{PAROISSE}</b>.
      </div>
      {[
        { icon:<I.download size={16}/>, label:'Fiche complète de la paroisse', sub:'Informations, statistiques, ouvriers, œuvres', format:'PDF' },
        { icon:<I.download size={16}/>, label:'Liste des ouvriers',           sub:'Nom, grade, contact, date de prise de fonction', format:'Excel' },
        { icon:<I.download size={16}/>, label:'Liste des œuvres',             sub:'Nom, type, bénéficiaires, année',                format:'Excel' },
      ].map((e,i) => (
        <div key={i} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'rgba(230,122,46,0.10)', color:C, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {e.icon}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{e.label}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{e.sub}</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ flexShrink:0 }}
            onClick={()=>addToast({ type:'info', title:'Export généré', body:`${e.label} — ${e.format}` })}>
            <I.download size={13}/>{e.format}
          </button>
        </div>
      ))}
    </div>
  );
}

export default function IOParoissePage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState<Tab>('Import');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'rgba(230,122,46,0.06)', border:'1px solid rgba(230,122,46,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(230,122,46,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={13}/> Import / Export limité à la paroisse {PAROISSE}.
      </div>
      <div style={{ display:'flex', gap:4 }}>
        {TABS.map(t => (
          <button key={t} className={`btn${tab===t?'':' btn-ghost'}`}
            style={tab===t ? { background:C, color:'#fff', border:`1px solid ${C}` } : {}}
            onClick={()=>setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Import' && <ImportTab addToast={addToast}/>}
      {tab === 'Export' && <ExportTab addToast={addToast}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
