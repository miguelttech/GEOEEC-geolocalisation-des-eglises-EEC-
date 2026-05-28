'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, Dropdown, StatusPill, useOutside } from '@/components/admin/atoms';
import { OUVRIERS_MIFI, DISTRICTS_MIFI } from '@/components/admin/dataRegional';
import { OUVRIER_GRADES } from '@/components/admin/data';

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

const GradePill = ({ grade }: { grade: string }) => {
  const g = OUVRIER_GRADES.find(x => x.key === grade);
  const color = g?.color || '#94A3B8';
  return <span className="pill" style={{ background: color + '22', color, borderColor: color + '55' }}>{grade}</span>;
};

function RowMenuOuvrier({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 180 }}>
          <button onClick={() => { setOpen(false); onEdit(); }}><I.pencil size={13}/>Modifier</button>
          <button onClick={() => setOpen(false)}><I.swap size={13}/>Réaffecter</button>
          <button onClick={() => setOpen(false)}><I.download size={13}/>Exporter fiche</button>
          <button onClick={() => setOpen(false)}><I.lock size={13}/>Désactiver</button>
        </div>
      )}
    </div>
  );
}

function OuvrierViewPanel({ ouvrier, onClose, onEdit }: { ouvrier: any; onClose: () => void; onEdit: () => void }) {
  const g = OUVRIER_GRADES.find(x => x.key === ouvrier.grade);
  const color = g?.color || '#94A3B8';
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={ouvrier.initials} size={44} bg={color + '22'} color={color}/>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{ouvrier.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>ID-{String(ouvrier.id).padStart(4,'0')} · {ouvrier.grade}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <GradePill grade={ouvrier.grade}/>
            <StatusPill statut={ouvrier.statut}/>
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Affectation</div>
            {[
              { label: 'Région', value: 'MIFI' },
              { label: 'District', value: ouvrier.district },
              { label: 'Paroisse', value: ouvrier.paroisse },
              { label: 'Prise de fonction', value: ouvrier.priseFonction },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Contact</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <I.user size={13} style={{ color: 'var(--text-3)' }}/>
              <span className="mono">{ouvrier.tel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OuvrierFormPanel({ mode, ouvrier, onClose, onSave }: {
  mode: 'create'|'edit'; ouvrier?: any; onClose: () => void; onSave: (d: any) => void;
}) {
  const districts = DISTRICTS_MIFI.map(d => d.nom);
  const [form, setForm] = React.useState({
    nom: ouvrier?.nom || '',
    grade: ouvrier?.grade || 'Pasteur',
    district: ouvrier?.district || '',
    paroisse: ouvrier?.paroisse || '',
    tel: ouvrier?.tel || '',
    priseFonction: ouvrier?.priseFonction || '',
    statut: ouvrier?.statut || 'actif',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouvel ouvrier' : `Modifier — ${ouvrier?.nom}`}</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Région MIFI</div>
          </div>
          <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label">Région</div>
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.shield size={13} style={{ color: '#5B9BD5' }}/> MIFI — scopée à votre région
            </div>
          </div>
          <div>
            <div className="label">Nom complet *</div>
            <input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Prénom NOM" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div className="label">Grade *</div><Dropdown value={form.grade} options={OUVRIER_GRADES.map(g => g.key)} onChange={v => set('grade', v)}/></div>
            <div><div className="label">Statut</div><Dropdown value={form.statut} options={['actif','inactif']} onChange={v => set('statut', v)}/></div>
            <div><div className="label">District *</div><Dropdown value={form.district || 'Sélectionner'} options={districts} onChange={v => { set('district', v); }}/></div>
            <div><div className="label">Paroisse assignée</div><input className="input" value={form.paroisse} onChange={e => set('paroisse', e.target.value)} placeholder="Nom de la paroisse" /></div>
            <div><div className="label">Téléphone</div><input className="input mono" value={form.tel} onChange={e => set('tel', e.target.value)} placeholder="+237 6XX XXX XXX" /></div>
            <div><div className="label">Prise de fonction</div><input className="input mono" type="date" value={form.priseFonction} onChange={e => set('priseFonction', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nom || !form.district} style={{ opacity: (!form.nom || !form.district) ? 0.5 : 1 }}>
              {mode === 'create' ? "Créer l'ouvrier" : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OuvriersMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [grade, setGrade] = React.useState('Tous grades');
  const [district, setDistrict] = React.useState('Tous districts');
  const [statut, setStatut] = React.useState('Tous statuts');
  const [selection, setSelection] = React.useState(new Set<number>());
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; ouvrier?: any } | null>(null);

  let data = [...OUVRIERS_MIFI];
  if (search) data = data.filter(o => o.nom.toLowerCase().includes(search.toLowerCase()));
  if (grade !== 'Tous grades') data = data.filter(o => o.grade === grade);
  if (district !== 'Tous districts') data = data.filter(o => o.district === district);
  if (statut !== 'Tous statuts') data = data.filter(o => o.statut === statut.toLowerCase());

  const hasFilter = !!(search || grade !== 'Tous grades' || district !== 'Tous districts' || statut !== 'Tous statuts');
  const reset = () => { setSearch(''); setGrade('Tous grades'); setDistrict('Tous districts'); setStatut('Tous statuts'); };

  function toggle(id: number) { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); }
  function toggleAll() { setSelection(selection.size === data.length ? new Set() : new Set(data.map(d => d.id))); }

  const gradeCounts = OUVRIER_GRADES.map(g => ({ ...g, count: OUVRIERS_MIFI.filter(o => o.grade === g.key).length }));
  const districtOptions = ['Tous districts', ...DISTRICTS_MIFI.map(d => d.nom)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mini-stats by grade */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10 }}>
        {gradeCounts.map(g => (
          <div key={g.key} className="card" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }}/>
              <span style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.key}</span>
            </div>
            <div className="sg" style={{ fontSize: 20, color: g.color, lineHeight: 1, marginTop: 2 }}>{g.count}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>{OUVRIERS_MIFI.length} ouvriers · Région MIFI</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>6 districts · 8 grades hiérarchiques</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...', body:'Ouvriers MIFI → .xlsx' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer un ouvrier</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom d'ouvrier..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 180 }}><Dropdown label="Grade" value={grade} options={['Tous grades', ...OUVRIER_GRADES.map(g => g.key)]} onChange={setGrade}/></div>
        <div style={{ width: 200 }}><Dropdown label="District" value={district} options={districtOptions} onChange={setDistrict}/></div>
        <div style={{ width: 140 }}><Dropdown label="Statut" value={statut} options={['Tous statuts','Actif','Inactif']} onChange={setStatut}/></div>
        {hasFilter && <button className="btn btn-ghost" onClick={reset}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{data.length}</b> ouvriers trouvés sur {OUVRIERS_MIFI.length}</span>
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
                <th className="sortable">Ouvrier</th>
                <th>Grade</th>
                <th>Paroisse assignée</th>
                <th>District</th>
                <th>Téléphone</th>
                <th className="sortable">Prise de fonction</th>
                <th>Statut</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={10} style={{ height: 260, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <I.user size={48} style={{ opacity: 0.25 }}/>
                    <div className="sg-md" style={{ fontSize: 16 }}>Aucun ouvrier trouvé</div>
                    <button className="btn btn-outline" onClick={reset}>Réinitialiser</button>
                  </div>
                </td></tr>
              )}
              {data.map((o, i) => {
                const g = OUVRIER_GRADES.find(x => x.key === o.grade);
                return (
                  <tr key={o.id} style={{ background: selection.has(o.id) ? 'rgba(91,155,213,0.06)' : 'transparent' }}>
                    <td><input type="checkbox" className="checkbox" checked={selection.has(o.id)} onChange={() => toggle(o.id)}/></td>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Avatar initials={o.initials} size={34} bg={(g?.color || '#888') + '22'} color={g?.color || '#888'}/>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.nom}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ID-{String(o.id).padStart(4,'0')}</div>
                        </div>
                      </div>
                    </td>
                    <td><GradePill grade={o.grade}/></td>
                    <td style={{ fontSize: 13 }}>{o.paroisse}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.district}</td>
                    <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.tel}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }} className="mono">{o.priseFonction}</td>
                    <td><StatusPill statut={o.statut}/></td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="icon-btn" onClick={() => setViewPanel(o)}><I.eye size={15}/></button>
                        <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', ouvrier: o })}><I.pencil size={15}/></button>
                        <RowMenuOuvrier onEdit={() => setFormPanel({ mode: 'edit', ouvrier: o })}/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} ouvrier{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}/>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.download size={13}/>Exporter</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {viewPanel && (
        <OuvrierViewPanel ouvrier={viewPanel} onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', ouvrier: viewPanel }); setViewPanel(null); }}/>
      )}
      {formPanel && (
        <OuvrierFormPanel mode={formPanel.mode} ouvrier={formPanel.ouvrier} onClose={() => setFormPanel(null)}
          onSave={d => { setFormPanel(null); addToast({ type:'success', title: formPanel.mode === 'create' ? 'Ouvrier créé.' : 'Modifications enregistrées.', body: d.nom || formPanel.ouvrier?.nom }); }}/>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
