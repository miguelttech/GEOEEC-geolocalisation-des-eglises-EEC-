'use client';
import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, Grade, Ouvrier, PagedResult, RegionSynodale, District, Paroisse } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { Avatar, useOutside } from '@/components/admin/atoms';

// ─── Grade color by hierarchy level ──────────────────────────────────────────
const LEVEL_COLORS = ['#F59E0B','#F97316','#EF4444','#10B981','#3B82F6','#8B5CF6','#06B6D4','#94A3B8'];
function gradeColor(niveau: number) { return LEVEL_COLORS[Math.min(niveau - 1, 7)]; }

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; type: 'success'|'warn'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts(p => p.filter(x => x.id !== id)), []);
  const add    = useCallback((t: Omit<Toast,'id'>) => {
    const id = Date.now();
    setToasts(p => [...p, { ...t, id }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);
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

// ─── Initials from name ───────────────────────────────────────────────────────
function initials(nom: string, prenom: string) {
  return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
}

// ─── Status pill ──────────────────────────────────────────────────────────────
const STATUT_META: Record<string, { label: string; cls: string }> = {
  ACTIF:    { label: 'Actif',    cls: 'pill-green' },
  RETRAITE: { label: 'Retraité', cls: 'pill-gray'  },
  SUSPENDU: { label: 'Suspendu', cls: 'pill-orange' },
  DECEDE:   { label: 'Décédé',   cls: 'pill-red'   },
};
function StatutPill({ statut }: { statut: string }) {
  const m = STATUT_META[statut] || { label: statut, cls: 'pill-gray' };
  return <span className={`pill ${m.cls}`}>{m.label}</span>;
}

// ─── Grade pill ───────────────────────────────────────────────────────────────
function GradePill({ abreviation, niveau }: { abreviation: string | null; niveau?: number }) {
  const color = niveau ? gradeColor(niveau) : '#94A3B8';
  const label = abreviation || '—';
  return (
    <span className="pill" style={{ background: color + '22', color, borderColor: color + '55', fontSize: 11.5 }}>
      {label}
    </span>
  );
}

// ─── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 160 }}>
          <button onClick={() => { setOpen(false); onView(); }}><I.eye size={13}/>Voir la fiche</button>
          <button onClick={() => { setOpen(false); onEdit(); }}><I.pencil size={13}/>Modifier</button>
          <hr/>
          <button className="danger" onClick={() => { setOpen(false); onDelete(); }}><I.trash size={13}/>Supprimer</button>
        </div>
      )}
    </div>
  );
}

// ─── View Panel ───────────────────────────────────────────────────────────────
function OuvrierViewPanel({ ouvrier: o, grades, onClose, onEdit }: {
  ouvrier: Ouvrier; grades: Grade[]; onClose: () => void; onEdit: () => void;
}) {
  const grade = grades.find(g => g.id === o.grade_id);
  const color = grade ? gradeColor(grade.niveau) : '#94A3B8';
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={initials(o.nom, o.prenom)} size={44} bg={color + '22'} color={color}/>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{o.prenom} {o.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                ID-{String(o.id).padStart(4,'0')} · {o.grade_nom || 'Sans grade'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {o.grade_abreviation && <GradePill abreviation={o.grade_abreviation} niveau={grade?.niveau}/>}
            <StatutPill statut={o.statut}/>
            <span className="pill pill-gray">{o.sexe === 'M' ? 'Masculin' : 'Féminin'}</span>
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Affectation</div>
            {[
              { label: 'Paroisse',  value: o.paroisse_nom || '—' },
              { label: 'District',  value: o.district_nom  || '—' },
              { label: 'Région',    value: o.region_nom    || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact & Carrière</div>
            {[
              { label: 'Téléphone',      value: o.telephone    || '—' },
              { label: 'Email',          value: o.email        || '—' },
              { label: 'Date naissance', value: o.date_naissance  || '—' },
              { label: 'Ordination',     value: o.date_ordination || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          {(o.latitude && o.longitude) && (
            <div className="card" style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-2)' }}>
              <I.pin size={13} style={{ marginRight: 6, color: 'var(--green)' }}/>
              GPS : {o.latitude.toFixed(5)}, {o.longitude.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────
interface FormState {
  nom: string; prenom: string; sexe: string; statut: string;
  grade: string; paroisse: string;
  telephone: string; email: string;
  date_naissance: string; date_ordination: string;
  lat: string; lng: string;
}
function emptyForm(): FormState {
  return { nom: '', prenom: '', sexe: 'M', statut: 'ACTIF', grade: '', paroisse: '', telephone: '', email: '', date_naissance: '', date_ordination: '', lat: '', lng: '' };
}
function formFromOuvrier(o: Ouvrier): FormState {
  return {
    nom: o.nom, prenom: o.prenom, sexe: o.sexe, statut: o.statut,
    grade: String(o.grade_id || ''), paroisse: String(o.paroisse_id || ''),
    telephone: o.telephone, email: o.email,
    date_naissance: o.date_naissance || '', date_ordination: o.date_ordination || '',
    lat: o.latitude  ? String(o.latitude)  : '',
    lng: o.longitude ? String(o.longitude) : '',
  };
}

// ─── GPS Map Picker (inline) ──────────────────────────────────────────────────
function GpsMapPicker({ lat, lng, onChange }: { lat: number|null; lng: number|null; onChange: (la: number, lo: number) => void }) {
  const mapDiv  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);
  const marker  = useRef<any>(null);

  useEffect(() => {
    if (!mapDiv.current || mapInst.current) return;
    let cancelled = false;
    import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapDiv.current || mapInst.current) return;
      const initLat = lat ?? 4.5, initLng = lng ?? 12.5;
      const map = L.map(mapDiv.current, { center: [initLat, initLng], zoom: lat ? 11 : 6 });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OSM · CartoDB', maxZoom: 19, subdomains: 'abcd' }).addTo(map);
      const mkIcon = (L: any) => L.divIcon({ html: `<div style="width:16px;height:16px;background:#2E9744;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`, iconSize:[16,16], iconAnchor:[8,8], className:'' });
      if (lat !== null && lng !== null) { marker.current = L.marker([lat,lng],{icon:mkIcon(L)}).addTo(map); }
      map.on('click', (e: any) => {
        const {lat:la,lng:lo} = e.latlng;
        if (marker.current) marker.current.setLatLng([la,lo]);
        else { marker.current = L.marker([la,lo],{icon:mkIcon(L)}).addTo(map); }
        onChange(parseFloat(la.toFixed(6)), parseFloat(lo.toFixed(6)));
      });
      mapInst.current = map;
    });
    return () => { cancelled=true; if(mapInst.current){mapInst.current.remove();mapInst.current=null;marker.current=null;} };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!mapInst.current || lat===null || lng===null) return;
    import('leaflet').then(({default:L}) => {
      if(!mapInst.current) return;
      const mkIcon = (L:any) => L.divIcon({html:`<div style="width:16px;height:16px;background:#2E9744;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,iconSize:[16,16],iconAnchor:[8,8],className:''});
      if (marker.current) marker.current.setLatLng([lat,lng]);
      else { marker.current = L.marker([lat,lng],{icon:mkIcon(L)}).addTo(mapInst.current); }
      mapInst.current.panTo([lat,lng]);
    });
  }, [lat, lng]);

  return <div ref={mapDiv} style={{ height:280, borderRadius:8, overflow:'hidden', zIndex:0, border:'1px solid rgba(46,151,68,0.25)' }} />;
}

// ─── Form Tabs ────────────────────────────────────────────────────────────────
const FORM_TABS_OUV = [
  { label: 'Identité',    icon: 'user'   as const },
  { label: 'Affectation', icon: 'cross'  as const },
  { label: 'Contact GPS', icon: 'map'    as const },
];

// ─── Form Panel ───────────────────────────────────────────────────────────────
function OuvrierFormPanel({ mode, ouvrier, grades, onClose, onSaved }: {
  mode: 'create' | 'edit'; ouvrier?: Ouvrier; grades: Grade[];
  onClose: () => void; onSaved: (nom: string) => void;
}) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<FormState>(ouvrier ? formFromOuvrier(ouvrier) : emptyForm());
  const [regions, setRegions] = useState<RegionSynodale[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [paroisses, setParoisses] = useState<Paroisse[]>([]);
  const [regionId, setRegionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const L = { label: { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' as const } };

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Load regions
  useEffect(() => {
    api.get<RegionSynodale[]>('/api/geo/regions/liste/').then(setRegions).catch(() => {});
  }, []);

  // Load districts when region changes
  useEffect(() => {
    if (!regionId) { setDistricts([]); setDistrictId(''); setForm(f => ({ ...f, paroisse: '' })); return; }
    api.get<PagedResult<District>>(`/api/geo/districts/?region=${regionId}`)
      .then(r => setDistricts(r.results))
      .catch(() => {});
    setDistrictId(''); setForm(f => ({ ...f, paroisse: '' }));
  }, [regionId]);

  // Load paroisses when district changes
  useEffect(() => {
    if (!districtId) { setParoisses([]); setForm(f => ({ ...f, paroisse: '' })); return; }
    api.get<PagedResult<Paroisse>>(`/api/geo/paroisses/?district=${districtId}`)
      .then(r => setParoisses(r.results))
      .catch(() => {});
    setForm(f => ({ ...f, paroisse: '' }));
  }, [districtId]);

  // Pre-select region/district when editing
  useEffect(() => {
    if (ouvrier) {
      setRegionId(String(ouvrier.region_id || ''));
      setDistrictId(String(ouvrier.district_id || ''));
    }
  }, [ouvrier]);

  async function handleSave() {
    if (!form.nom.trim() || !form.prenom.trim() || !form.paroisse) {
      setError('Nom, prénom et paroisse sont obligatoires.'); return;
    }
    setSaving(true); setError('');
    try {
      const latF = parseFloat(form.lat), lngF = parseFloat(form.lng);
      const payload: Record<string, unknown> = {
        nom: form.nom.trim(), prenom: form.prenom.trim(),
        sexe: form.sexe, statut: form.statut,
        paroisse: Number(form.paroisse),
        grade: form.grade ? Number(form.grade) : null,
        telephone: form.telephone, email: form.email,
        date_naissance: form.date_naissance || null,
        date_ordination: form.date_ordination || null,
      };
      if (form.lat && form.lng && !isNaN(latF) && !isNaN(lngF)) {
        payload.latitude = latF; payload.longitude = lngF;
      }
      if (mode === 'create') {
        await api.post('/api/ouvriers/ouvriers/', payload);
      } else {
        await api.patch(`/api/ouvriers/ouvriers/${ouvrier!.id}/`, payload);
      }
      onSaved(form.nom);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  const latNum = parseFloat(form.lat || '');
  const lngNum = parseFloat(form.lng || '');
  const gpsValid = !isNaN(latNum) && !isNaN(lngNum) && form.lat && form.lng;

  const tabDone = [
    !!(form.nom.trim() && form.prenom.trim()),
    !!form.paroisse,
    !!(form.telephone || form.email),
  ];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 780 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)', flexShrink: 0 }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 19, margin: 0 }}>
              {mode === 'create' ? '+ Nouvel ouvrier EEC' : `Modifier — ${ouvrier?.prenom} ${ouvrier?.nom}`}
            </h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Étape {tab + 1} / {FORM_TABS_OUV.length} · {FORM_TABS_OUV[tab].label}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12 }} onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-primary" style={{ padding: '7px 18px', fontSize: 12, minWidth: 130 }} onClick={handleSave} disabled={saving}>
              {saving ? <span className="ls-spinner" /> : <><I.check size={14} />{mode === 'create' ? 'Créer l\'ouvrier' : 'Enregistrer'}</>}
            </button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '10px 24px', fontSize: 12.5, color: '#DC2626', display: 'flex', gap: 8, flexShrink: 0 }}>
            <I.alert size={14} /> {error}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {FORM_TABS_OUV.map((t, i) => {
            const Ic = I[t.icon];
            const isActive = tab === i;
            const isDone   = tabDone[i];
            return (
              <button key={i} onClick={() => setTab(i)} style={{
                padding: '12px 20px', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1B5E20' : isDone ? '#2E9744' : '#374151',
                background: isActive ? '#fff' : 'transparent',
                borderBottom: isActive ? '2px solid #2E9744' : '2px solid transparent',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7, marginBottom: -2,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: isActive ? '#2E9744' : isDone ? '#D1FAE5' : '#E5E7EB', color: isActive ? '#fff' : isDone ? '#065F46' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                  {isDone && !isActive ? <I.check size={10} /> : i + 1}
                </div>
                <Ic size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Tab 1 — Identité */}
          {tab === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={L.label}>Prénom(s) *</label>
                <input className="input" placeholder="Ex. Jean-Pierre" value={form.prenom} onChange={e => set('prenom', e.target.value)} style={{ color: '#111827' }} autoFocus />
              </div>
              <div>
                <label style={L.label}>Nom de famille *</label>
                <input className="input" placeholder="Ex. ATEBA" value={form.nom} onChange={e => set('nom', e.target.value)} style={{ color: '#111827', fontWeight: 600 }} />
              </div>
              <div>
                <label style={L.label}>Sexe</label>
                <select className="input" style={{ color: '#111827' }} value={form.sexe} onChange={e => set('sexe', e.target.value)}>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label style={L.label}>Statut</label>
                <select className="input" style={{ color: '#111827' }} value={form.statut} onChange={e => set('statut', e.target.value)}>
                  <option value="ACTIF">Actif</option>
                  <option value="RETRAITE">Retraité</option>
                  <option value="SUSPENDU">Suspendu</option>
                  <option value="DECEDE">Décédé</option>
                </select>
              </div>

              {form.prenom && form.nom && (
                <div style={{ gridColumn: '1/-1', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#2E9744', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
                    {form.prenom[0]}{form.nom[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{form.prenom} {form.nom}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>
                      {form.sexe === 'M' ? 'Masculin' : 'Féminin'} · {form.statut}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2 — Affectation */}
          {tab === 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={L.label}>Grade ecclésiastique</label>
                <select className="input" style={{ color: '#111827' }} value={form.grade} onChange={e => set('grade', e.target.value)}>
                  <option value="">— Sans grade assigné —</option>
                  {grades.map(g => <option key={g.id} value={String(g.id)}>{g.abreviation} — {g.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={L.label}>Région synodiale</label>
                <select className="input" style={{ color: '#111827' }} value={regionId} onChange={e => setRegionId(e.target.value)}>
                  <option value="">— Choisir une région —</option>
                  {regions.map(r => <option key={r.id} value={String(r.id)}>{r.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={L.label}>District</label>
                <select className="input" style={{ color: '#111827' }} value={districtId} onChange={e => setDistrictId(e.target.value)} disabled={!regionId}>
                  <option value="">— Choisir un district —</option>
                  {districts.map(d => <option key={d.id} value={String(d.id)}>{d.nom}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={L.label}>Paroisse d'affectation *</label>
                <select className="input" style={{ color: '#111827' }} value={form.paroisse} onChange={e => set('paroisse', e.target.value)} disabled={!districtId}>
                  <option value="">— Choisir une paroisse —</option>
                  {paroisses.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
                </select>
              </div>
              {!form.paroisse && (
                <div style={{ gridColumn: '1/-1', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#92400E' }}>
                  <I.alert size={13} style={{ marginRight: 6 }} />
                  La paroisse est obligatoire pour enregistrer l'ouvrier.
                </div>
              )}
            </div>
          )}

          {/* Tab 3 — Contact & GPS */}
          {tab === 2 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={L.label}>Téléphone</label>
                  <input className="input mono" placeholder="+237 6XX XXX XXX" value={form.telephone} onChange={e => set('telephone', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Email</label>
                  <input className="input" type="email" placeholder="email@eec.cm" value={form.email} onChange={e => set('email', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Date de naissance</label>
                  <input className="input" type="date" value={form.date_naissance} onChange={e => set('date_naissance', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Date d'ordination</label>
                  <input className="input" type="date" value={form.date_ordination} onChange={e => set('date_ordination', e.target.value)} style={{ color: '#111827' }} />
                </div>
              </div>

              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'center' }}>
                <I.pin size={14} /> Cliquez sur la carte pour localiser l'ouvrier, ou saisissez les coordonnées.
              </div>

              <GpsMapPicker lat={gpsValid ? latNum : null} lng={gpsValid ? lngNum : null}
                onChange={(la, lo) => { set('lat', String(la)); set('lng', String(lo)); }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={L.label}>Coord. Y — Latitude</label>
                  <input className="input mono" placeholder="Ex. 3.8480" value={form.lat} onChange={e => set('lat', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Coord. X — Longitude</label>
                  <input className="input mono" placeholder="Ex. 11.5021" value={form.lng} onChange={e => set('lng', e.target.value)} style={{ color: '#111827' }} />
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #E5E7EB', marginTop: 'auto' }}>
            <button className="btn btn-ghost" onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0} style={{ opacity: tab === 0 ? 0.3 : 1, color: '#374151' }}>
              <I.chevL size={14} /> Précédent
            </button>
            <span style={{ fontSize: 11, color: '#9CA3AF', alignSelf: 'center' }}>{tab + 1} / {FORM_TABS_OUV.length}</span>
            {tab < FORM_TABS_OUV.length - 1 ? (
              <button className="btn btn-outline" onClick={() => setTab(t => t + 1)} style={{ color: '#374151', borderColor: '#D1D5DB' }}>Suivant <I.chevR size={14} /></button>
            ) : (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="ls-spinner" /> : <><I.check size={14} />{mode === 'create' ? 'Créer l\'ouvrier' : 'Enregistrer'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
function DeleteModal({ ouvrier, onClose, onDeleted }: {
  ouvrier: Ouvrier; onClose: () => void; onDeleted: () => void;
}) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fullName = `${ouvrier.prenom} ${ouvrier.nom}`;

  async function handleDelete() {
    setDeleting(true); setError('');
    try {
      await api.delete(`/api/ouvriers/ouvriers/${ouvrier.id}/`);
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(198,40,40,0.15)', color: '#FF8A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.trash size={18}/>
          </div>
          <div>
            <div className="sg-md" style={{ fontSize: 16 }}>Supprimer l'ouvrier</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Action irréversible</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
          Pour confirmer, saisissez le nom complet :<br/>
          <strong style={{ color: 'var(--text)' }}>{fullName}</strong>
        </p>
        <input className="input" placeholder={fullName} value={confirm} onChange={e => setConfirm(e.target.value)}/>
        {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF8A7A' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={deleting}>Annuler</button>
          <button className="btn" style={{ background: '#C62828', color: '#fff', opacity: confirm === fullName ? 1 : 0.4 }}
            onClick={handleDelete} disabled={confirm !== fullName || deleting}>
            {deleting ? 'Suppression…' : 'Supprimer définitivement'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OuvriersPage() {
  const { toasts, add: addToast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [viewPanel, setViewPanel] = useState<Ouvrier | null>(null);
  const [formPanel, setFormPanel] = useState<{ mode: 'create'|'edit'; ouvrier?: Ouvrier } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Ouvrier | null>(null);
  const [regions, setRegions] = useState<RegionSynodale[]>([]);

  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  function doRefresh() { setPage(1); setRefresh(r => r + 1); }

  // Load grades (for stats + filter dropdown)
  useEffect(() => {
    api.get<Grade[] | PagedResult<Grade>>('/api/ouvriers/grades/')
      .then(r => setGrades(Array.isArray(r) ? r : (r as PagedResult<Grade>).results ?? []))
      .catch(() => {});
    api.get<RegionSynodale[] | PagedResult<RegionSynodale>>('/api/geo/regions/liste/')
      .then(r => setRegions(Array.isArray(r) ? r : (r as PagedResult<RegionSynodale>).results ?? []))
      .catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch ouvriers
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search)       params.set('search', search);
    if (filterGrade)  params.set('grade', filterGrade);
    if (filterRegion) params.set('region', filterRegion);
    if (filterStatut) params.set('statut', filterStatut);
    api.get<PagedResult<Ouvrier>>(`/api/ouvriers/ouvriers/?${params}`)
      .then(r => { setOuvriers(r.results); setTotal(r.count); })
      .catch(() => { addToast({ type: 'error', title: 'Erreur de chargement des ouvriers.' }); })
      .finally(() => setLoading(false));
  }, [page, search, filterGrade, filterRegion, filterStatut, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilter = !!(search || filterGrade || filterRegion || filterStatut);
  function resetFilters() { setSearchInput(''); setSearch(''); setFilterGrade(''); setFilterRegion(''); setFilterStatut(''); setPage(1); }

  function handleSaved(nom: string) {
    setFormPanel(null);
    addToast({ type: 'success', title: formPanel?.mode === 'create' ? `Ouvrier "${nom}" créé.` : `Modifications enregistrées.`, body: nom });
    doRefresh();
  }

  function handleDeleted() {
    const nom = deleteModal ? `${deleteModal.prenom} ${deleteModal.nom}` : '';
    setDeleteModal(null);
    addToast({ type: 'warn', title: `Ouvrier "${nom}" supprimé.` });
    doRefresh();
  }

  // Pagination buttons
  const pageBtns: (number | '…')[] = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pageBtns.push(i); }
  else {
    pageBtns.push(1);
    if (page > 3) pageBtns.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pageBtns.push(i);
    if (page < totalPages - 2) pageBtns.push('…');
    pageBtns.push(totalPages);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Grade stats */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(grades.length, 8)}, 1fr)`, gap: 10 }}>
        {grades.map(g => {
          const color = gradeColor(g.niveau);
          return (
            <div key={g.id} className="card" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', outline: filterGrade === String(g.id) ? `2px solid ${color}` : 'none' }}
              onClick={() => setFilterGrade(filterGrade === String(g.id) ? '' : String(g.id))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }}/>
                <span style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.abreviation}</span>
              </div>
              <div className="sg" style={{ fontSize: 20, color, lineHeight: 1, marginTop: 2 }}>{g.nb_ouvriers}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.nom}</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>
            {loading ? '—' : total.toLocaleString('fr')} ouvrier{total !== 1 ? 's' : ''}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{grades.length} grades hiérarchiques</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Créer un ouvrier</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom d'ouvrier…" style={{ paddingLeft: 34, fontSize: 13 }}
            value={searchInput} onChange={e => setSearchInput(e.target.value)}/>
        </div>
        <div style={{ minWidth: 160 }}>
          <div className="label">Grade</div>
          <select className="input" value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setPage(1); }}>
            <option value="">Tous grades</option>
            {grades.map(g => <option key={g.id} value={String(g.id)}>{g.abreviation} — {g.nom}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <div className="label">Région</div>
          <select className="input" value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1); }}>
            <option value="">Toutes régions</option>
            {regions.map(r => <option key={r.id} value={String(r.id)}>{r.nom}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 140 }}>
          <div className="label">Statut</div>
          <select className="input" value={filterStatut} onChange={e => { setFilterStatut(e.target.value); setPage(1); }}>
            <option value="">Tous statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="RETRAITE">Retraité</option>
            <option value="SUSPENDU">Suspendu</option>
            <option value="DECEDE">Décédé</option>
          </select>
        </div>
        {hasFilter && <button className="btn btn-ghost" onClick={resetFilters} style={{ alignSelf: 'flex-end' }}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{total.toLocaleString('fr')}</b> ouvrier{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }}/>
            <span style={{ fontSize: 13 }}>Chargement des ouvriers…</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th className="sortable">Ouvrier</th>
                    <th>Grade</th>
                    <th>Paroisse assignée</th>
                    <th>District</th>
                    <th>Région</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                    <th style={{ width: 80 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ouvriers.length === 0 && (
                    <tr><td colSpan={9} style={{ height: 280, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <I.users size={48} style={{ opacity: 0.25 }}/>
                        <div className="sg-md" style={{ fontSize: 16 }}>Aucun ouvrier trouvé</div>
                        {hasFilter && <button className="btn btn-outline" onClick={resetFilters}>Réinitialiser les filtres</button>}
                      </div>
                    </td></tr>
                  )}
                  {ouvriers.map((o, idx) => {
                    const grade = grades.find(g => g.id === o.grade_id);
                    const color = grade ? gradeColor(grade.niveau) : '#94A3B8';
                    return (
                      <tr key={o.id}>
                        <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                          {String((page - 1) * PAGE_SIZE + idx + 1).padStart(3, '0')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar initials={initials(o.nom, o.prenom)} size={34} bg={color + '22'} color={color}/>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.prenom} {o.nom}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ID-{String(o.id).padStart(4,'0')}</div>
                            </div>
                          </div>
                        </td>
                        <td><GradePill abreviation={o.grade_abreviation} niveau={grade?.niveau}/></td>
                        <td style={{ fontSize: 13 }}>{o.paroisse_nom || '—'}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.district_nom || '—'}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.region_nom || '—'}</td>
                        <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.telephone || '—'}</td>
                        <td><StatutPill statut={o.statut}/></td>
                        <td>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button className="icon-btn" onClick={() => setViewPanel(o)}><I.eye size={15}/></button>
                            <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', ouvrier: o })}><I.pencil size={15}/></button>
                            <RowMenu
                              onView={() => setViewPanel(o)}
                              onEdit={() => setFormPanel({ mode: 'edit', ouvrier: o })}
                              onDelete={() => setDeleteModal(o)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
                <span>Page <b style={{ color: 'var(--text)' }}>{page}</b> sur <b style={{ color: 'var(--text)' }}>{totalPages}</b> — {total.toLocaleString('fr')} ouvriers</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className="icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><I.chevL size={14}/></button>
                  {pageBtns.map((btn, i) => btn === '…'
                    ? <span key={`sep-${i}`} style={{ padding: '0 4px', color: 'var(--text-3)' }}>…</span>
                    : <button key={`p-${btn}`} onClick={() => setPage(btn as number)} style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: page === btn ? 'var(--green)' : 'transparent', color: page === btn ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{btn}</button>
                  )}
                  <button className="icon-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><I.chevR size={14}/></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewPanel && (
        <OuvrierViewPanel ouvrier={viewPanel} grades={grades} onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', ouvrier: viewPanel! }); setViewPanel(null); }}/>
      )}
      {formPanel && (
        <OuvrierFormPanel mode={formPanel.mode} ouvrier={formPanel.ouvrier} grades={grades}
          onClose={() => setFormPanel(null)} onSaved={handleSaved}/>
      )}
      {deleteModal && (
        <DeleteModal ouvrier={deleteModal} onClose={() => setDeleteModal(null)} onDeleted={handleDeleted}/>
      )}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
