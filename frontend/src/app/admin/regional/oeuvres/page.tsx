'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, StatusPill, useOutside } from '@/components/admin/atoms';
import { OEUVRES_MIFI, DISTRICTS_MIFI } from '@/components/admin/dataRegional';
import { OEUVRE_TYPES } from '@/components/admin/data';

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

function RowMenuOeuvre({ onEdit }: { onEdit: () => void }) {
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
        </div>
      )}
    </div>
  );
}

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
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>MIFI · {oeuvre.district}</div>
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
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Bénéficiaires</div>
              <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color }}>{oeuvre.beneficiaires ? oeuvre.beneficiaires.toLocaleString('fr') : '—'}</div>
            </div>
            <div className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Année</div>
              <div className="sg-md" style={{ fontSize: 20, marginTop: 4 }}>{oeuvre.annee}</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rattachement</div>
            {[
              { label: 'Région', value: 'MIFI' },
              { label: 'District', value: oeuvre.district },
              { label: 'Paroisse', value: oeuvre.paroisse },
              { label: 'Responsable', value: oeuvre.responsable },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
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

function OeuvreFormPanel({ mode, oeuvre, onClose, onSave }: {
  mode: 'create'|'edit'; oeuvre?: any; onClose: () => void; onSave: (d: any) => void;
}) {
  const districts = DISTRICTS_MIFI.map(d => d.nom);
  const [form, setForm] = React.useState({
    nom: oeuvre?.nom || '',
    type: oeuvre?.type || 'Scolaire',
    district: oeuvre?.district || '',
    paroisse: oeuvre?.paroisse || '',
    responsable: oeuvre?.responsable || '',
    beneficiaires: oeuvre?.beneficiaires ? String(oeuvre.beneficiaires) : '',
    annee: oeuvre?.annee ? String(oeuvre.annee) : '2025',
    statut: oeuvre?.statut || 'actif',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouvelle œuvre' : `Modifier — ${oeuvre?.nom}`}</h2>
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
            <div className="label">Nom de l'œuvre *</div>
            <input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex. École primaire EPC Baham-Ouest" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div className="label">Type *</div><Dropdown value={form.type} options={OEUVRE_TYPES.map(t => t.key)} onChange={v => set('type', v)}/></div>
            <div><div className="label">Statut</div><Dropdown value={form.statut} options={['actif','inactif']} onChange={v => set('statut', v)}/></div>
            <div><div className="label">District *</div><Dropdown value={form.district || 'Sélectionner'} options={districts} onChange={v => set('district', v)}/></div>
            <div><div className="label">Paroisse</div><input className="input" value={form.paroisse} onChange={e => set('paroisse', e.target.value)} placeholder="Nom de la paroisse" /></div>
            <div><div className="label">Responsable</div><input className="input" value={form.responsable} onChange={e => set('responsable', e.target.value)} placeholder="Nom du responsable" /></div>
            <div><div className="label">Bénéficiaires</div><input className="input mono" type="number" min="0" value={form.beneficiaires} onChange={e => set('beneficiaires', e.target.value)} placeholder="0" /></div>
            <div><div className="label">Année de création</div><input className="input mono" type="number" min="1900" max="2030" value={form.annee} onChange={e => set('annee', e.target.value)} /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nom || !form.district} style={{ opacity: (!form.nom || !form.district) ? 0.5 : 1 }}>
              {mode === 'create' ? "Créer l'œuvre" : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OeuvresMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [type, setType] = React.useState('Tous types');
  const [district, setDistrict] = React.useState('Tous districts');
  const [statut, setStatut] = React.useState('Tous statuts');
  const [selection, setSelection] = React.useState(new Set<number>());
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; oeuvre?: any } | null>(null);

  let data = [...OEUVRES_MIFI];
  if (search) data = data.filter(o => o.nom.toLowerCase().includes(search.toLowerCase()));
  if (type !== 'Tous types') data = data.filter(o => o.type === type);
  if (district !== 'Tous districts') data = data.filter(o => o.district === district);
  if (statut !== 'Tous statuts') data = data.filter(o => o.statut === statut.toLowerCase());

  const hasFilter = !!(search || type !== 'Tous types' || district !== 'Tous districts' || statut !== 'Tous statuts');
  const reset = () => { setSearch(''); setType('Tous types'); setDistrict('Tous districts'); setStatut('Tous statuts'); };

  function toggle(id: number) { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); }
  function toggleAll() { setSelection(selection.size === data.length ? new Set() : new Set(data.map(d => d.id))); }

  const typeStats = OEUVRE_TYPES.map(t => ({ ...t, count: OEUVRES_MIFI.filter(o => o.type === t.key).length }));
  const districtOptions = ['Tous districts', ...DISTRICTS_MIFI.map(d => d.nom)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mini-stats by type */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
        {typeStats.map(t => (
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
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>{OEUVRES_MIFI.length} œuvres · Région MIFI</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{DISTRICTS_MIFI.filter(d => OEUVRES_MIFI.some(o => o.district === d.nom)).length} districts ont des œuvres</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...', body:'Œuvres MIFI → .xlsx' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer une œuvre</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom d'œuvre..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 160 }}><Dropdown label="Type" value={type} options={['Tous types', ...OEUVRE_TYPES.map(t => t.key)]} onChange={setType}/></div>
        <div style={{ width: 200 }}><Dropdown label="District" value={district} options={districtOptions} onChange={setDistrict}/></div>
        <div style={{ width: 140 }}><Dropdown label="Statut" value={statut} options={['Tous statuts','Actif','Inactif']} onChange={setStatut}/></div>
        {hasFilter && <button className="btn btn-ghost" onClick={reset}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{data.length}</b> œuvres trouvées sur {OEUVRES_MIFI.length}</span>
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
                <th>District</th>
                <th>Paroisse</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Bénéficiaires</th>
                <th style={{ textAlign: 'right' }}>Année</th>
                <th>Responsable</th>
                <th>Statut</th>
                <th style={{ width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={11} style={{ height: 260, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <I.hexagon size={48} style={{ opacity: 0.25 }}/>
                    <div className="sg-md" style={{ fontSize: 16 }}>Aucune œuvre trouvée</div>
                    <button className="btn btn-outline" onClick={reset}>Réinitialiser</button>
                  </div>
                </td></tr>
              )}
              {data.map((o, i) => {
                const ot = OEUVRE_TYPES.find(x => x.key === o.type);
                return (
                  <tr key={o.id} style={{ background: selection.has(o.id) ? 'rgba(91,155,213,0.06)' : 'transparent' }}>
                    <td><input type="checkbox" className="checkbox" checked={selection.has(o.id)} onChange={() => toggle(o.id)}/></td>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 6, background: (ot?.color || '#888') + '22', color: ot?.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><I.hexagon size={14}/></div>
                        <span style={{ fontWeight: 500, fontSize: 13.5 }}>{o.nom}</span>
                      </div>
                    </td>
                    <td><TypePill type={o.type}/></td>
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
                        <RowMenuOeuvre onEdit={() => setFormPanel({ mode: 'edit', oeuvre: o })}/>
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
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} œuvre{selection.size > 1 ? 's' : ''} sélectionnée{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}/>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.download size={13}/>Exporter</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {viewPanel && (
        <OeuvreViewPanel oeuvre={viewPanel} onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', oeuvre: viewPanel }); setViewPanel(null); }}/>
      )}
      {formPanel && (
        <OeuvreFormPanel mode={formPanel.mode} oeuvre={formPanel.oeuvre} onClose={() => setFormPanel(null)}
          onSave={d => { setFormPanel(null); addToast({ type:'success', title: formPanel.mode === 'create' ? 'Œuvre créée.' : 'Modifications enregistrées.', body: d.nom || formPanel.oeuvre?.nom }); }}/>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
