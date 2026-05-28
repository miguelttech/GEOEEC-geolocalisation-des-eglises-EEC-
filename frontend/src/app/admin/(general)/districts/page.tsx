'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, Dropdown, TopCount, useOutside } from '@/components/admin/atoms';
import { sampleDistricts, REGIONS_22 } from '@/components/admin/data';

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

function RowMenu({ district: _d, onEdit }: { district: any; onEdit: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 200 }}>
          <button onClick={() => { setOpen(false); onEdit(); }}><I.pencil size={13}/>Modifier</button>
          <button onClick={() => setOpen(false)}><I.download size={13}/>Exporter PDF</button>
          <button onClick={() => setOpen(false)}><I.user size={13}/>Assigner admin</button>
          <hr/>
          <button className="danger" onClick={() => setOpen(false)}><I.trash size={13}/>Supprimer</button>
        </div>
      )}
    </div>
  );
}

// ── View Panel ────────────────────────────────────────────────────────────────
function DistrictViewPanel({ district, onClose, onEdit }: { district: any; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(91,155,213,0.15)', color: '#5B9BD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.network size={18}/></div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{district.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{district.region}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Paroisses', value: district.paroisses, color: '#5AC472' },
              { label: 'Fidèles', value: district.fideles.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers', value: district.ouvriers, color: 'var(--text)' },
              { label: 'Modifié', value: district.modifie, color: 'var(--text-2)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</div>
            {[
              { label: 'Région synodale', value: district.region },
              { label: 'Dernière modification', value: district.modifie },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Admin District</div>
            {district.adminInitials ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar initials={district.adminInitials} size={36} bg="rgba(230,81,0,0.22)" color="#E67A2E"/>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{district.admin}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Admin District</div>
                </div>
              </div>
            ) : (
              <span className="pill pill-orange"><I.alert size={9}/> Poste non assigné</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Form Panel (Create / Edit) ────────────────────────────────────────────────
function DistrictFormPanel({ mode, district, onClose, onSave }: {
  mode: 'create' | 'edit'; district?: any; onClose: () => void; onSave: (d: any) => void;
}) {
  const [form, setForm] = React.useState({
    nom: district?.nom || '',
    region: district?.region || '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouveau district' : `Modifier — ${district?.nom}`}</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Console Synodale · EEC Cameroun</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12, color: 'rgba(240,244,241,0.80)', borderColor: 'rgba(255,255,255,0.20)' }} onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => onSave(form)}>Enregistrer</button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div className="label">Nom du district *</div>
            <input className="input" placeholder="Ex. BAFOUSSAM NORD" value={form.nom} onChange={e => set('nom', e.target.value)}/>
          </div>
          <div>
            <div className="label">Région synodale *</div>
            <Dropdown value={form.region || 'Sélectionner'} options={[...REGIONS_22]} onChange={v => set('region', v)}/>
          </div>

          <div style={{ background: 'rgba(46,151,68,0.06)', border: '1px solid rgba(46,151,68,0.20)', borderRadius: 6, padding: '12px 14px', fontSize: 12.5, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Assignation de l'administrateur</div>
            <div>L'administrateur de district est géré depuis la section Gestion des comptes. Un district peut exister sans administrateur assigné.</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nom || !form.region} style={{ opacity: (!form.nom || !form.region) ? 0.5 : 1 }}>
              {mode === 'create' ? 'Créer le district' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DistrictsPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [region, setRegion] = React.useState('Toutes régions');
  const [admin, setAdmin] = React.useState('Tous');
  const [selection, setSelection] = React.useState(new Set<number>());
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; district?: any } | null>(null);

  let data = sampleDistricts as typeof sampleDistricts;
  if (search) data = data.filter(d => d.nom.toLowerCase().includes(search.toLowerCase()));
  if (region !== 'Toutes régions') data = data.filter(d => d.region === region);
  if (admin === 'Assignés') data = data.filter(d => d.adminInitials);
  if (admin === 'Non assignés') data = data.filter(d => !d.adminInitials);

  const hasFilter = !!(search || region !== 'Toutes régions' || admin !== 'Tous');
  const reset = () => { setSearch(''); setRegion('Toutes régions'); setAdmin('Tous'); };

  function toggle(id: number) { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); }
  function toggleAll() { setSelection(selection.size === data.length ? new Set() : new Set(data.map(d => d.id))); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <TopCount label="Total districts"               value="137"/>
        <TopCount label="Avec admin assigné"            value="48" color="#5AC472"/>
        <TopCount label="Sans admin"                    value="89" color="#FFB877"/>
        <TopCount label="Paroisses moyennes / district" value="4.0"/>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>137 districts</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>répartis sur 22 régions synodales</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer un district</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom de district..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 220 }}><Dropdown label="Région synodale" value={region} options={['Toutes régions', ...REGIONS_22]} onChange={setRegion}/></div>
        <div style={{ width: 180 }}><Dropdown label="Admin assigné" value={admin} options={['Tous','Assignés','Non assignés']} onChange={setAdmin}/></div>
        {hasFilter && <button className="btn btn-ghost" onClick={reset}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{data.length}</b> districts trouvés sur 137</span>
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
                <th className="sortable">Nom du district</th>
                <th>Région synodale</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Paroisses</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
                <th style={{ textAlign: 'right' }}>Ouvriers</th>
                <th>Admin District</th>
                <th>Modifié</th>
                <th style={{ width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={10} style={{ height: 280, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <I.network size={48} style={{ opacity: 0.25 }}/>
                    <div className="sg-md" style={{ fontSize: 16 }}>Aucun district trouvé</div>
                    <button className="btn btn-outline" onClick={reset}>Réinitialiser les filtres</button>
                  </div>
                </td></tr>
              )}
              {data.map(d => (
                <tr key={d.id} style={{ background: selection.has(d.id) ? 'rgba(46,151,68,0.06)' : 'transparent' }}>
                  <td><input type="checkbox" className="checkbox" checked={selection.has(d.id)} onChange={() => toggle(d.id)}/></td>
                  <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(d.id).padStart(3,'0')}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(91,155,213,0.15)', color: '#5B9BD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.network size={14}/></div>
                      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{d.nom}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{d.region}</td>
                  <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5AC472', fontWeight: 600 }}>{d.paroisses}</td>
                  <td className="mono sg-md" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 14 }}>{d.fideles.toLocaleString('fr')}</td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)' }}>{d.ouvriers}</td>
                  <td>
                    {d.adminInitials ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar initials={d.adminInitials} size={26} bg="rgba(230,81,0,0.22)" color="#E67A2E"/>
                        <span style={{ fontSize: 12.5 }}>{d.admin}</span>
                      </div>
                    ) : (
                      <span className="pill pill-orange" style={{ padding: '2px 8px' }}><I.alert size={9}/> Non assigné</span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{d.modifie}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button className="icon-btn" onClick={() => setViewPanel(d)}><I.eye size={15}/></button>
                      <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', district: d })}><I.pencil size={15}/></button>
                      <RowMenu district={d} onEdit={() => setFormPanel({ mode: 'edit', district: d })}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
            <span>Affichage <span style={{ color: 'var(--text)' }}>1 à {data.length}</span> sur <span style={{ color: 'var(--text)' }}>137</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="icon-btn"><I.chevL size={14}/></button>
              {[1,2,3].map(n => (
                <button key={n} style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: n === 1 ? 'var(--green)' : 'transparent', color: n === 1 ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{n}</button>
              ))}
              <span style={{ color: 'var(--text-3)' }}>…</span>
              <button style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>14</button>
              <button className="icon-btn"><I.chevR size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} district{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}/>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.download size={13}/>Excel</button>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.user size={13}/>Assigner admin</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {viewPanel && (
        <DistrictViewPanel
          district={viewPanel}
          onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', district: viewPanel }); setViewPanel(null); }}
        />
      )}

      {formPanel && (
        <DistrictFormPanel
          mode={formPanel.mode}
          district={formPanel.district}
          onClose={() => setFormPanel(null)}
          onSave={(d) => {
            setFormPanel(null);
            addToast({ type: 'success', title: formPanel.mode === 'create' ? 'District créé avec succès.' : 'Modifications enregistrées.', body: d.nom || formPanel.district?.nom });
          }}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
