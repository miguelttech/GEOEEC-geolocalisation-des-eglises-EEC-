'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, Dropdown, CompleteBar, useOutside } from '@/components/admin/atoms';
import { DISTRICTS_MIFI, STATS_DISTRICTS_MIFI } from '@/components/admin/dataRegional';

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
          <button onClick={() => setOpen(false)}><I.user size={13}/>Assigner un admin</button>
        </div>
      )}
    </div>
  );
}

function DistrictViewPanel({ district, onClose }: { district: any; onClose: () => void }) {
  const stats = STATS_DISTRICTS_MIFI.find(s => s.district === district.nom);
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{district.nom}</h2>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>MIFI · {district.paroisses} paroisses</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total fidèles', value: district.fideles.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers', value: district.ouvriers, color: 'var(--text)' },
              { label: 'Communiants', value: stats?.communiants.toLocaleString('fr') || '—', color: '#5B9BD5' },
              { label: 'Non-comm.', value: stats?.noncomm.toLocaleString('fr') || '—', color: 'var(--text-2)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          {stats && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Score de performance</div>
              <CompleteBar pct={stats.score} />
            </div>
          )}
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Administrateur</div>
            {district.adminInitials ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={district.adminInitials} size={32} bg="rgba(91,155,213,0.18)" color="#5B9BD5"/>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{district.admin}</span>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-3)', fontStyle: 'italic' }}>Aucun administrateur assigné</div>
            )}
          </div>
          <button className="btn btn-outline" style={{ justifyContent: 'center', gap: 10 }}><I.download size={14}/>Exporter fiche district PDF</button>
        </div>
      </div>
    </div>
  );
}

function DistrictFormPanel({ mode, district, onClose, onSave }: {
  mode: 'create'|'edit'; district?: any; onClose: () => void; onSave: (d: any) => void;
}) {
  const [form, setForm] = React.useState({ nom: district?.nom || '' });

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouveau district' : `Modifier — ${district?.nom}`}</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Région MIFI</div>
          </div>
          <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label">Région</div>
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.shield size={13} style={{ color: '#5B9BD5' }}/> MIFI — scopée à votre région
            </div>
          </div>
          <div>
            <div className="label">Nom du district *</div>
            <input className="input" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex. BAFOUSSAM EST" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nom} style={{ opacity: !form.nom ? 0.5 : 1 }}>
              {mode === 'create' ? 'Créer le district' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DistrictsMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; district?: any } | null>(null);
  const [selection, setSelection] = React.useState(new Set<number>());

  let data = DISTRICTS_MIFI.map(d => {
    const stats = STATS_DISTRICTS_MIFI.find(s => s.district === d.nom);
    return { ...d, score: stats?.score || 0 };
  });
  if (search) data = data.filter(d => d.nom.toLowerCase().includes(search.toLowerCase()));

  function toggle(id: number) { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); }
  function toggleAll() { setSelection(selection.size === data.length ? new Set() : new Set(data.map(d => d.id))); }

  const totalFideles = DISTRICTS_MIFI.reduce((a, d) => a + d.fideles, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Districts', value: DISTRICTS_MIFI.length, color: '#5B9BD5', icon: 'network' },
          { label: 'Total fidèles', value: totalFideles.toLocaleString('fr'), color: '#5AC472', icon: 'users' },
          { label: 'Avec admin assigné', value: DISTRICTS_MIFI.filter(d => d.admin !== '—').length, color: '#FFD600', icon: 'user' },
          { label: 'En attente validation', value: DISTRICTS_MIFI.filter(d => d.statut === 'en_attente').length, color: '#FF8A7A', icon: 'alert' },
        ].map(s => {
          const Ic = I[s.icon as keyof typeof I];
          return (
            <div key={s.label} className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {Ic && <Ic size={15} style={{ color: s.color }}/>}
                <span style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div className="sg" style={{ fontSize: 26, color: s.color }}>{s.value}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>Districts — Région MIFI</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <I.search size={14} style={{ position: 'absolute', top: 10, left: 10, color: 'var(--text-3)' }}/>
            <input className="input" placeholder="Rechercher..." style={{ paddingLeft: 32, width: 200, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...', body:'Districts MIFI → .xlsx' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer un district</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" className="checkbox" checked={data.length > 0 && selection.size === data.length} onChange={toggleAll}/></th>
              <th style={{ width: 40 }}>#</th>
              <th className="sortable">District</th>
              <th className="sortable" style={{ textAlign: 'right' }}>Paroisses</th>
              <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
              <th className="sortable" style={{ textAlign: 'right' }}>Ouvriers</th>
              <th>Administrateur</th>
              <th>Score</th>
              <th>Statut</th>
              <th style={{ fontSize: 11, color: 'var(--text-3)' }}>Modifié</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={d.id} style={{ background: selection.has(d.id) ? 'rgba(91,155,213,0.06)' : 'transparent' }}>
                <td><input type="checkbox" className="checkbox" checked={selection.has(d.id)} onChange={() => toggle(d.id)}/></td>
                <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(91,155,213,0.12)', color: '#5B9BD5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <I.network size={14}/>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{d.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Région MIFI</div>
                    </div>
                  </div>
                </td>
                <td className="mono" style={{ textAlign: 'right' }}>{d.paroisses}</td>
                <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.fideles.toLocaleString('fr')}</td>
                <td className="mono" style={{ textAlign: 'right' }}>{d.ouvriers}</td>
                <td>
                  {d.adminInitials ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={d.adminInitials} size={24} bg="rgba(91,155,213,0.18)" color="#5B9BD5"/>
                      <span style={{ fontSize: 13 }}>{d.admin}</span>
                    </div>
                  ) : (
                    <span className="pill pill-gray" style={{ fontSize: 10 }}>Non assigné</span>
                  )}
                </td>
                <td style={{ width: 110 }}><CompleteBar pct={d.score}/></td>
                <td>
                  <span className={`pill ${d.statut === 'actif' ? 'pill-green' : d.statut === 'en_attente' ? 'pill-orange' : 'pill-gray'}`}>
                    {d.statut === 'actif' ? 'Actif' : d.statut === 'en_attente' ? 'En attente' : 'Inactif'}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{d.modifie}</td>
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="icon-btn" onClick={() => setViewPanel(d)}><I.eye size={15}/></button>
                    <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', district: d })}><I.pencil size={15}/></button>
                    <RowMenu onView={() => setViewPanel(d)} onEdit={() => setFormPanel({ mode: 'edit', district: d })}/>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} district{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}/>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.download size={13}/>Exporter</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {viewPanel && <DistrictViewPanel district={viewPanel} onClose={() => setViewPanel(null)}/>}
      {formPanel && (
        <DistrictFormPanel mode={formPanel.mode} district={formPanel.district} onClose={() => setFormPanel(null)}
          onSave={d => { setFormPanel(null); addToast({ type:'success', title: formPanel.mode === 'create' ? 'District créé.' : 'Modifications enregistrées.', body: d.nom || formPanel.district?.nom }); }}/>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
