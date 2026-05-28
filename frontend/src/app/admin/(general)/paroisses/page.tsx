'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, CompleteBar, NiveauPill, GpsCell, StatusPill, useOutside } from '@/components/admin/atoms';
import { sampleParoisses, REGIONS_22, DISTRICTS_BY_REGION } from '@/components/admin/data';

type Toast = { type: string; title: string; body?: string };
function useToast() {
  const [toasts, setToasts] = React.useState<(Toast & { id: string })[]>([]);
  const add = (t: Toast) => setToasts(ts => [...ts, { ...t, id: Math.random().toString(36) }]);
  const remove = (id: string) => setToasts(ts => ts.filter(x => x.id !== id));
  return { toasts, add, remove };
}
function ToastStack({ toasts, remove }: { toasts: (Toast & { id: string })[]; remove: (id: string) => void }) {
  return (
    <div className="toast-stack">
      {toasts.slice(-3).map(t => (
        <div key={t.id} className={'toast ' + t.type}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</div>
            {t.body && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.body}</div>}
          </div>
          <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => remove(t.id)}><I.x size={12}/></button>
        </div>
      ))}
    </div>
  );
}

function RowMenu({ paroisse: _p, onDelete }: { paroisse: any; onDelete: () => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 200 }}>
          <button onClick={() => setOpen(false)}><I.download size={13}/>Exporter PDF</button>
          <button onClick={() => setOpen(false)}><I.history size={13}/>Historique</button>
          <button onClick={() => setOpen(false)}><I.lock size={13}/>Désactiver</button>
          <hr/>
          <button className="danger" onClick={() => { setOpen(false); onDelete(); }}><I.trash size={13}/>Supprimer</button>
        </div>
      )}
    </div>
  );
}

function DeleteModal({ paroisse, onCancel, onConfirm }: { paroisse: any; onCancel: () => void; onConfirm: () => void }) {
  const [value, setValue] = React.useState('');
  const matches = value.trim() === paroisse.nom;
  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(198,40,40,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E55B5B' }}>
            <I.trash size={22} />
          </div>
          <h3 className="sg" style={{ fontSize: 20, margin: 0 }}>Supprimer la paroisse</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
            Vous êtes sur le point de supprimer <b style={{ color: 'var(--text)' }}>"{paroisse.nom}"</b>. Cette action est irréversible.
          </p>
          <div style={{ width: '100%', marginTop: 6 }}>
            <div className="label">Pour confirmer, tapez le nom de la paroisse</div>
            <input className="input" placeholder={paroisse.nom} value={value} onChange={e => setValue(e.target.value)} autoFocus />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', width: '100%', marginTop: 8 }}>
            <button className="btn btn-outline" onClick={onCancel}>Annuler</button>
            <button className="btn btn-danger" disabled={!matches} style={{ opacity: matches ? 1 : 0.4, cursor: matches ? 'pointer' : 'not-allowed' }} onClick={matches ? onConfirm : undefined}>Supprimer définitivement</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── View Panel ────────────────────────────────────────────────────────────────
function ParoisseViewPanel({ paroisse, onClose, onEdit }: { paroisse: any; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(46,151,68,0.15)', color: '#5AC472', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.cross size={18}/></div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 16, margin: 0 }}>{paroisse.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{paroisse.region} · {paroisse.district}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Status pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <NiveauPill niveau={paroisse.niveau}/>
            <StatusPill statut={paroisse.statut}/>
            <GpsCell ok={paroisse.gps}/>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Fidèles', value: paroisse.fideles.toLocaleString('fr'), color: '#5AC472' },
              { label: 'Ouvriers', value: String(paroisse.ouvriers), color: 'var(--text)' },
              { label: 'Complétude', value: paroisse.complete + '%', color: paroisse.complete >= 80 ? '#5AC472' : paroisse.complete >= 50 ? '#FF8A3D' : '#E55B5B' },
              { label: 'Dernière modif.', value: paroisse.modifie, color: 'var(--text-2)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Complétude bar */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Complétude</div>
            <CompleteBar pct={paroisse.complete}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, fontSize: 12 }}>
              {[
                { label: 'GPS renseigné', ok: paroisse.gps },
                { label: 'Statistiques 2025', ok: paroisse.complete > 60 },
                { label: 'Ouvriers renseignés', ok: paroisse.ouvriers > 0 },
                { label: 'Photos (min. 1)', ok: false },
              ].map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, color: c.ok ? '#5AC472' : 'var(--text-3)' }}>
                  {c.ok ? <I.check size={12}/> : <I.x size={12}/>} {c.label}
                </div>
              ))}
            </div>
          </div>

          {/* Identité */}
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</div>
            {[
              { label: 'Région', value: paroisse.region },
              { label: 'District', value: paroisse.district },
              { label: 'Niveau', value: paroisse.niveau },
              { label: 'Modifié par', value: paroisse.modPar || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          {/* GPS */}
          {paroisse.gps && (
            <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Coordonnées GPS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#5AC472' }}>3.8480° N, 11.5021° E</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Yaoundé, Centre — validé</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Form Panel (Create / Edit) ────────────────────────────────────────────────
const FORM_TABS = ['Général', 'Localisation GPS', 'Statistiques', 'Photos', 'Ouvriers', 'Œuvres'];

function ParoisseFormPanel({ mode, paroisse, onClose, onSave }: {
  mode: 'create' | 'edit';
  paroisse?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [tab, setTab] = React.useState(0);
  const [form, setForm] = React.useState({
    nom: paroisse?.nom || '',
    niveau: paroisse?.niveau || 'PAROISSE',
    statut: paroisse?.statut || 'actif',
    region: paroisse?.region || '',
    district: paroisse?.district || '',
    fondation: '',
    description: '',
    lat: paroisse?.gps ? '3.8480' : '',
    lng: paroisse?.gps ? '11.5021' : '',
    communiants: paroisse ? String(Math.round(paroisse.fideles * 0.6)) : '',
    nonCommuniants: paroisse ? String(Math.round(paroisse.fideles * 0.4)) : '',
    annee: '2025',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const districts = DISTRICTS_BY_REGION[form.region] || [];

  const tabDone = [
    form.nom && form.region && form.district,
    !!(form.lat && form.lng),
    !!(form.communiants),
    false,
    false,
    false,
  ];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 640 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>{mode === 'create' ? 'Nouvelle paroisse' : `Modifier — ${paroisse?.nom}`}</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Console Synodale · EEC Cameroun</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12, color: 'rgba(240,244,241,0.80)', borderColor: 'rgba(255,255,255,0.20)' }} onClick={onClose}>Annuler</button>
            <button className="btn" style={{ background: 'rgba(46,151,68,0.30)', color: '#5AC472', border: '1px solid rgba(46,151,68,0.50)', padding: '7px 14px', fontSize: 12 }} onClick={() => onSave({ ...form, draft: true })}>Brouillon</button>
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => onSave(form)}>Publier</button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)', overflowX: 'auto' }}>
          {FORM_TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: '10px 16px', fontSize: 12.5, fontWeight: tab === i ? 600 : 400,
              color: tab === i ? '#5AC472' : 'var(--text-2)',
              background: tab === i ? 'rgba(46,151,68,0.10)' : 'transparent',
              borderBottom: tab === i ? '2px solid #5AC472' : '2px solid transparent',
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: 'inherit',
            }}>
              {tabDone[i] && <I.check size={11} style={{ color: '#5AC472' }}/>}
              {i + 1}. {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '22px 22px', overflowY: 'auto', height: 'calc(100% - 130px)', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Tab 1: Général */}
          {tab === 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <div className="label">Nom de la paroisse *</div>
                  <input className="input" placeholder="Ex. Yaoundé-Centre" value={form.nom} onChange={e => set('nom', e.target.value)} />
                </div>
                <div>
                  <div className="label">Niveau *</div>
                  <Dropdown value={form.niveau} options={['PAROISSE','STATION','ANNEXE']} onChange={v => set('niveau', v)}/>
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
                <div>
                  <div className="label">Date de fondation</div>
                  <input className="input" type="date" value={form.fondation} onChange={e => set('fondation', e.target.value)}/>
                </div>
              </div>
              <div>
                <div className="label">Description / notes</div>
                <textarea className="input" rows={3} placeholder="Notes internes sur la paroisse..." style={{ resize: 'vertical', lineHeight: 1.5 }} value={form.description} onChange={e => set('description', e.target.value)}/>
              </div>
            </>
          )}

          {/* Tab 2: GPS */}
          {tab === 1 && (
            <>
              <div style={{ background: 'rgba(46,151,68,0.08)', border: '1px solid rgba(46,151,68,0.25)', borderRadius: 6, padding: '10px 14px', fontSize: 12.5, color: '#5AC472', display: 'flex', gap: 8, alignItems: 'center' }}>
                <I.map size={14}/>Coordonnées GPS — WGS84 (latitude / longitude décimales)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div className="label">Latitude *</div>
                  <input className="input mono" placeholder="Ex. 3.8480" value={form.lat} onChange={e => set('lat', e.target.value)}/>
                </div>
                <div>
                  <div className="label">Longitude *</div>
                  <input className="input mono" placeholder="Ex. 11.5021" value={form.lng} onChange={e => set('lng', e.target.value)}/>
                </div>
              </div>
              {form.lat && form.lng && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#5AC472' }}>
                  <I.check size={13}/> Coordonnées valides — Cameroun ({parseFloat(form.lat).toFixed(4)}°N, {parseFloat(form.lng).toFixed(4)}°E)
                </div>
              )}
              {/* Map placeholder */}
              <div style={{ height: 220, borderRadius: 6, background: 'rgba(46,151,68,0.06)', border: '1px dashed rgba(46,151,68,0.30)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-3)' }}>
                <I.map size={32} style={{ opacity: 0.4 }}/>
                <div style={{ fontSize: 12 }}>Aperçu carte — disponible après saisie des coordonnées</div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8 }}>
                <I.alert size={13} style={{ flexShrink: 0, marginTop: 1 }}/>
                <span>Les coordonnées doivent se trouver à l'intérieur des frontières du Cameroun. Une vérification automatique sera effectuée lors de l'enregistrement.</span>
              </div>
            </>
          )}

          {/* Tab 3: Statistiques */}
          {tab === 2 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Statistiques de l'assemblée</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['2025','2024','2023'].map(y => (
                    <button key={y} onClick={() => set('annee', y)} style={{
                      padding: '4px 12px', fontSize: 12, borderRadius: 5, border: '1px solid',
                      background: form.annee === y ? 'var(--green)' : 'transparent',
                      color: form.annee === y ? '#fff' : 'var(--text-2)',
                      borderColor: form.annee === y ? 'var(--green)' : 'var(--border)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>{y}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div className="label">Fidèles communiants</div>
                  <input className="input mono" type="number" min="0" placeholder="0" value={form.communiants} onChange={e => set('communiants', e.target.value)}/>
                </div>
                <div>
                  <div className="label">Fidèles non-communiants</div>
                  <input className="input mono" type="number" min="0" placeholder="0" value={form.nonCommuniants} onChange={e => set('nonCommuniants', e.target.value)}/>
                </div>
              </div>
              {(form.communiants || form.nonCommuniants) && (
                <div className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>Total fidèles {form.annee}</div>
                  <div className="sg" style={{ fontSize: 32, color: '#5AC472' }}>
                    {((parseInt(form.communiants) || 0) + (parseInt(form.nonCommuniants) || 0)).toLocaleString('fr')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 6 }}>
                    Communiants : {(parseInt(form.communiants) || 0).toLocaleString('fr')} · Non-communiants : {(parseInt(form.nonCommuniants) || 0).toLocaleString('fr')}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tab 4: Photos */}
          {tab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
              <div style={{ width: '100%', height: 200, borderRadius: 8, border: '2px dashed rgba(46,151,68,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', background: 'rgba(46,151,68,0.04)' }}>
                <I.upload size={32} style={{ color: '#5AC472', opacity: 0.6 }}/>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Déposer des photos ici</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>JPG, PNG · 5 Mo max par photo · min. 1 requis</div>
                <button className="btn btn-outline" style={{ marginTop: 4, fontSize: 12 }}>Parcourir les fichiers</button>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Les photos sont utilisées pour enrichir la fiche de la paroisse et le rapport synodal.</div>
            </div>
          )}

          {/* Tab 5: Ouvriers */}
          {tab === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Ouvriers affectés</div>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}><I.plus size={13}/>Ajouter un ouvrier</button>
              </div>
              <div style={{ background: 'rgba(255,214,0,0.06)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FFD600', display: 'flex', gap: 8, alignItems: 'center' }}>
                <I.alert size={13}/>
                La gestion des ouvriers est disponible depuis la page Ouvriers. Les associations seront synchronisées automatiquement.
              </div>
              {paroisse?.ouvriers > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="data">
                    <thead><tr><th>Nom</th><th>Grade</th><th>Statut</th></tr></thead>
                    <tbody>
                      <tr><td>Pasteur Exemple</td><td><span className="pill pill-green">Pasteur</span></td><td><span className="pill pill-green">Actif</span></td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 6: Œuvres */}
          {tab === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Œuvres associées</div>
                <button className="btn btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}><I.plus size={13}/>Associer une œuvre</button>
              </div>
              <div style={{ background: 'rgba(255,214,0,0.06)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FFD600', display: 'flex', gap: 8, alignItems: 'center' }}>
                <I.alert size={13}/>
                La gestion des œuvres est disponible depuis la page Œuvres. Les associations seront synchronisées automatiquement.
              </div>
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
                <I.building size={36} style={{ opacity: 0.3 }}/>
                <div style={{ marginTop: 10, fontSize: 13 }}>Aucune œuvre associée à cette paroisse</div>
              </div>
            </div>
          )}

          {/* Navigation tabs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
            <button className="btn btn-ghost" onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0} style={{ opacity: tab === 0 ? 0.3 : 1 }}><I.chevL size={14}/>Précédent</button>
            <span style={{ fontSize: 11, color: 'var(--text-3)', alignSelf: 'center' }}>{tab + 1} / {FORM_TABS.length}</span>
            {tab < FORM_TABS.length - 1
              ? <button className="btn btn-outline" onClick={() => setTab(t => t + 1)}>Suivant<I.chevR size={14}/></button>
              : <button className="btn btn-primary" onClick={() => onSave(form)}>Publier<I.check size={14}/></button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ParoissesPage() {
  const { toasts, add: addToast, remove } = useToast();
  const [selection, setSelection] = React.useState<Set<number>>(new Set());
  const [search, setSearch] = React.useState('');
  const [region, setRegion] = React.useState('Toutes régions');
  const [district, setDistrict] = React.useState('Tous districts');
  const [niveau, setNiveau] = React.useState('Tous niveaux');
  const [gpsFilter, setGpsFilter] = React.useState('GPS: tous');
  const [statut, setStatut] = React.useState('Tous statuts');
  const [year, setYear] = React.useState('Année: 2025');
  const [sort, setSort] = React.useState({ col: 'modifie', dir: 'desc' });
  const [confirmDelete, setConfirmDelete] = React.useState<any>(null);
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [formPanel, setFormPanel] = React.useState<{ mode: 'create'|'edit'; paroisse?: any } | null>(null);

  const hasFilter = [region !== 'Toutes régions', district !== 'Tous districts', niveau !== 'Tous niveaux', gpsFilter !== 'GPS: tous', statut !== 'Tous statuts', search !== ''].some(Boolean);

  let data = sampleParoisses as any[];
  if (search) data = data.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));
  if (region !== 'Toutes régions') data = data.filter(p => p.region === region);
  if (niveau !== 'Tous niveaux') data = data.filter(p => p.niveau === niveau.toUpperCase());
  if (gpsFilter === 'GPS: avec') data = data.filter(p => p.gps);
  if (gpsFilter === 'GPS: sans') data = data.filter(p => !p.gps);
  if (statut !== 'Tous statuts') {
    const map: Record<string, string> = { 'Actif':'actif','Inactif':'inactif','En attente':'en_attente' };
    data = data.filter(p => p.statut === map[statut]);
  }

  const toggle = (id: number) => { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); };
  const toggleAll = () => { if (selection.size === data.length) setSelection(new Set()); else setSelection(new Set(data.map((d: any) => d.id))); };
  const reset = () => { setSearch(''); setRegion('Toutes régions'); setDistrict('Tous districts'); setNiveau('Tous niveaux'); setGpsFilter('GPS: tous'); setStatut('Tous statuts'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>553 paroisses</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>22 régions · 137 districts</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Téléchargement du modèle Excel...' })}><I.upload size={14}/>Importer Excel</button>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export en cours...', body:'553 paroisses → fichier .xlsx' })}><I.download size={14}/>Exporter tout</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer une paroisse</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Nom de paroisse..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ width: 200 }}><Dropdown label="Région"     value={region}     options={['Toutes régions', ...REGIONS_22]}                                           onChange={setRegion} /></div>
        <div style={{ width: 180 }}><Dropdown label="District"   value={district}   options={['Tous districts','BAFOUSSAM NORD','YAOUNDE CENTRE','DSCHANG','DEIDO','NGAOUNDERE']} onChange={setDistrict} /></div>
        <div style={{ width: 140 }}><Dropdown label="Niveau"     value={niveau}     options={['Tous niveaux','Paroisse','Station','Annexe']}                               onChange={setNiveau} /></div>
        <div style={{ width: 130 }}><Dropdown label="GPS"        value={gpsFilter}  options={['GPS: tous','GPS: avec','GPS: sans']}                                        onChange={setGpsFilter} /></div>
        <div style={{ width: 140 }}><Dropdown label="Statut"     value={statut}     options={['Tous statuts','Actif','Inactif','En attente']}                              onChange={setStatut} /></div>
        <div style={{ width: 130 }}><Dropdown label="Année stats" value={year}      options={['Année: 2025','Année: 2024','Année: 2023']}                                  onChange={setYear} /></div>
        {hasFilter && <button className="btn btn-ghost" onClick={reset} style={{ marginBottom: 1 }}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13} />
          <span><b style={{ color: '#A4CFF0', fontWeight: 600 }}>{data.length}</b> paroisses trouvées sur 553</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" className="checkbox" checked={data.length > 0 && selection.size === data.length} onChange={toggleAll} /></th>
                <th style={{ width: 40 }}>#</th>
                <th className="sortable" onClick={() => setSort({ col:'nom', dir: sort.col==='nom'&&sort.dir==='asc'?'desc':'asc' })}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Nom {sort.col === 'nom' && (sort.dir === 'asc' ? <I.chevU size={11}/> : <I.chevD size={11}/>)}</span>
                </th>
                <th>Région</th><th>District</th><th>Niveau</th>
                <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
                <th style={{ textAlign: 'right' }}>Ouvriers</th>
                <th>GPS</th><th>Complétude</th><th>Statut</th><th>Modifié</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr><td colSpan={13} style={{ height: 320, textAlign: 'center', padding: 40 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <I.cross size={48} style={{ opacity: 0.25 }} />
                    <div className="sg-md" style={{ fontSize: 16 }}>Aucune paroisse trouvée</div>
                    <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Modifiez vos filtres ou créez une nouvelle paroisse.</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-outline" onClick={reset}>Réinitialiser les filtres</button>
                      <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer une paroisse</button>
                    </div>
                  </div>
                </td></tr>
              )}
              {data.map((p: any, idx: number) => {
                const isPending = p.statut === 'en_attente';
                return (
                  <tr key={p.id} style={{ background: selection.has(p.id) ? 'rgba(46,151,68,0.06)' : 'transparent' }}>
                    <td><input type="checkbox" className="checkbox" checked={selection.has(p.id)} onChange={() => toggle(p.id)} /></td>
                    <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(idx + 1).padStart(3, '0')}</td>
                    <td><span style={{ fontWeight: 500, color: 'var(--text)', fontSize: 14 }}>{p.nom}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.region}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.district}</td>
                    <td><NiveauPill niveau={p.niveau} /></td>
                    <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.fideles.toLocaleString('fr')}</td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{p.ouvriers}</td>
                    <td><GpsCell ok={p.gps} /></td>
                    <td><CompleteBar pct={p.complete} /></td>
                    <td><StatusPill statut={p.statut} /></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.modifie}</td>
                    <td>
                      {isPending ? (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn" style={{ background:'rgba(46,151,68,0.18)',color:'#5AC472',border:'1px solid rgba(46,151,68,0.40)',padding:'5px 9px',fontSize:11 }} onClick={() => addToast({ type:'success', title:`Modification validée — ${p.nom}` })}><I.check size={12}/>Valider</button>
                          <button className="btn" style={{ background:'rgba(198,40,40,0.15)',color:'#E55B5B',border:'1px solid rgba(198,40,40,0.30)',padding:'5px 9px',fontSize:11 }} onClick={() => addToast({ type:'warn', title:`Modification rejetée — ${p.nom}` })}><I.x size={12}/>Rejeter</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button className="icon-btn" onClick={() => setViewPanel(p)}><I.eye size={15}/></button>
                          <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', paroisse: p })}><I.pencil size={15}/></button>
                          <RowMenu paroisse={p} onDelete={() => setConfirmDelete(p)} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
            <span>Affichage <span style={{ color: 'var(--text)' }}>1 à {data.length}</span> sur <span style={{ color: 'var(--text)' }}>553</span></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="icon-btn"><I.chevL size={14}/></button>
              {[1,2,3,4].map(n => <button key={n} style={{ width:28,height:28,border:0,borderRadius:5,background:n===1?'var(--green)':'transparent',color:n===1?'#fff':'var(--text-2)',fontSize:12,fontWeight:600,cursor:'pointer' }}>{n}</button>)}
              <span style={{ color:'var(--text-3)' }}>…</span>
              <button style={{ width:28,height:28,border:0,borderRadius:5,background:'transparent',color:'var(--text-2)',fontSize:12,fontWeight:600,cursor:'pointer' }}>56</button>
              <button className="icon-btn"><I.chevR size={14}/></button>
            </div>
          </div>
        )}
      </div>

      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{selection.size} paroisse{selection.size > 1 ? 's' : ''} sélectionnée{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }} />
          <button className="btn btn-outline" style={{ padding:'6px 10px', fontSize:12 }}><I.download size={13}/>Excel</button>
          <button className="btn btn-outline" style={{ padding:'6px 10px', fontSize:12 }}><I.download size={13}/>PDF</button>
          <button className="btn btn-outline" style={{ padding:'6px 10px', fontSize:12 }}><I.lock size={13}/>Désactiver</button>
          <button className="btn btn-ghost" style={{ padding:'6px 10px', fontSize:12 }} onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {confirmDelete && (
        <DeleteModal paroisse={confirmDelete} onCancel={() => setConfirmDelete(null)}
          onConfirm={() => { setConfirmDelete(null); addToast({ type:'success', title:`Paroisse "${confirmDelete.nom}" supprimée.` }); }} />
      )}

      {viewPanel && (
        <ParoisseViewPanel
          paroisse={viewPanel}
          onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', paroisse: viewPanel }); setViewPanel(null); }}
        />
      )}

      {formPanel && (
        <ParoisseFormPanel
          mode={formPanel.mode}
          paroisse={formPanel.paroisse}
          onClose={() => setFormPanel(null)}
          onSave={(data) => {
            setFormPanel(null);
            addToast({ type: 'success', title: formPanel.mode === 'create' ? 'Paroisse créée avec succès.' : 'Modifications enregistrées.', body: data.nom || formPanel.paroisse?.nom });
          }}
        />
      )}

      <ToastStack toasts={toasts} remove={remove} />
    </div>
  );
}
