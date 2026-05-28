'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, StatusPill, useOutside } from '@/components/admin/atoms';
import { sampleOeuvres, OEUVRE_TYPES, REGIONS_22, DISTRICTS_BY_REGION } from '@/components/admin/data';

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

const TypePill = ({ type }: { type: string }) => {
  const t = OEUVRE_TYPES.find(x => x.key === type);
  const color = t?.color || '#5B9BD5';
  return <span className="pill" style={{ background: color + '22', color, borderColor: color + '55' }}>{type}</span>;
};

const totalByType = OEUVRE_TYPES.map(t => ({
  ...t,
  count: ({Scolaire:124, Médical:62, Universitaire:18, Agropastoral:47, Immeuble:35, Terrain:18, Autre:7} as Record<string,number>)[t.key] || 0
}));

function RowMenuOeuvre({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 180 }}>
          <button onClick={() => { setOpen(false); onEdit(); }}><I.pencil size={13}/>Modifier</button>
          <button onClick={() => setOpen(false)}><I.download size={13}/>Exporter PDF</button>
          <button onClick={() => setOpen(false)}><I.lock size={13}/>Désactiver</button>
          <hr/>
          <button className="danger" onClick={() => { setOpen(false); onDelete(); }}><I.trash size={13}/>Supprimer</button>
        </div>
      )}
    </div>
  );
}

// ── View Panel ────────────────────────────────────────────────────────────────
function OeuvreViewPanel({ oeuvre, onClose, onEdit }: { oeuvre: any; onClose: () => void; onEdit: () => void }) {
  const t = OEUVRE_TYPES.find(x => x.key === oeuvre.type);
  const color = t?.color || '#5B9BD5';
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '22', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.hexagon size={18}/></div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{oeuvre.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{oeuvre.region} · {oeuvre.district}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TypePill type={oeuvre.type}/>
            <StatusPill statut={oeuvre.statut}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Bénéficiaires', value: oeuvre.beneficiaires ? oeuvre.beneficiaires.toLocaleString('fr') : '—', color: color },
              { label: 'Année', value: oeuvre.annee, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rattachement</div>
            {[
              { label: 'Région', value: oeuvre.region },
              { label: 'District', value: oeuvre.district },
              { label: 'Paroisse', value: oeuvre.paroisse },
              { label: 'Responsable', value: oeuvre.responsable },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form Panel ────────────────────────────────────────────────────────────────
function OeuvreFormPanel({ mode, oeuvre, onClose, onSave }: {
  mode: 'create'|'edit'; oeuvre?: any; onClose: () => void; onSave: (d: any) => void;
}) {
  const [form, setForm] = React.useState({
    nom: oeuvre?.nom || '',
    type: oeuvre?.type || 'Scolaire',
    region: oeuvre?.region || '',
    district: oeuvre?.district || '',
    paroisse: oeuvre?.paroisse || '',
    responsable: oeuvre?.responsable || '',
    beneficiaires: oeuvre?.beneficiaires ? String(oeuvre.beneficiaires) : '',
    annee: oeuvre?.annee ? String(oeuvre.annee) : '2025',
    statut: oeuvre?.statut || 'actif',
    description: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const districts = DISTRICTS_BY_REGION[form.region] || [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 580 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouvelle œuvre' : `Modifier — ${oeuvre?.nom}`}</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Console Synodale · EEC Cameroun</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12, color: 'rgba(240,244,241,0.80)', borderColor: 'rgba(255,255,255,0.20)' }} onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => onSave(form)}>Enregistrer</button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '22px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Nom de l'œuvre *</div>
              <input className="input" placeholder="Ex. École primaire EPC Dschang" value={form.nom} onChange={e => set('nom', e.target.value)}/>
            </div>
            <div>
              <div className="label">Type *</div>
              <Dropdown value={form.type} options={OEUVRE_TYPES.map(t => t.key)} onChange={v => set('type', v)}/>
            </div>
            <div>
              <div className="label">Statut</div>
              <Dropdown value={form.statut} options={['actif','inactif']} onChange={v => set('statut', v)}/>
            </div>
            <div>
              <div className="label">Région synodale *</div>
              <Dropdown value={form.region || 'Sélectionner'} options={[...REGIONS_22]} onChange={v => { set('region', v); set('district', ''); }}/>
            </div>
            <div>
              <div className="label">District *</div>
              <Dropdown value={form.district || 'Sélectionner'} options={districts.length ? districts : ['— sélectionner une région']} onChange={v => set('district', v)} disabled={!form.region || districts.length === 0}/>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Paroisse rattachée</div>
              <input className="input" placeholder="Nom de la paroisse" value={form.paroisse} onChange={e => set('paroisse', e.target.value)}/>
            </div>
            <div>
              <div className="label">Responsable</div>
              <input className="input" placeholder="Nom du responsable" value={form.responsable} onChange={e => set('responsable', e.target.value)}/>
            </div>
            <div>
              <div className="label">Bénéficiaires</div>
              <input className="input mono" type="number" min="0" placeholder="0" value={form.beneficiaires} onChange={e => set('beneficiaires', e.target.value)}/>
            </div>
            <div>
              <div className="label">Année de création</div>
              <input className="input mono" type="number" min="1900" max="2030" placeholder="2025" value={form.annee} onChange={e => set('annee', e.target.value)}/>
            </div>
          </div>
          <div>
            <div className="label">Description / observations</div>
            <textarea className="input" rows={3} placeholder="Notes sur l'œuvre..." style={{ resize: 'vertical', lineHeight: 1.5 }} value={form.description} onChange={e => set('description', e.target.value)}/>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nom || !form.region} style={{ opacity: (!form.nom || !form.region) ? 0.5 : 1 }}>
              {mode === 'create' ? 'Créer l\'œuvre' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function OeuvresPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('Tous types');
  const [region, setRegion] = React.useState('Toutes régions');
  const [statut, setStatut] = React.useState('Tous statuts');
  const [selection, setSelection] = React.useState(new Set<number>());
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; oeuvre?: any } | null>(null);

  let data = sampleOeuvres as typeof sampleOeuvres;
  if (search) data = data.filter(o => o.nom.toLowerCase().includes(search.toLowerCase()));
  if (type !== 'Tous types') data = data.filter(o => o.type === type);
  if (region !== 'Toutes régions') data = data.filter(o => o.region === region);
  if (statut !== 'Tous statuts') data = data.filter(o => o.statut === statut.toLowerCase());

  const hasFilter = !!(search || type !== 'Tous types' || region !== 'Toutes régions' || statut !== 'Tous statuts');
  const reset = () => { setSearch(''); setType('Tous types'); setRegion('Toutes régions'); setStatut('Tous statuts'); };

  function toggle(id: number) { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); }
  function toggleAll() { setSelection(selection.size === data.length ? new Set() : new Set(data.map(d => d.id))); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mini-stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {totalByType.map(t => (
          <div key={t.key} className="card" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color }}/>
              <span style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{t.key}</span>
            </div>
            <div className="sg" style={{ fontSize: 22, color: t.color, lineHeight: 1, marginTop: 2 }}>{t.count}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>311 œuvres</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>14 régions sur 22 ont des œuvres déclarées</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Téléchargement du modèle Excel...' })}><I.upload size={14}/>Importer Excel</button>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...', body:'311 œuvres → .xlsx' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer une œuvre</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom d'œuvre..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 180 }}><Dropdown label="Type" value={type} options={['Tous types', ...OEUVRE_TYPES.map(t => t.key)]} onChange={setType}/></div>
        <div style={{ width: 200 }}><Dropdown label="Région" value={region} options={['Toutes régions', ...REGIONS_22]} onChange={setRegion}/></div>
        <div style={{ width: 140 }}><Dropdown label="Statut" value={statut} options={['Tous statuts','Actif','Inactif']} onChange={setStatut}/></div>
        {hasFilter && <button className="btn btn-ghost" onClick={reset}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{data.length}</b> œuvres trouvées sur 311</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" className="checkbox" checked={data.length > 0 && selection.size === data.length} onChange={toggleAll}/></th>
                <th style={{ width: 40 }}>#</th>
                <th className="sortable">Nom de l'œuvre</th>
                <th>Type</th>
                <th>Région</th>
                <th>District</th>
                <th>Paroisse rattachée</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Bénéficiaires</th>
                <th style={{ textAlign: 'right' }}>Année</th>
                <th>Responsable</th>
                <th>Statut</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={12} style={{ height: 280, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <I.hexagon size={48} style={{ opacity: 0.25 }}/>
                    <div className="sg-md" style={{ fontSize: 16 }}>Aucune œuvre trouvée</div>
                    <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Modifiez vos filtres ou créez une nouvelle œuvre.</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-outline" onClick={reset}>Réinitialiser</button>
                      <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer une œuvre</button>
                    </div>
                  </div>
                </td></tr>
              )}
              {data.map((o, i) => {
                const ot = OEUVRE_TYPES.find(x => x.key === o.type);
                return (
                  <tr key={o.id} style={{ background: selection.has(o.id) ? 'rgba(46,151,68,0.06)' : 'transparent' }}>
                    <td><input type="checkbox" className="checkbox" checked={selection.has(o.id)} onChange={() => toggle(o.id)}/></td>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(3,'0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: (ot?.color || '#888') + '22', color: ot?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I.hexagon size={15}/></div>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{o.nom}</span>
                      </div>
                    </td>
                    <td><TypePill type={o.type}/></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.region}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.district}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.paroisse}</td>
                    <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{o.beneficiaires ? o.beneficiaires.toLocaleString('fr') : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{o.annee}</td>
                    <td style={{ fontSize: 12.5 }}>{o.responsable}</td>
                    <td><StatusPill statut={o.statut}/></td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="icon-btn" onClick={() => setViewPanel(o)}><I.eye size={15}/></button>
                        <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', oeuvre: o })}><I.pencil size={15}/></button>
                        <RowMenuOeuvre onEdit={() => setFormPanel({ mode: 'edit', oeuvre: o })} onDelete={() => addToast({ type: 'warn', title: `Œuvre "${o.nom}" supprimée.` })}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
            <span>Affichage <span style={{ color: 'var(--text)' }}>1 à {data.length}</span> sur <span style={{ color: 'var(--text)' }}>311</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="icon-btn"><I.chevL size={14}/></button>
              {[1,2,3].map(n => <button key={n} style={{ width:28,height:28,border:0,borderRadius:5,background:n===1?'var(--green)':'transparent',color:n===1?'#fff':'var(--text-2)',fontSize:12,fontWeight:600,cursor:'pointer' }}>{n}</button>)}
              <span style={{ color:'var(--text-3)' }}>…</span>
              <button style={{ width:28,height:28,border:0,borderRadius:5,background:'transparent',color:'var(--text-2)',fontSize:12,fontWeight:600,cursor:'pointer' }}>32</button>
              <button className="icon-btn"><I.chevR size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} œuvre{selection.size > 1 ? 's' : ''} sélectionnée{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}/>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.download size={13}/>Excel</button>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.lock size={13}/>Désactiver</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {viewPanel && (
        <OeuvreViewPanel oeuvre={viewPanel} onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', oeuvre: viewPanel }); setViewPanel(null); }}/>
      )}
      {formPanel && (
        <OeuvreFormPanel mode={formPanel.mode} oeuvre={formPanel.oeuvre} onClose={() => setFormPanel(null)}
          onSave={(d) => { setFormPanel(null); addToast({ type: 'success', title: formPanel.mode === 'create' ? 'Œuvre créée avec succès.' : 'Modifications enregistrées.', body: d.nom || formPanel.oeuvre?.nom }); }}/>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
