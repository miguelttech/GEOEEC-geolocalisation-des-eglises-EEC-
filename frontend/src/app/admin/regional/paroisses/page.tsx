'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, StatusPill, NiveauPill, GpsCell, CompleteBar, useOutside } from '@/components/admin/atoms';
import { PAROISSES_MIFI, DISTRICTS_MIFI } from '@/components/admin/dataRegional';

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
        </div>
      )}
    </div>
  );
}

function ParoisseViewPanel({ paroisse, onClose, onEdit }: { paroisse: any; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{paroisse.nom}</h2>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>MIFI · {paroisse.district}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <NiveauPill niveau={paroisse.niveau}/>
            <StatusPill statut={paroisse.statut}/>
            <GpsCell ok={paroisse.gps}/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Fidèles', value: paroisse.fideles.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers', value: paroisse.ouvriers, color: 'var(--text)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Localisation</div>
            {[
              { label: 'Région', value: 'MIFI' },
              { label: 'District', value: paroisse.district },
              { label: 'Niveau', value: paroisse.niveau },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Complétude du dossier</div>
            <CompleteBar pct={paroisse.complete} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Modifié {paroisse.modifie} par {paroisse.modPar}</div>
        </div>
      </div>
    </div>
  );
}

function ParoisseFormPanel({ mode, paroisse, onClose, onSave }: {
  mode: 'create'|'edit'; paroisse?: any; onClose: () => void; onSave: (d: any) => void;
}) {
  const districts = DISTRICTS_MIFI.map(d => d.nom);
  const [form, setForm] = React.useState({
    nom: paroisse?.nom || '',
    district: paroisse?.district || '',
    niveau: paroisse?.niveau || 'PAROISSE',
    statut: paroisse?.statut || 'actif',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouvelle paroisse' : `Modifier — ${paroisse?.nom}`}</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Région MIFI</div>
          </div>
          <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="label">Région</div>
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <I.shield size={13} style={{ color: '#5B9BD5' }}/>
              MIFI — scopée à votre région
            </div>
          </div>
          <div>
            <div className="label">Nom de la paroisse *</div>
            <input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex. Bafoussam-Nkouoptamo" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div className="label">District *</div>
              <Dropdown value={form.district || 'Sélectionner'} options={districts} onChange={v => set('district', v)} />
            </div>
            <div>
              <div className="label">Niveau *</div>
              <Dropdown value={form.niveau} options={['PAROISSE','STATION','ANNEXE']} onChange={v => set('niveau', v)} />
            </div>
            <div>
              <div className="label">Statut</div>
              <Dropdown value={form.statut} options={['actif','inactif','en_attente']} onChange={v => set('statut', v)} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)} disabled={!form.nom || !form.district} style={{ opacity: (!form.nom || !form.district) ? 0.5 : 1 }}>
              {mode === 'create' ? 'Créer la paroisse' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ParoissesMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [district, setDistrict] = React.useState('Tous districts');
  const [niveau, setNiveau] = React.useState('Tous niveaux');
  const [gps, setGps] = React.useState('GPS — tous');
  const [statut, setStatut] = React.useState('Tous statuts');
  const [selection, setSelection] = React.useState(new Set<number>());
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; paroisse?: any } | null>(null);
  const [page, setPage] = React.useState(1);
  const PER_PAGE = 10;

  let data = [...PAROISSES_MIFI];
  if (search) data = data.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));
  if (district !== 'Tous districts') data = data.filter(p => p.district === district);
  if (niveau !== 'Tous niveaux') data = data.filter(p => p.niveau === niveau);
  if (gps === 'Avec GPS') data = data.filter(p => p.gps);
  if (gps === 'Sans GPS') data = data.filter(p => !p.gps);
  if (statut !== 'Tous statuts') data = data.filter(p => p.statut === statut.toLowerCase().replace(' ', '_'));

  const hasFilter = !!(search || district !== 'Tous districts' || niveau !== 'Tous niveaux' || gps !== 'GPS — tous' || statut !== 'Tous statuts');
  const reset = () => { setSearch(''); setDistrict('Tous districts'); setNiveau('Tous niveaux'); setGps('GPS — tous'); setStatut('Tous statuts'); setPage(1); };

  const totalPages = Math.ceil(data.length / PER_PAGE);
  const paginated = data.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function toggle(id: number) { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); }
  function toggleAll() { setSelection(selection.size === paginated.length ? new Set() : new Set(paginated.map(d => d.id))); }

  const districtOptions = ['Tous districts', ...DISTRICTS_MIFI.map(d => d.nom)];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>{PAROISSES_MIFI.length} paroisses · Région MIFI</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>6 districts couverts</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...', body:'Paroisses MIFI → .xlsx' })}><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Ajouter une paroisse</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom de paroisse..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 200 }}><Dropdown label="District" value={district} options={districtOptions} onChange={v => { setDistrict(v); setPage(1); }}/></div>
        <div style={{ width: 160 }}><Dropdown label="Niveau" value={niveau} options={['Tous niveaux','PAROISSE','STATION','ANNEXE']} onChange={v => { setNiveau(v); setPage(1); }}/></div>
        <div style={{ width: 140 }}><Dropdown label="GPS" value={gps} options={['GPS — tous','Avec GPS','Sans GPS']} onChange={v => { setGps(v); setPage(1); }}/></div>
        <div style={{ width: 160 }}><Dropdown label="Statut" value={statut} options={['Tous statuts','Actif','Inactif','En attente']} onChange={v => { setStatut(v); setPage(1); }}/></div>
        {hasFilter && <button className="btn btn-ghost" onClick={reset}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{data.length}</b> paroisses trouvées sur {PAROISSES_MIFI.length}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" className="checkbox" checked={paginated.length > 0 && selection.size === paginated.length} onChange={toggleAll}/></th>
                <th style={{ width: 40 }}>#</th>
                <th className="sortable">Nom</th>
                <th>District</th>
                <th>Niveau</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Ouvriers</th>
                <th>GPS</th>
                <th>Complétude</th>
                <th>Statut</th>
                <th style={{ fontSize: 11, color: 'var(--text-3)' }}>Modifié</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 && (
                <tr><td colSpan={12} style={{ height: 260, textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <I.church size={48} style={{ opacity: 0.25 }}/>
                    <div className="sg-md" style={{ fontSize: 16 }}>Aucune paroisse trouvée</div>
                    <button className="btn btn-outline" onClick={reset}>Réinitialiser</button>
                  </div>
                </td></tr>
              )}
              {paginated.map((p, i) => (
                <tr key={p.id} style={{ background: selection.has(p.id) ? 'rgba(91,155,213,0.06)' : 'transparent' }}>
                  <td><input type="checkbox" className="checkbox" checked={selection.has(p.id)} onChange={() => toggle(p.id)}/></td>
                  <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String((page - 1) * PER_PAGE + i + 1).padStart(2,'0')}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.nom}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>par {p.modPar}</div>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.district}</td>
                  <td><NiveauPill niveau={p.niveau}/></td>
                  <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.fideles.toLocaleString('fr')}</td>
                  <td className="mono" style={{ textAlign: 'right' }}>{p.ouvriers}</td>
                  <td><GpsCell ok={p.gps}/></td>
                  <td style={{ width: 100 }}><CompleteBar pct={p.complete}/></td>
                  <td><StatusPill statut={p.statut}/></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.modifie}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button className="icon-btn" onClick={() => setViewPanel(p)}><I.eye size={15}/></button>
                      <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', paroisse: p })}><I.pencil size={15}/></button>
                      <RowMenu onView={() => setViewPanel(p)} onEdit={() => setFormPanel({ mode: 'edit', paroisse: p })}/>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > PER_PAGE && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
            <span>Page <span style={{ color: 'var(--text)' }}>{page}</span> sur <span style={{ color: 'var(--text)' }}>{totalPages}</span> — {data.length} résultats</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="icon-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}><I.chevL size={14}/></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, j) => j + 1).map(n => (
                <button key={n} style={{ width:28,height:28,border:0,borderRadius:5,background:n===page?'#5B9BD5':'transparent',color:n===page?'#fff':'var(--text-2)',fontSize:12,fontWeight:600,cursor:'pointer' }} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button className="icon-btn" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}><I.chevR size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} paroisse{selection.size > 1 ? 's' : ''} sélectionnée{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }}/>
          <button className="btn btn-outline" style={{ padding: '6px 10px', fontSize: 12 }}><I.download size={13}/>Exporter</button>
          <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {viewPanel && (
        <ParoisseViewPanel paroisse={viewPanel} onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', paroisse: viewPanel }); setViewPanel(null); }}/>
      )}
      {formPanel && (
        <ParoisseFormPanel mode={formPanel.mode} paroisse={formPanel.paroisse} onClose={() => setFormPanel(null)}
          onSave={d => { setFormPanel(null); addToast({ type:'success', title: formPanel.mode === 'create' ? 'Paroisse créée.' : 'Modifications enregistrées.', body: d.nom || formPanel.paroisse?.nom }); }}/>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
