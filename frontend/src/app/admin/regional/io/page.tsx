'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { NiveauPill } from '@/components/admin/atoms';

interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast, 'id'>) => { const id = Date.now(); setToasts(p => [...p, { ...t, id }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
          {t.body && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.body}</div>}
        </div>
      ))}
    </div>
  );
}

export default function IOMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState('paroisses');
  const [step, setStep] = React.useState(3);
  const [importing, setImporting] = React.useState(false);
  const [progress, setProgress] = React.useState(68);
  const [exportOpen, setExportOpen] = React.useState(false);

  React.useEffect(() => {
    if (!importing) return;
    const i = setInterval(() => setProgress(p => Math.min(100, p + 0.6)), 150);
    return () => clearInterval(i);
  }, [importing]);

  const tabs = [
    { k:'paroisses', l:'Import Paroisses' },
    { k:'ouvriers',  l:'Import Ouvriers' },
    { k:'oeuvres',   l:'Import Œuvres' },
    { k:'historique',l:'Historique' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Scope notice */}
      <div style={{ background: 'rgba(91,155,213,0.06)', border: '1px solid rgba(91,155,213,0.20)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <I.shield size={13}/>
        Les imports et exports sont limités à votre région MIFI. Les données hors-région seront ignorées lors de l'import.
      </div>

      <div className="tabs-bar" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.k} className={'tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
        <div style={{ marginLeft: 'auto', padding: '8px 0' }}>
          <button className="btn btn-outline-green" onClick={() => setExportOpen(o => !o)}><I.download size={13}/>{exportOpen ? 'Fermer Export' : 'Section Export'}</button>
        </div>
      </div>

      {tab !== 'historique' && (
        <div className="card" style={{ padding: 24 }}>
          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
            {[{n:1,l:'Modèle'},{n:2,l:'Chargement'},{n:3,l:'Prévisualisation'},{n:4,l:'Import'}].map((s, i) => (
              <React.Fragment key={s.n}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setStep(s.n)}>
                  <div className={`step-dot ${step > s.n ? 'done' : step === s.n ? 'current' : 'future'}`}>
                    {step > s.n ? <I.check size={12}/> : s.n}
                  </div>
                  <span style={{ fontSize: 12, color: step >= s.n ? 'var(--text)' : 'var(--text-3)', fontWeight: 600 }}>{s.l}</span>
                </div>
                {i < 3 && <div className={`step-line ${step > s.n ? 'done' : ''}`} style={{ minWidth: 50 }}/>}
              </React.Fragment>
            ))}
          </div>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
              <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Étape 1 — Télécharger le modèle</h3>
              <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>Téléchargez le modèle Excel pré-rempli avec la structure de la région MIFI (districts et paroisses existants).</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary"><I.download size={14}/>Télécharger le modèle Excel</button>
                <button className="btn btn-outline"><I.externLink size={13}/>Documentation des colonnes</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Étape 2 — Charger le fichier</h3>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '2px dashed rgba(91,155,213,0.30)', borderRadius: 8, padding: '50px 24px', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', width: 56, height: 56, borderRadius: 12, background: 'rgba(91,155,213,0.12)', alignItems: 'center', justifyContent: 'center', color: '#5B9BD5', marginBottom: 12 }}><I.upload size={26}/></div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Déposez votre fichier Excel ici</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>.xlsx · 10 Mo max</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Étape 3 — Prévisualisation</h3>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }} className="mono">paroisses_MIFI_2026.xlsx · 0.4 Mo</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="card" style={{ padding: 14 }}><div className="sg" style={{ fontSize: 22, color: '#5AC472' }}>16</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>Lignes à traiter</div></div>
                <div className="card" style={{ padding: 14 }}><div className="sg" style={{ fontSize: 22, color: '#FFD600' }}>3</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>Mises à jour détectées</div></div>
                <div className="card" style={{ padding: 14 }}><div className="sg" style={{ fontSize: 22, color: '#FF6B6B' }}>1</div><div style={{ fontSize: 12, color: 'var(--text-2)' }}>Erreurs de validation</div></div>
              </div>
              <div style={{ background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.25)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FF8A7A', display: 'flex', gap: 8 }}>
                <I.alert size={14} style={{ marginTop: 2 }}/>
                <div><b>1 erreur détectée :</b> ligne 5 — GPS hors du Cameroun (coordonnées invalides).</div>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data">
                  <thead><tr><th>Nom</th><th>District</th><th>Niveau</th><th>Lat</th><th>Lng</th><th>Statut</th></tr></thead>
                  <tbody>
                    {[
                      {n:'Bafoussam-Kamkop',  d:'BAFOUSSAM CENTRE', niv:'STATION',  lat:'5.480', lng:'10.415', ok:true},
                      {n:'Bafoussam-Tamdja',  d:'BAFOUSSAM NORD',   niv:'STATION',  lat:'5.495', lng:'10.432', ok:true},
                      {n:'Koupan-Est',        d:'KOUNG-KHI',        niv:'ANNEXE',   lat:'5.38',  lng:'10.31',  ok:true},
                      {n:'Erreur ligne 5',    d:'BAHAM',            niv:'PAROISSE', lat:'99.0',  lng:'—',      ok:false},
                      {n:'Bamendjou-Ouest',   d:'NKAM',             niv:'STATION',  lat:'5.510', lng:'10.382', ok:true},
                    ].map((r, i) => (
                      <tr key={i} style={{ background: r.ok ? 'transparent' : 'rgba(198,40,40,0.06)' }}>
                        <td style={{ fontWeight: 500 }}>{r.n}</td>
                        <td style={{ color: 'var(--text-2)' }}>{r.d}</td>
                        <td><NiveauPill niveau={r.niv as 'PAROISSE'|'STATION'|'ANNEXE'}/></td>
                        <td className="mono" style={{ color: 'var(--text-2)' }}>{r.lat}</td>
                        <td className="mono" style={{ color: 'var(--text-2)' }}>{r.lng}</td>
                        <td>{r.ok ? <span className="pill pill-green">OK</span> : <span className="pill pill-red">Erreur</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline"><I.download size={13}/>Rapport de validation</button>
                <button className="btn btn-primary" onClick={() => { setStep(4); setImporting(true); }}>Lancer l'import →</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Import en cours</h3>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }} className="mono">paroisses_MIFI_2026.xlsx</div>
              <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.10)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: progress + '%', height: '100%', background: 'linear-gradient(90deg, #5B9BD5, #7BBAE8)', borderRadius: 100, transition: 'width 200ms ease', boxShadow: '0 0 12px rgba(91,155,213,0.4)' }}/>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
                <span>Ligne <span className="mono" style={{ color: 'var(--text)' }}>{Math.round(progress * 0.16)}</span> / <span className="mono">16</span></span>
                <span><span className="sg" style={{ fontSize: 14, color: '#5B9BD5' }}>{Math.round(progress)}%</span></span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" style={{ color: '#FF6B6B', borderColor: 'rgba(198,40,40,0.40)' }} onClick={() => { setImporting(false); setStep(3); setProgress(0); }}>Annuler l'import</button>
                {progress >= 100 && <button className="btn btn-primary" onClick={() => { addToast({ type:'success', title:'Import terminé · 15 paroisses importées' }); setImporting(false); setStep(3); }}>Terminer</button>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'historique' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data">
            <thead><tr><th>Date</th><th>Fichier</th><th>Type</th><th>Importé par</th><th style={{textAlign:'right'}}>Lignes OK</th><th style={{textAlign:'right'}}>Erreurs</th><th>Rapport</th></tr></thead>
            <tbody>
              {[
                {d:'26/05 14:18',f:'paroisses_MIFI_2026.xlsx',   t:'Paroisses',by:'Paul ATEBA',     ok:15, err:1},
                {d:'24/05 11:02',f:'ouvriers_MIFI_2026.xlsx',    t:'Ouvriers', by:'Paul ATEBA',     ok:12, err:0},
                {d:'20/05 09:47',f:'oeuvres_MIFI.xlsx',          t:'Œuvres',   by:'Paul ATEBA',     ok:8,  err:0},
              ].map((r, i) => (
                <tr key={i}>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{r.d}</td>
                  <td style={{ fontWeight: 500 }}>{r.f}</td>
                  <td><span className="pill pill-blue">{r.t}</span></td>
                  <td>{r.by}</td>
                  <td className="mono" style={{ textAlign: 'right', color: '#5AC472' }}>{r.ok}</td>
                  <td className="mono" style={{ textAlign: 'right', color: r.err > 0 ? '#FF8A7A' : 'var(--text-3)' }}>{r.err}</td>
                  <td><button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }}><I.download size={12}/>PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exportOpen && (
        <div className="card anim-fade" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Section Export — Région MIFI</h3>
            <button className="icon-btn" onClick={() => setExportOpen(false)}><I.x size={16}/></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { label: 'Paroisses MIFI', desc: '48 paroisses · GPS · stats 2025', icon: 'church', formats: ['xlsx','pdf','csv'] },
              { label: 'Ouvriers MIFI', desc: '82 ouvriers · tous grades', icon: 'user', formats: ['xlsx','pdf'] },
              { label: 'Œuvres MIFI', desc: '21 œuvres · tous types', icon: 'hexagon', formats: ['xlsx','csv'] },
              { label: 'Statistiques MIFI', desc: 'Rapport agrégé 2025', icon: 'list', formats: ['pdf','xlsx'] },
              { label: 'Districts MIFI', desc: '6 districts · admins', icon: 'network', formats: ['xlsx'] },
            ].map(item => {
              const Ic = I[item.icon as keyof typeof I];
              return (
                <div key={item.label} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {Ic && <Ic size={16} style={{ color: '#5B9BD5' }}/>}
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.desc}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {item.formats.map(fmt => (
                      <button key={fmt} className="btn btn-outline" style={{ padding: '5px 10px', fontSize: 11, textTransform: 'uppercase' }}
                        onClick={() => addToast({ type:'success', title:`Export ${item.label} (${fmt}) lancé` })}>
                        <I.download size={11}/>{fmt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
