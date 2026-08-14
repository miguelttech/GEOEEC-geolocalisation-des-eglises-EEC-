'use client';
import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { api, TypeOeuvre, Oeuvre, PagedResult, RegionSynodale, District, Paroisse } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { GpsCell } from '@/components/admin/atoms';

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

// ─── Type pill ────────────────────────────────────────────────────────────────
function TypePill({ label, couleur }: { label: string; couleur: string }) {
  return (
    <span className="pill" style={{ background: couleur + '22', color: couleur, borderColor: couleur + '55', fontSize: 11.5 }}>
      {label}
    </span>
  );
}

// ─── Localisation label ───────────────────────────────────────────────────────
// EXIGENCE : 4 niveaux de rattachement — National / Région / District / Paroisse.
function LocalisationCell({ o }: { o: Oeuvre }) {
  if (o.rattachement === 'paroisse') return <span style={{ fontSize: 12 }}><span style={{ color: 'var(--text-3)' }}>Paroisse </span>{o.paroisse_nom}</span>;
  if (o.rattachement === 'district') return <span style={{ fontSize: 12 }}><span style={{ color: 'var(--text-3)' }}>District </span>{o.district_nom}</span>;
  if (o.rattachement === 'region')   return <span style={{ fontSize: 12 }}><span style={{ color: 'var(--text-3)' }}>Région </span>{o.region_nom}</span>;
  return <span className="pill pill-gold" style={{ fontSize: 10.5 }}>National</span>;
}

// ─── View Panel ───────────────────────────────────────────────────────────────
function OeuvreViewPanel({ oeuvre: o, onClose, onEdit }: {
  oeuvre: Oeuvre; onClose: () => void; onEdit: () => void;
}) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: o.type_oeuvre_couleur + '22', color: o.type_oeuvre_couleur, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.building size={18}/>
            </div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{o.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>ID-{String(o.id).padStart(4,'0')} · {o.type_oeuvre_label}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <TypePill label={o.type_oeuvre_label} couleur={o.type_oeuvre_couleur}/>
            {o.est_active
              ? <span className="pill pill-green">Active</span>
              : <span className="pill pill-gray">Inactive</span>}
            <GpsCell ok={!!(o.latitude && o.longitude)}/>
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Localisation</div>
            {[
              { label: 'Paroisse',  value: o.paroisse_nom  || '—' },
              { label: 'District',  value: o.district_nom  || '—' },
              { label: 'Région',    value: o.region_nom    || '—' },
              { label: 'Adresse',   value: o.adresse       || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 12 }}>
                <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontWeight: 500, textAlign: 'right' }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Informations</div>
            {[
              { label: 'Capacité',         value: o.capacite     ? String(o.capacite)      : '—' },
              { label: 'Personnels',       value: o.nb_personnels != null ? String(o.nb_personnels) : '—' },
              { label: 'En prospection',   value: o.en_prospection ? 'Oui' : 'Non' },
              { label: 'Année création',   value: o.annee_creation ? String(o.annee_creation) : '—' },
              { label: 'Téléphone',        value: o.telephone    || '—' },
              { label: 'Email',            value: o.email        || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          {o.description && (
            <div className="card" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-2)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Description</div>
              {o.description}
            </div>
          )}

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
// EXIGENCE : 4 niveaux de rattachement — « national » réservé à l'administrateur général.
type GeoLevel = 'national' | 'paroisse' | 'district' | 'region';
interface FormState {
  nom: string; adresse: string; description: string;
  type_oeuvre: string; est_active: boolean;
  capacite: string; nb_personnels: string; en_prospection: boolean; annee_creation: string;
  telephone: string; email: string;
  latitude: string; longitude: string;
  geo_level: GeoLevel;
  region: string; district: string; paroisse: string;
}
function emptyForm(): FormState {
  return {
    nom: '', adresse: '', description: '', type_oeuvre: '',
    est_active: true, capacite: '', nb_personnels: '', en_prospection: false, annee_creation: '',
    telephone: '', email: '', latitude: '', longitude: '',
    geo_level: 'paroisse', region: '', district: '', paroisse: '',
  };
}
function formFromOeuvre(o: Oeuvre): FormState {
  const geo_level: GeoLevel = o.rattachement;
  return {
    nom: o.nom, adresse: o.adresse, description: o.description,
    type_oeuvre: String(o.type_oeuvre_id), est_active: o.est_active,
    capacite: o.capacite ? String(o.capacite) : '',
    nb_personnels: o.nb_personnels != null ? String(o.nb_personnels) : '',
    en_prospection: o.en_prospection,
    annee_creation: o.annee_creation ? String(o.annee_creation) : '',
    telephone: o.telephone, email: o.email,
    latitude:  o.latitude  ? String(o.latitude)  : '',
    longitude: o.longitude ? String(o.longitude) : '',
    geo_level,
    region:   String(o.region_id   || ''),
    district: String(o.district_id || ''),
    paroisse: String(o.paroisse_id || ''),
  };
}

// ─── GPS Map Picker ──────────────────────────────────────────────────────────
function GpsMapPicker({ lat, lng }: { lat: number|null; lng: number|null }) {
  const mapDiv  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<LeafletMap | null>(null);
  const marker  = useRef<LeafletMarker | null>(null);
  useEffect(() => {
    if (!mapDiv.current || mapInst.current) return;
    let cancelled = false;
    import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapDiv.current || mapInst.current) return;
      const initLat = lat ?? 4.5, initLng = lng ?? 12.5;
      const map = L.map(mapDiv.current, { center: [initLat, initLng], zoom: lat ? 11 : 6 });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© OSM · CartoDB', maxZoom: 19, subdomains: 'abcd' }).addTo(map);
      const mkIcon = () => L.divIcon({ html: `<div style="width:16px;height:16px;background:#5B9BD5;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`, iconSize:[16,16], iconAnchor:[8,8], className:'' });
      if (lat !== null && lng !== null) { marker.current = L.marker([lat,lng],{icon:mkIcon()}).addTo(map); }
      // EXIGENCE : le marqueur n'est plus déplaçable directement sur la carte —
      // il ne fait que visualiser les coordonnées saisies (aucun clic ne le repositionne).
      mapInst.current = map;
    });
    return () => { cancelled=true; if(mapInst.current){mapInst.current.remove();mapInst.current=null;marker.current=null;} };
  }, []); // eslint-disable-line
  useEffect(() => {
    if (!mapInst.current || lat===null || lng===null) return;
    import('leaflet').then(({default:L}) => {
      if(!mapInst.current) return;
      const mkIcon = () => L.divIcon({html:`<div style="width:16px;height:16px;background:#5B9BD5;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,iconSize:[16,16],iconAnchor:[8,8],className:''});
      if (marker.current) marker.current.setLatLng([lat,lng]);
      else { marker.current = L.marker([lat,lng],{icon:mkIcon()}).addTo(mapInst.current); }
      mapInst.current.panTo([lat,lng]);
    });
  }, [lat, lng]);
  return <div ref={mapDiv} style={{ height:280, borderRadius:8, overflow:'hidden', zIndex:0, border:'1px solid rgba(91,155,213,0.30)' }} />;
}

// ─── Form Tabs ────────────────────────────────────────────────────────────────
const FORM_TABS_OEU = [
  { label: 'Identité',      icon: 'hexagon'  as const },
  { label: 'Localisation',  icon: 'pin'      as const },
  { label: 'GPS & Contact', icon: 'map'      as const },
];

// ─── Form Panel ───────────────────────────────────────────────────────────────
function OeuvreFormPanel({ mode, oeuvre, types, isSuper, onClose, onSaved }: {
  mode: 'create' | 'edit'; oeuvre?: Oeuvre; types: TypeOeuvre[]; isSuper: boolean;
  onClose: () => void; onSaved: (nom: string) => void;
}) {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState<FormState>(oeuvre ? formFromOeuvre(oeuvre) : emptyForm());
  const [regions, setRegions]     = useState<RegionSynodale[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [paroisses, setParoisses] = useState<Paroisse[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    api.get<RegionSynodale[]>('/api/geo/regions/liste/').then(setRegions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.region) { setDistricts([]); return; }
    api.get<PagedResult<District>>(`/api/geo/districts/?region=${form.region}`)
      .then(r => setDistricts(r.results)).catch(() => {});
  }, [form.region]);

  useEffect(() => {
    if (!form.district || form.geo_level !== 'paroisse') { setParoisses([]); return; }
    api.get<PagedResult<Paroisse>>(`/api/geo/paroisses/?district=${form.district}`)
      .then(r => setParoisses(r.results)).catch(() => {});
  }, [form.district, form.geo_level]);

  function changeLevel(level: GeoLevel) {
    setForm(f => ({ ...f, geo_level: level, district: '', paroisse: '' }));
  }

  async function handleSave() {
    // EXIGENCE : en modification, SEULS nom/téléphone/adresse sont envoyés
    // (le backend refuse tout autre champ — voir CHAMPS_MODIFIABLES).
    if (mode === 'edit') {
      if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return; }
      setSaving(true); setError('');
      try {
        await api.patch(`/api/oeuvres/oeuvres/${oeuvre!.id}/`, {
          nom: form.nom.trim(), telephone: form.telephone, adresse: form.adresse,
        });
        onSaved(form.nom);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!form.nom.trim() || !form.type_oeuvre) {
      setError('Nom et type sont obligatoires.'); return;
    }
    if (form.geo_level === 'paroisse' && !form.paroisse) { setError('Sélectionner une paroisse.'); return; }
    if (form.geo_level === 'district' && !form.district) { setError('Sélectionner un district.'); return; }
    if (form.geo_level === 'region'   && !form.region)   { setError('Sélectionner une région.');   return; }

    setSaving(true); setError('');
    try {
      const lat = form.latitude  ? parseFloat(form.latitude)  : null;
      const lng = form.longitude ? parseFloat(form.longitude) : null;
      const payload: Record<string, unknown> = {
        nom: form.nom.trim(), adresse: form.adresse, description: form.description,
        type_oeuvre: Number(form.type_oeuvre), est_active: form.est_active,
        capacite:       form.capacite       ? Number(form.capacite)       : null,
        nb_personnels:  form.nb_personnels  ? Number(form.nb_personnels)  : null,
        en_prospection: form.en_prospection,
        annee_creation: form.annee_creation ? Number(form.annee_creation) : null,
        telephone: form.telephone, email: form.email,
        paroisse: form.geo_level === 'paroisse' ? Number(form.paroisse) : null,
        district: form.geo_level === 'district' ? Number(form.district) : null,
        region:   form.geo_level === 'region'   ? Number(form.region)   : null,
      };
      if (lat !== null && lng !== null) { payload.latitude = lat; payload.longitude = lng; }
      await api.post('/api/oeuvres/oeuvres/', payload);
      onSaved(form.nom);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  const latNum = parseFloat(form.latitude);
  const lngNum = parseFloat(form.longitude);
  const gpsValid = !isNaN(latNum) && !isNaN(lngNum) && form.latitude && form.longitude;

  const tabDone = [
    !!(form.nom.trim() && form.type_oeuvre),
    !!(form.geo_level === 'paroisse' ? form.paroisse : form.geo_level === 'district' ? form.district : form.region),
    !!(form.latitude && form.longitude),
  ];

  const Lbl = { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' as const };

  // EXIGENCE : en modification, on ne permet de changer QUE nom/téléphone/adresse
  // — formulaire simplifié, sans onglets, sans GPS ni rattachement.
  if (mode === 'edit') {
    return (
      <div className="overlay" onClick={onClose}>
        <div className="slide-panel" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)', flexShrink: 0 }}>
            <h2 className="sg-md" style={{ fontSize: 17, margin: 0 }}>Modifier — {oeuvre?.nom}</h2>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16} /></button>
          </div>
          {error && (
            <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '10px 24px', fontSize: 12.5, color: '#DC2626', display: 'flex', gap: 8 }}>
              <I.alert size={14} /> {error}
            </div>
          )}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1D4ED8' }}>
              Seuls le nom, le téléphone et l&apos;adresse peuvent être modifiés. Le rattachement et la position GPS sont verrouillés.
            </div>
            <div>
              <label style={Lbl}>Nom de l&apos;œuvre *</label>
              <input className="input" value={form.nom} onChange={e => set('nom', e.target.value)} style={{ color: '#111827', fontWeight: 600 }} autoFocus />
            </div>
            <div>
              <label style={Lbl}>Téléphone</label>
              <input className="input mono" placeholder="+237 6XX…" value={form.telephone} onChange={e => set('telephone', e.target.value)} style={{ color: '#111827' }} />
            </div>
            <div>
              <label style={Lbl}>Adresse</label>
              <input className="input" placeholder="Quartier, ville…" value={form.adresse} onChange={e => set('adresse', e.target.value)} style={{ color: '#111827' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
              <button className="btn btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="ls-spinner" /> : <><I.check size={14} />Enregistrer</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 820 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)', flexShrink: 0 }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 19, margin: 0 }}>+ Nouvelle œuvre EEC</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Étape {tab + 1} / {FORM_TABS_OEU.length} · {FORM_TABS_OEU[tab].label}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12 }} onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-primary" style={{ padding: '7px 18px', fontSize: 12, minWidth: 130 }} onClick={handleSave} disabled={saving}>
              {saving ? <span className="ls-spinner" /> : <><I.check size={14} />Créer l&apos;œuvre</>}
            </button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '10px 24px', fontSize: 12.5, color: '#DC2626', display: 'flex', gap: 8, flexShrink: 0 }}>
            <I.alert size={14} /> {error}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0 }}>
          {FORM_TABS_OEU.map((t, i) => {
            const Ic = I[t.icon];
            const isActive = tab === i, isDone = tabDone[i];
            return (
              <button key={i} onClick={() => setTab(i)} style={{
                padding: '12px 20px', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1E3A5F' : isDone ? '#1D4ED8' : '#374151',
                background: isActive ? '#fff' : 'transparent',
                borderBottom: isActive ? '2px solid #3B82F6' : '2px solid transparent',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7, marginBottom: -2,
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: isActive ? '#3B82F6' : isDone ? '#DBEAFE' : '#E5E7EB', color: isActive ? '#fff' : isDone ? '#1D4ED8' : '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
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
            <div className="g g-2" style={{ gap: 16 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={Lbl}>Nom de l'œuvre *</label>
                <input className="input" placeholder="Ex. École Primaire de Bonanjo" value={form.nom} onChange={e => set('nom', e.target.value)} style={{ color: '#111827', fontSize: 15, fontWeight: 600 }} autoFocus />
              </div>
              <div>
                <label style={Lbl}>Type d'œuvre *</label>
                <select className="input" style={{ color: '#111827' }} value={form.type_oeuvre} onChange={e => set('type_oeuvre', e.target.value)}>
                  <option value="">— Choisir un type —</option>
                  {types.map(t => <option key={t.id} value={String(t.id)}>{t.nom}</option>)}
                </select>
              </div>
              <div>
                <label style={Lbl}>Statut</label>
                <select className="input" style={{ color: '#111827' }} value={form.est_active ? '1' : '0'} onChange={e => set('est_active', e.target.value === '1')}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={Lbl}>Description</label>
                <textarea className="input" rows={3} placeholder="Historique, état actuel, particularités…" value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical', color: '#111827' }} />
              </div>
            </div>
          )}

          {/* Tab 2 — Localisation */}
          {tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Niveau */}
              <div>
                <label style={Lbl}>Niveau de rattachement *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([...(['paroisse', 'district', 'region'] as GeoLevel[]), ...(isSuper ? ['national' as GeoLevel] : [])]).map(lvl => (
                    <button key={lvl} className={`btn ${form.geo_level === lvl ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: 13, padding: '7px 18px' }} onClick={() => changeLevel(lvl)}>
                      {lvl === 'paroisse' ? 'Paroisse' : lvl === 'district' ? 'District' : lvl === 'region' ? 'Région' : 'National'}
                    </button>
                  ))}
                </div>
                {form.geo_level === 'national' && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-3)' }}>
                    Œuvre nationale — aucun rattachement géographique (visible dans toute l&apos;EEC).
                  </div>
                )}
              </div>
              {form.geo_level !== 'national' && (
                <div className="g g-2" style={{ gap: 16 }}>
                  <div>
                    <label style={Lbl}>Région synodiale{form.geo_level === 'region' ? ' *' : ''}</label>
                    <select className="input" style={{ color: '#111827' }} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value, district: '', paroisse: '' }))}>
                      <option value="">— Choisir —</option>
                      {regions.map(r => <option key={r.id} value={String(r.id)}>{r.nom}</option>)}
                    </select>
                  </div>
                  {form.geo_level !== 'region' && (
                    <div>
                      <label style={Lbl}>District{form.geo_level === 'district' ? ' *' : ''}</label>
                      <select className="input" style={{ color: '#111827' }} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value, paroisse: '' }))} disabled={!form.region}>
                        <option value="">— Choisir —</option>
                        {districts.map(d => <option key={d.id} value={String(d.id)}>{d.nom}</option>)}
                      </select>
                    </div>
                  )}
                  {form.geo_level === 'paroisse' && (
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={Lbl}>Paroisse *</label>
                      <select className="input" style={{ color: '#111827' }} value={form.paroisse} onChange={e => set('paroisse', e.target.value)} disabled={!form.district}>
                        <option value="">— Choisir une paroisse —</option>
                        {paroisses.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
              <div className="g g-2" style={{ gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={Lbl}>Adresse</label>
                  <input className="input" placeholder="Quartier, ville…" value={form.adresse} onChange={e => set('adresse', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={Lbl}>Capacité (personnes)</label>
                  <input className="input mono" type="number" placeholder="Ex. 500" value={form.capacite} onChange={e => set('capacite', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={Lbl}>Nombre de personnels</label>
                  <input className="input mono" type="number" placeholder="Ex. 24" value={form.nb_personnels} onChange={e => set('nb_personnels', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={Lbl}>Année de création</label>
                  <input className="input mono" type="number" placeholder="Ex. 1985" value={form.annee_creation} onChange={e => set('annee_creation', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={Lbl}>En prospection</label>
                  <select className="input" value={form.en_prospection ? 'oui' : 'non'} onChange={e => set('en_prospection', e.target.value === 'oui')} style={{ color: '#111827' }}>
                    <option value="non">Non</option>
                    <option value="oui">Oui — en prospection</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3 — GPS & Contact */}
          {tab === 2 && (
            <>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'center' }}>
                <I.pin size={14} /> Saisissez les coordonnées Latitude/Longitude ci-dessous — le marqueur apparaît uniquement pour visualiser la position saisie.
              </div>
              <GpsMapPicker lat={gpsValid ? latNum : null} lng={gpsValid ? lngNum : null} />
              <div className="g g-3" style={{ gap: 14 }}>
                <div>
                  <label style={Lbl}>Coord. Y — Latitude</label>
                  <input className="input mono" placeholder="Ex. 4.0511" value={form.latitude} onChange={e => set('latitude', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={Lbl}>Coord. X — Longitude</label>
                  <input className="input mono" placeholder="Ex. 9.7085" value={form.longitude} onChange={e => set('longitude', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={Lbl}>Téléphone</label>
                  <input className="input mono" placeholder="+237 6XX…" value={form.telephone} onChange={e => set('telephone', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={Lbl}>Email</label>
                  <input className="input" type="email" placeholder="oeuvre@eec.cm" value={form.email} onChange={e => set('email', e.target.value)} style={{ color: '#111827' }} />
                </div>
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #E5E7EB', marginTop: 'auto' }}>
            <button className="btn btn-ghost" onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0} style={{ opacity: tab === 0 ? 0.3 : 1, color: '#374151' }}>
              <I.chevL size={14} /> Précédent
            </button>
            <span style={{ fontSize: 11, color: '#9CA3AF', alignSelf: 'center' }}>{tab + 1} / {FORM_TABS_OEU.length}</span>
            {tab < FORM_TABS_OEU.length - 1 ? (
              <button className="btn btn-outline" onClick={() => setTab(t => t + 1)} style={{ color: '#374151', borderColor: '#D1D5DB' }}>Suivant <I.chevR size={14} /></button>
            ) : (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="ls-spinner" /> : <><I.check size={14} />{mode === 'create' ? 'Créer l\'œuvre' : 'Enregistrer'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// EXIGENCE : la suppression d'une œuvre n'existe plus (backend renvoie 405) —
// DeleteModal et son flux ont été entièrement retirés.

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OeuvresPage() {
  const { toasts, add: addToast } = useToast();
  const [types, setTypes]       = useState<TypeOeuvre[]>([]);
  const [oeuvres, setOeuvres]   = useState<Oeuvre[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterGps, setFilterGps]       = useState('');
  const [refresh, setRefresh]   = useState(0);
  const [viewPanel, setViewPanel]   = useState<Oeuvre | null>(null);
  const [formPanel, setFormPanel]   = useState<{ mode: 'create'|'edit'; oeuvre?: Oeuvre } | null>(null);
  const [regions, setRegions] = useState<RegionSynodale[]>([]);
  const [isSuper, setIsSuper] = useState(false);

  // Le niveau de rattachement « National » n'est proposé qu'à l'administrateur général.
  useEffect(() => {
    api.get<{ role: string }>('/api/auth/me/').then(m => setIsSuper(m.role === 'SUPER')).catch(() => {});
  }, []);

  const PAGE_SIZE = 50;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  function doRefresh() { setPage(1); setRefresh(r => r + 1); }

  // Load types + regions (static reference data)
  useEffect(() => {
    api.get<PagedResult<TypeOeuvre> | TypeOeuvre[]>('/api/oeuvres/types/?page_size=100')
      .then(r => setTypes(Array.isArray(r) ? r : r.results ?? []))
      .catch(() => {});
    api.get<RegionSynodale[]>('/api/geo/regions/liste/').then(setRegions).catch(() => {});
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch oeuvres
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search)        params.set('search', search);
    if (filterType)    params.set('type', filterType);
    if (filterRegion)  params.set('region', filterRegion);
    if (filterActive === '1') params.set('active', '1');
    if (filterActive === '0') params.set('active', '0');
    if (filterGps === 'avec') params.set('avec_gps', '1');
    if (filterGps === 'sans') params.set('sans_gps', '1');
    api.get<PagedResult<Oeuvre>>(`/api/oeuvres/oeuvres/?${params}`)
      .then(r => { setOeuvres(r.results); setTotal(r.count); })
      .catch(() => { addToast({ type: 'error', title: 'Erreur de chargement des œuvres.' }); })
      .finally(() => setLoading(false));
  }, [page, search, filterType, filterRegion, filterActive, filterGps, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilter = !!(search || filterType || filterRegion || filterActive || filterGps);
  function resetFilters() {
    setSearchInput(''); setSearch('');
    setFilterType(''); setFilterRegion(''); setFilterActive(''); setFilterGps('');
    setPage(1);
  }

  function handleSaved(nom: string) {
    setFormPanel(null);
    addToast({ type: 'success', title: formPanel?.mode === 'create' ? `Œuvre "${nom}" créée.` : 'Modifications enregistrées.', body: nom });
    doRefresh();
  }

  // Counts by type from loaded data (approximation — only current page)
  const typeCounts: Record<number, number> = {};
  oeuvres.forEach(o => { typeCounts[o.type_oeuvre_id] = (typeCounts[o.type_oeuvre_id] || 0) + 1; });

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

      {/* Type stats */}
      {types.length > 0 && (
        <div className="g g-fit" style={{ gap: 10 }}>
          {types.map(t => (
            <div key={t.id} className="card" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', outline: filterType === String(t.id) ? `2px solid ${t.couleur}` : 'none' }}
              onClick={() => setFilterType(filterType === String(t.id) ? '' : String(t.id))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.couleur }}/>
                <span style={{ fontSize: 10, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nom}</span>
              </div>
              <div className="sg" style={{ fontSize: 22, color: t.couleur, lineHeight: 1, marginTop: 2 }}>{t.nb_oeuvres}</div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>
            {loading ? '—' : total.toLocaleString('fr')} œuvre{total !== 1 ? 's' : ''}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>écoles, hôpitaux, terrains, fermes…</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"><I.download size={14}/>Exporter</button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Nouvelle œuvre</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Nom d'œuvre…" style={{ paddingLeft: 34, fontSize: 13 }}
            value={searchInput} onChange={e => setSearchInput(e.target.value)}/>
        </div>
        <div style={{ minWidth: 160 }}>
          <div className="label">Type</div>
          <select className="input" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}>
            <option value="">Tous types</option>
            {types.map(t => <option key={t.id} value={String(t.id)}>{t.nom}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 180 }}>
          <div className="label">Région</div>
          <select className="input" value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setPage(1); }}>
            <option value="">Toutes régions</option>
            {regions.map(r => <option key={r.id} value={String(r.id)}>{r.nom}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <div className="label">Statut</div>
          <select className="input" value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
            <option value="">Tous</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <div className="label">GPS</div>
          <select className="input" value={filterGps} onChange={e => { setFilterGps(e.target.value); setPage(1); }}>
            <option value="">Tous</option>
            <option value="avec">Avec GPS</option>
            <option value="sans">Sans GPS</option>
          </select>
        </div>
        {hasFilter && <button className="btn btn-ghost" onClick={resetFilters} style={{ alignSelf: 'flex-end' }}><I.refresh size={13}/>Réinitialiser</button>}
      </div>

      {hasFilter && (
        <div style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.filter size={13}/>
          <span><b style={{ color: '#A4CFF0' }}>{total.toLocaleString('fr')}</b> œuvre{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }}/>
            <span style={{ fontSize: 13 }}>Chargement des œuvres…</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th className="sortable">Œuvre</th>
                    <th>Type</th>
                    <th>Localisation</th>
                    <th>Région</th>
                    <th style={{ width: 90, textAlign: 'center' }}>GPS</th>
                    <th style={{ width: 70, textAlign: 'center' }}>Personnels</th>
                    <th style={{ width: 60 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {oeuvres.length === 0 && (
                    <tr><td colSpan={8} style={{ height: 280, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <I.building size={48} style={{ opacity: 0.25 }}/>
                        <div className="sg-md" style={{ fontSize: 16 }}>Aucune œuvre trouvée</div>
                        {hasFilter && <button className="btn btn-outline" onClick={resetFilters}>Réinitialiser les filtres</button>}
                      </div>
                    </td></tr>
                  )}
                  {oeuvres.map((o, idx) => (
                    <tr key={o.id}>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                        {String((page - 1) * PAGE_SIZE + idx + 1).padStart(3, '0')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: o.type_oeuvre_couleur + '22', color: o.type_oeuvre_couleur, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <I.building size={15}/>
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{o.nom}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>ID-{String(o.id).padStart(4,'0')}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <TypePill label={o.type_oeuvre_label} couleur={o.type_oeuvre_couleur}/>
                      </td>
                      <td><LocalisationCell o={o}/></td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{o.region_nom || '—'}</td>
                      <td style={{ textAlign: 'center' }}><GpsCell ok={!!(o.latitude && o.longitude)}/></td>
                      <td className="mono" style={{ textAlign: 'center', fontSize: 12.5 }}>{o.nb_personnels ?? '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button className="icon-btn" onClick={() => setViewPanel(o)}><I.eye size={15}/></button>
                          <button className="icon-btn green" onClick={() => setFormPanel({ mode: 'edit', oeuvre: o })}><I.pencil size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
                <span>Page <b style={{ color: 'var(--text)' }}>{page}</b> sur <b style={{ color: 'var(--text)' }}>{totalPages}</b> — {total.toLocaleString('fr')} œuvres</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button className="icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><I.chevL size={14}/></button>
                  {pageBtns.map((btn, i) => btn === '…'
                    ? <span key={i} style={{ padding: '0 4px', color: 'var(--text-3)' }}>…</span>
                    : <button key={btn} onClick={() => setPage(btn as number)} style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: page === btn ? 'var(--green)' : 'transparent', color: page === btn ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{btn}</button>
                  )}
                  <button className="icon-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><I.chevR size={14}/></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {viewPanel && (
        <OeuvreViewPanel oeuvre={viewPanel} onClose={() => setViewPanel(null)}
          onEdit={() => { setFormPanel({ mode: 'edit', oeuvre: viewPanel! }); setViewPanel(null); }}/>
      )}
      {formPanel && (
        <OeuvreFormPanel mode={formPanel.mode} oeuvre={formPanel.oeuvre} types={types} isSuper={isSuper}
          onClose={() => setFormPanel(null)} onSaved={handleSaved}/>
      )}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
