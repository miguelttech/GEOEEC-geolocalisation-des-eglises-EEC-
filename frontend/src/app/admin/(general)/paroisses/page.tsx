'use client';
import 'leaflet/dist/leaflet.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, Paroisse, Ouvrier, Oeuvre, PagedResult, getCsrf } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { CompleteBar, CategoriePill, GpsCell, StatusPill, Dropdown, useOutside } from '@/components/admin/atoms';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

interface Region   { id: number; nom: string; code: string | null; }
interface District { id: number; nom: string; region_id: number; region_nom: string; nb_paroisses: number; }
interface StatAnn  { id: number; paroisse: number; annee: number; communiants: number; non_communiants: number; }

function computeComplete(p: Paroisse): number {
  let s = 0;
  if (p.latitude !== null && p.longitude !== null) s += 25;
  if (p.nombre_fideles !== null) s += 25;
  if (p.telephone) s += 25;
  if (p.email) s += 25;
  return s;
}

/* ── Toast ─────────────────────────────────────────────────────────────── */
type Toast = { type: string; title: string; body?: string };
function useToast() {
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([]);
  const add    = useCallback((t: Toast) => setToasts(ts => [...ts, { ...t, id: Math.random().toString(36) }]), []);
  const remove = useCallback((id: string) => setToasts(ts => ts.filter(x => x.id !== id)), []);
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
          <button className="icon-btn" style={{ width: 22, height: 22 }} onClick={() => remove(t.id)}><I.x size={12} /></button>
        </div>
      ))}
    </div>
  );
}

/* ── EXIGENCES : la suppression et l'activation/désactivation d'une paroisse
      n'existent plus — ni ici, ni côté serveur (RowMenu et DeleteModal retirés). ── */

/* ── GPS Map Picker ────────────────────────────────────────────────────── */
function GpsMapPicker({ lat, lng, onChange }: {
  lat: number | null; lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const mapDiv   = useRef<HTMLDivElement>(null);
  const mapInst  = useRef<any>(null);
  const marker   = useRef<any>(null);

  useEffect(() => {
    if (!mapDiv.current || mapInst.current) return;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapDiv.current || mapInst.current) return;
      const initLat = lat ?? 4.5;
      const initLng = lng ?? 12.5;
      const map = L.map(mapDiv.current, { center: [initLat, initLng], zoom: lat ? 11 : 6, zoomControl: true });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CartoDB', maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      if (lat !== null && lng !== null) {
        marker.current = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div style="width:18px;height:18px;background:#2E9744;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
            iconSize: [18, 18], iconAnchor: [9, 9], className: '',
          }),
        }).addTo(map);
      }

      map.on('click', (e: any) => {
        const { lat: la, lng: lo } = e.latlng;
        if (marker.current) {
          marker.current.setLatLng([la, lo]);
        } else {
          marker.current = L.marker([la, lo], {
            icon: L.divIcon({
              html: `<div style="width:18px;height:18px;background:#2E9744;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
              iconSize: [18, 18], iconAnchor: [9, 9], className: '',
            }),
          }).addTo(map);
        }
        onChange(parseFloat(la.toFixed(6)), parseFloat(lo.toFixed(6)));
      });

      mapInst.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; marker.current = null; }
    };
  }, []); // eslint-disable-line

  // Sync marker when text inputs change
  useEffect(() => {
    if (!mapInst.current || lat === null || lng === null) return;
    import('leaflet').then(({ default: L }) => {
      if (!mapInst.current) return;
      if (marker.current) {
        marker.current.setLatLng([lat, lng]);
      } else {
        marker.current = L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div style="width:18px;height:18px;background:#2E9744;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
            iconSize: [18, 18], iconAnchor: [9, 9], className: '',
          }),
        }).addTo(mapInst.current);
      }
      mapInst.current.panTo([lat, lng]);
    });
  }, [lat, lng]);

  return <div ref={mapDiv} style={{ height: 320, borderRadius: 8, overflow: 'hidden', zIndex: 0, border: '1px solid rgba(46,151,68,0.25)' }} />;
}

/* ── Ouvrier Selector ──────────────────────────────────────────────────── */
function OuvrierSelector({ selected, onChange }: {
  selected: Ouvrier[];
  onChange: (list: Ouvrier[]) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Ouvrier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    api.get<PagedResult<Ouvrier>>(`/api/ouvriers/ouvriers/?search=${encodeURIComponent(q)}&page_size=20`)
      .then(r => { if (!cancelled) setResults(r.results); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q]);

  const toggle = (o: Ouvrier) => {
    if (selected.some(s => s.id === o.id)) {
      onChange(selected.filter(s => s.id !== o.id));
    } else {
      onChange([...selected, o]);
    }
  };

  const unselectable = results.filter(r => !selected.some(s => s.id === r.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.map(o => (
            <span key={o.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(46,151,68,0.12)', border: '1px solid rgba(46,151,68,0.30)',
              fontSize: 12, color: '#1B5E20', fontWeight: 500,
            }}>
              {o.prenom} {o.nom}
              {o.grade_abreviation && <span style={{ fontSize: 10, opacity: 0.7 }}>· {o.grade_abreviation}</span>}
              <button onClick={() => toggle(o)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#C62828', padding: 0, display: 'flex' }}>
                <I.x size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search box */}
      <div style={{ position: 'relative' }}>
        <I.search size={14} style={{ position: 'absolute', top: 12, left: 11, color: '#6B7280' }} />
        <input className="input" placeholder="Rechercher un ouvrier par nom ou prénom…" style={{ paddingLeft: 34, fontSize: 13 }}
          value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {/* Results */}
      {q.trim() && (
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
          {loading && <div style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>Recherche…</div>}
          {!loading && unselectable.length === 0 && q && (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
              {results.length > 0 ? 'Tous les résultats sont déjà sélectionnés' : `Aucun ouvrier trouvé pour "${q}"`}
            </div>
          )}
          {unselectable.map(o => (
            <div key={o.id} onClick={() => toggle(o)} style={{
              padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid #F3F4F6',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F0FDF4')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(46,151,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#1B5E20', flexShrink: 0 }}>
                {(o.prenom || '?')[0]}{(o.nom || '')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{o.prenom} {o.nom}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>
                  {o.grade_nom || 'Ouvrier'} · {o.statut === 'OCCUPE' ? '🟢 Occupé' : '⚪ Inoccupé'}
                </div>
              </div>
              <I.plus size={13} style={{ color: '#2E9744', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {selected.length === 0 && !q && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          Recherchez des ouvriers pour les associer à cette paroisse
        </div>
      )}
    </div>
  );
}

/* ── Oeuvre Selector ───────────────────────────────────────────────────── */
function OeuvreSelector({ selected, onChange }: {
  selected: Oeuvre[];
  onChange: (list: Oeuvre[]) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Oeuvre[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    let cancelled = false;
    setLoading(true);
    api.get<PagedResult<Oeuvre>>(`/api/oeuvres/oeuvres/?search=${encodeURIComponent(q)}&page_size=20`)
      .then(r => { if (!cancelled) setResults(r.results); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [q]);

  const toggle = (o: Oeuvre) => {
    if (selected.some(s => s.id === o.id)) onChange(selected.filter(s => s.id !== o.id));
    else onChange([...selected, o]);
  };
  const unselectable = results.filter(r => !selected.some(s => s.id === r.id));

  const TYPE_COLORS: Record<string, string> = {
    SCOLAIRE: '#1565C0', UNIVERSITAIRE: '#6A1B9A', MEDICALE: '#C62828',
    AGROPASTORALE: '#E65100', IMMEUBLE: '#455A64', TERRAIN: '#2E9744', AUTRE: '#5B9BD5',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selected.map(o => (
            <span key={o.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 999,
              background: 'rgba(91,155,213,0.10)', border: '1px solid rgba(91,155,213,0.30)',
              fontSize: 12, color: '#1E3A5F', fontWeight: 500,
            }}>
              {o.nom}
              <span style={{ fontSize: 10, opacity: 0.6 }}>· {o.type_oeuvre_label || o.type_oeuvre_nom}</span>
              <button onClick={() => toggle(o)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: '#C62828', padding: 0, display: 'flex' }}>
                <I.x size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <I.search size={14} style={{ position: 'absolute', top: 12, left: 11, color: '#6B7280' }} />
        <input className="input" placeholder="Rechercher une œuvre EEC…" style={{ paddingLeft: 34, fontSize: 13 }}
          value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {q.trim() && (
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
          {loading && <div style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>Recherche…</div>}
          {!loading && unselectable.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
              {results.length > 0 ? 'Tous les résultats sont sélectionnés' : `Aucune œuvre trouvée pour "${q}"`}
            </div>
          )}
          {unselectable.map(o => (
            <div key={o.id} onClick={() => toggle(o)} style={{
              padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              borderBottom: '1px solid #F3F4F6',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}>
              <div style={{
                width: 30, height: 30, borderRadius: 6, flexShrink: 0,
                background: `${TYPE_COLORS[o.type_oeuvre_nom] || '#5B9BD5'}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <I.hexagon size={14} style={{ color: TYPE_COLORS[o.type_oeuvre_nom] || '#5B9BD5' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{o.nom}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{o.type_oeuvre_label || o.type_oeuvre_nom}</div>
              </div>
              <I.plus size={13} style={{ color: '#5B9BD5', flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {selected.length === 0 && !q && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
          Recherchez des œuvres EEC pour les associer à cette paroisse
        </div>
      )}
    </div>
  );
}

/* ── View Panel ────────────────────────────────────────────────────────── */
function ParoisseViewPanel({ paroisse: p, onClose, onEdit }: { paroisse: Paroisse; onClose: () => void; onEdit: () => void }) {
  const complete = computeComplete(p);
  const hasGps   = p.latitude !== null && p.longitude !== null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(46,151,68,0.15)', color: '#2E9744', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.cross size={18} />
            </div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 16, margin: 0 }}>{p.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{p.region_nom} · {p.district_nom}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13} />Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CategoriePill categorie={p.categorie} /><GpsCell ok={hasGps} />
            {p.en_prospection && <span className="pill pill-orange">En prospection</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Fidèles', value: p.nombre_fideles !== null ? p.nombre_fideles.toLocaleString('fr') : '—', color: '#2E9744' },
              { label: 'Communiants', value: p.communiants !== null ? p.communiants.toLocaleString('fr') : '—', color: '#1565C0' },
              { label: 'Non-communiants', value: p.non_communiants !== null ? p.non_communiants.toLocaleString('fr') : '—', color: '#6A1B9A' },
              { label: 'Ouvriers', value: String(p.nb_ouvriers ?? 0), color: '#E8B600' },
              { label: 'Mis à jour', value: new Date(p.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' }), color: 'var(--text-2)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 20, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</div>
            {[
              { label: 'Région', value: p.region_nom },
              { label: 'District', value: p.district_nom },
              { label: 'Catégorie', value: p.categorie || 'Non catégorisée' },
              { label: 'Adresse', value: p.adresse || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                <span style={{ color: '#6B7280', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontWeight: 500, color: '#111827', textAlign: 'right' }}>{f.value}</span>
              </div>
            ))}
          </div>
          {hasGps && (
            <div className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>GPS</div>
              <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#2E9744' }}>
                {p.latitude!.toFixed(6)}°N · {p.longitude!.toFixed(6)}°E
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Form Panel ────────────────────────────────────────────────────────── */
type FormState = {
  nom: string; adresse: string; categorie: string; en_prospection: boolean;
  regionId: number; districtId: number;
  lat: string; lng: string; altitude: string;
  communiants: string; non_communiants: string;
  nombre_fideles: string; telephone: string; email: string;
};

function emptyForm(): FormState {
  return {
    nom: '', adresse: '', categorie: '', en_prospection: false,
    regionId: 0, districtId: 0,
    lat: '', lng: '', altitude: '',
    communiants: '', non_communiants: '',
    nombre_fideles: '', telephone: '', email: '',
  };
}

function formFromParoisse(p: Paroisse): FormState {
  return {
    nom: p.nom, adresse: p.adresse, categorie: p.categorie || '', en_prospection: p.en_prospection,
    regionId: p.region_id, districtId: p.district_id,
    lat: p.latitude !== null ? String(p.latitude) : '',
    lng: p.longitude !== null ? String(p.longitude) : '',
    altitude: '',
    communiants: '', non_communiants: '',
    nombre_fideles: p.nombre_fideles !== null ? String(p.nombre_fideles) : '',
    telephone: p.telephone, email: p.email,
  };
}

const FORM_TABS = [
  { label: 'Général',     icon: 'cross'     as const },
  { label: 'GPS & Carte', icon: 'map'       as const },
  { label: 'Fidèles',     icon: 'users'     as const },
  { label: 'Contact',     icon: 'bell'      as const },
  { label: 'Ouvriers',    icon: 'user'      as const },
  { label: 'Œuvres',      icon: 'hexagon'   as const },
];

function ParoisseFormPanel({ mode, paroisse, onClose, onSaved }: {
  mode: 'create' | 'edit'; paroisse?: Paroisse;
  onClose: () => void; onSaved: (p: Paroisse) => void;
}) {
  const [tab, setTab]   = useState(0);
  const [form, setForm] = useState<FormState>(paroisse ? formFromParoisse(paroisse) : emptyForm());
  const [regions, setRegions]     = useState<Region[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  // Ouvriers & Oeuvres selection
  const [selOuvriers, setSelOuvriers] = useState<Ouvrier[]>([]);
  const [selOeuvres,  setSelOeuvres]  = useState<Oeuvre[]>([]);
  const [initOuvriers, setInitOuvriers] = useState<Ouvrier[]>([]);
  const [initOeuvres,  setInitOeuvres]  = useState<Oeuvre[]>([]);

  // Annual stat
  const [statId, setStatId] = useState<number | null>(null);
  const annee = new Date().getFullYear();

  useEffect(() => {
    api.get<any>('/api/geo/regions/liste/').then(setRegions).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.regionId) { setDistricts([]); return; }
    api.get<PagedResult<District>>(`/api/geo/districts/?region=${form.regionId}`)
      .then(r => setDistricts(r.results)).catch(() => {});
  }, [form.regionId]);

  // Load existing data in edit mode
  useEffect(() => {
    if (!paroisse) return;
    const pid = paroisse.id;

    // Load annual stats
    api.get<PagedResult<StatAnn>>(`/api/statistiques/?paroisse=${pid}&annee=${annee}`)
      .then(r => {
        if (r.results.length > 0) {
          const s = r.results[0];
          setStatId(s.id);
          setForm(f => ({ ...f, communiants: String(s.communiants || ''), non_communiants: String(s.non_communiants || '') }));
        }
      }).catch(() => {});

    // Load ouvriers
    api.get<PagedResult<Ouvrier>>(`/api/ouvriers/ouvriers/?paroisse=${pid}&page_size=100`)
      .then(r => { setSelOuvriers(r.results); setInitOuvriers(r.results); })
      .catch(() => {});

    // Load oeuvres
    api.get<PagedResult<Oeuvre>>(`/api/oeuvres/oeuvres/?paroisse=${pid}&page_size=100`)
      .then(r => { setSelOeuvres(r.results); setInitOeuvres(r.results); })
      .catch(() => {});
  }, [paroisse, annee]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nom.trim()) { setError('Le nom de la paroisse est requis.'); return; }
    if (!form.districtId) { setError('Veuillez sélectionner un district.'); return; }
    setSaving(true); setError('');

    try {
      // ── 1. Save paroisse ──────────────────────────────────────────────
      let saved: Paroisse;
      if (mode === 'create') {
        const payload: Record<string, unknown> = {
          nom: form.nom.trim(), adresse: form.adresse.trim(),
          categorie: form.categorie || null, en_prospection: form.en_prospection,
          district: form.districtId,
          nombre_fideles: form.nombre_fideles ? parseInt(form.nombre_fideles) : null,
          telephone: form.telephone.trim(), email: form.email.trim(),
        };
        const latF = parseFloat(form.lat), lngF = parseFloat(form.lng);
        if (form.lat && form.lng && !isNaN(latF) && !isNaN(lngF)) {
          payload.latitude = latF; payload.longitude = lngF;
        }
        saved = await api.post<Paroisse>('/api/geo/paroisses/', payload);
      } else {
        // EXIGENCE : en modification, SEUL le nom (et l'état de prospection)
        // peut changer — le backend refuse tout autre champ.
        saved = await api.patch<Paroisse>(`/api/geo/paroisses/${paroisse!.id}/`, {
          nom: form.nom.trim(), en_prospection: form.en_prospection,
        });
      }

      const pid = saved.id;

      // ── 2. Save statistics (communiants / non-communiants) ────────────
      const comm  = form.communiants    ? parseInt(form.communiants)    : 0;
      const ncomm = form.non_communiants ? parseInt(form.non_communiants) : 0;
      if (form.communiants || form.non_communiants) {
        if (statId) {
          await api.patch(`/api/statistiques/${statId}/`, { communiants: comm, non_communiants: ncomm }).catch(() => {});
        } else {
          await api.post(`/api/statistiques/`, { paroisse: pid, annee, communiants: comm, non_communiants: ncomm }).catch(() => {});
        }
      }

      // ── 3. Update ouvriers (diff from initial) ────────────────────────
      const csrf = await getCsrf().catch(() => '');
      if (csrf) {
        const toAdd    = selOuvriers.filter(o => !initOuvriers.some(i => i.id === o.id));
        const toRemove = initOuvriers.filter(o => !selOuvriers.some(s => s.id === o.id));
        await Promise.allSettled([
          ...toAdd.map(o => api.patch(`/api/ouvriers/ouvriers/${o.id}/`, { paroisse: pid })),
          ...toRemove.map(o => api.patch(`/api/ouvriers/ouvriers/${o.id}/`, { paroisse: null })),
        ]);

        // ── 4. Update oeuvres ─────────────────────────────────────────────
        const oeuvAdd    = selOeuvres.filter(o => !initOeuvres.some(i => i.id === o.id));
        const oeuvRemove = initOeuvres.filter(o => !selOeuvres.some(s => s.id === o.id));
        await Promise.allSettled([
          ...oeuvAdd.map(o => api.patch(`/api/oeuvres/oeuvres/${o.id}/`, { paroisse: pid })),
          ...oeuvRemove.map(o => api.patch(`/api/oeuvres/oeuvres/${o.id}/`, { paroisse: null })),
        ]);
      }

      onSaved(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Tab completion indicators
  const tabDone = [
    !!(form.nom && form.districtId),
    !!(form.lat && form.lng),
    !!(form.communiants || form.non_communiants || form.nombre_fideles),
    !!(form.telephone || form.email),
    selOuvriers.length > 0,
    selOeuvres.length > 0,
  ];

  const latNum = parseFloat(form.lat);
  const lngNum = parseFloat(form.lng);
  const gpsValid = !isNaN(latNum) && !isNaN(lngNum) && form.lat && form.lng;

  // Style constants for labels (readable in both dark and light admin theme)
  const L = { label: { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' as const } };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 840 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)', flexShrink: 0 }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 19, margin: 0 }}>
              {mode === 'create' ? '+ Nouvelle paroisse EEC' : `Modifier — ${paroisse?.nom}`}
            </h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Étape {tab + 1} / {FORM_TABS.length} · {FORM_TABS[tab].label}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12 }} onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-primary" style={{ padding: '7px 18px', fontSize: 12, minWidth: 120 }} onClick={handleSave} disabled={saving}>
              {saving ? <span className="ls-spinner" /> : <><I.check size={14} />{mode === 'create' ? 'Créer la paroisse' : 'Enregistrer'}</>}
            </button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16} /></button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '10px 24px', fontSize: 12.5, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <I.alert size={14} /> {error}
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB', flexShrink: 0, overflowX: 'auto' }}>
          {FORM_TABS.map((t, i) => {
            const Ic = I[t.icon];
            const isActive = tab === i;
            const isDone   = tabDone[i];
            return (
              <button key={i} onClick={() => setTab(i)} style={{
                padding: '12px 16px', fontSize: 12.5, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1B5E20' : isDone ? '#2E9744' : '#374151',
                background: isActive ? '#fff' : 'transparent',
                borderBottom: isActive ? '2px solid #2E9744' : '2px solid transparent',
                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'inherit', transition: 'all 0.15s',
                marginBottom: -2,
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: isActive ? '#2E9744' : isDone ? '#D1FAE5' : '#E5E7EB',
                  color: isActive ? '#fff' : isDone ? '#065F46' : '#6B7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                }}>
                  {isDone && !isActive ? <I.check size={10} /> : i + 1}
                </div>
                <Ic size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content area */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* ─ Tab 1: Général ─────────────────────────────────────────── */}
          {tab === 0 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L.label}>Nom de la paroisse *</label>
                  <input className="input" placeholder="Ex. Yaoundé-Centre" value={form.nom}
                    onChange={e => set('nom', e.target.value)}
                    style={{ fontSize: 15, fontWeight: 600, color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Catégorie</label>
                  <select className="input" style={{ fontSize: 13, color: '#111827' }} value={form.categorie} onChange={e => set('categorie', e.target.value)}>
                    <option value="">— Non catégorisée</option>
                    {['A++', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3', 'C4'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L.label}>En prospection</label>
                  <select className="input" style={{ fontSize: 13, color: '#111827' }} value={form.en_prospection ? 'oui' : 'non'} onChange={e => set('en_prospection', e.target.value === 'oui')}>
                    <option value="non">Non</option>
                    <option value="oui">Oui — en prospection</option>
                  </select>
                </div>
                {/* EXIGENCE : en modification, la région, le district (et la position)
                    ne sont PAS modifiables — seuls le nom et la prospection le sont. */}
                <div>
                  <label style={L.label}>Région synodiale *{mode === 'edit' ? ' (verrouillée)' : ''}</label>
                  <select className="input" style={{ fontSize: 13, color: '#111827' }} value={form.regionId || ''} disabled={mode === 'edit'} onChange={e => { set('regionId', parseInt(e.target.value) || 0); set('districtId', 0); }}>
                    <option value="">— Choisir une région</option>
                    {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={L.label}>District *{mode === 'edit' ? ' (verrouillé)' : ''}</label>
                  <select className="input" style={{ fontSize: 13, color: '#111827' }} value={form.districtId || ''} onChange={e => set('districtId', parseInt(e.target.value) || 0)} disabled={mode === 'edit' || !form.regionId}>
                    <option value="">— Choisir un district</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={L.label}>Quartier / Adresse</label>
                  <input className="input" placeholder="Ex. Quartier Messa, Yaoundé" value={form.adresse} onChange={e => set('adresse', e.target.value)} disabled={mode === 'edit'} style={{ color: '#111827' }} />
                </div>
              </div>

              {/* Checklist */}
              {(form.nom || form.districtId) && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 16px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Nom', ok: !!form.nom },
                    { label: 'Région', ok: !!form.regionId },
                    { label: 'District', ok: !!form.districtId },
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: c.ok ? '#166534' : '#6B7280' }}>
                      {c.ok ? <I.check size={12} /> : <I.x size={12} />} {c.label}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─ Tab 2: GPS & Carte ──────────────────────────────────────── */}
          {tab === 1 && (
            <>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'center' }}>
                <I.pin size={14} />
                Cliquez sur la carte pour placer le marqueur, ou saisissez les coordonnées manuellement.
              </div>

              {/* Interactive map */}
              <GpsMapPicker
                lat={gpsValid ? latNum : null}
                lng={gpsValid ? lngNum : null}
                onChange={(la, lo) => { set('lat', String(la)); set('lng', String(lo)); }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={L.label}>Coord. Y — Latitude</label>
                  <input className="input mono" placeholder="Ex. 3.8480" value={form.lat}
                    onChange={e => set('lat', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Coord. X — Longitude</label>
                  <input className="input mono" placeholder="Ex. 11.5021" value={form.lng}
                    onChange={e => set('lng', e.target.value)} style={{ color: '#111827' }} />
                </div>
                <div>
                  <label style={L.label}>Altitude (m)</label>
                  <input className="input mono" placeholder="Ex. 750" value={form.altitude}
                    onChange={e => set('altitude', e.target.value)} style={{ color: '#111827' }} />
                </div>
              </div>

              {gpsValid && (
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#166534', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <I.check size={14} />
                  Position validée : {latNum.toFixed(5)}°N, {lngNum.toFixed(5)}°E
                  {form.altitude && ` · Alt. ${form.altitude} m`}
                </div>
              )}

              <div style={{ fontSize: 11, color: '#6B7280', display: 'flex', gap: 6 }}>
                <I.alert size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                Frontières valides : Latitude 2–13°N · Longitude 8–16°E (Cameroun WGS84)
              </div>
            </>
          )}

          {/* ─ Tab 3: Fidèles ──────────────────────────────────────────── */}
          {tab === 2 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <label style={L.label}>Communiants</label>
                  <input className="input mono" type="number" min={0} placeholder="0" value={form.communiants}
                    onChange={e => set('communiants', e.target.value)} style={{ color: '#111827' }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Membres baptisés</div>
                </div>
                <div>
                  <label style={L.label}>Non-Communiants</label>
                  <input className="input mono" type="number" min={0} placeholder="0" value={form.non_communiants}
                    onChange={e => set('non_communiants', e.target.value)} style={{ color: '#111827' }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Membres non baptisés</div>
                </div>
                <div>
                  <label style={L.label}>Total fidèles (résumé)</label>
                  <input className="input mono" type="number" min={0} placeholder="0" value={form.nombre_fideles}
                    onChange={e => set('nombre_fideles', e.target.value)} style={{ color: '#111827' }} />
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Vue générale</div>
                </div>
              </div>

              {(form.communiants || form.non_communiants) && (
                <div className="card" style={{ padding: '16px 20px', background: 'rgba(46,151,68,0.06)' }}>
                  <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Statistiques {annee} — Récapitulatif
                  </div>
                  <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Communiants', val: parseInt(form.communiants) || 0, color: '#2E9744' },
                      { label: 'Non-communiants', val: parseInt(form.non_communiants) || 0, color: '#1565C0' },
                      { label: 'Total', val: (parseInt(form.communiants) || 0) + (parseInt(form.non_communiants) || 0), color: '#111827' },
                    ].map(s => (
                      <div key={s.label}>
                        <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.val.toLocaleString('fr')}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 10 }}>
                    Ces données seront enregistrées comme statistiques annuelles {annee}.
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─ Tab 4: Contact ──────────────────────────────────────────── */}
          {tab === 3 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={L.label}>Téléphone</label>
                <input className="input" placeholder="+237 6XX XXX XXX" value={form.telephone}
                  onChange={e => set('telephone', e.target.value)} style={{ color: '#111827' }} />
              </div>
              <div>
                <label style={L.label}>Adresse e-mail</label>
                <input className="input" type="email" placeholder="paroisse@eec.cm" value={form.email}
                  onChange={e => set('email', e.target.value)} style={{ color: '#111827' }} />
              </div>
              <div style={{ gridColumn: '1/-1', marginTop: 8 }}>
                <label style={L.label}>Photos de la paroisse</label>
                <div style={{
                  height: 180, borderRadius: 8, border: '2px dashed #D1D5DB',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, background: '#F9FAFB', cursor: 'not-allowed',
                }}>
                  <I.upload size={28} style={{ color: '#9CA3AF' }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Ajout de photos — prochainement</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>JPG, PNG · 5 Mo max par photo</div>
                </div>
              </div>
            </div>
          )}

          {/* ─ Tab 5: Ouvriers ─────────────────────────────────────────── */}
          {tab === 4 && (
            <>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Associez des ouvriers EEC à cette paroisse. {selOuvriers.length > 0 && (
                  <span style={{ color: '#2E9744', fontWeight: 700 }}>{selOuvriers.length} sélectionné{selOuvriers.length > 1 ? 's' : ''}</span>
                )}
              </div>
              <OuvrierSelector selected={selOuvriers} onChange={setSelOuvriers} />
            </>
          )}

          {/* ─ Tab 6: Œuvres ───────────────────────────────────────────── */}
          {tab === 5 && (
            <>
              <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Associez des œuvres EEC à cette paroisse. {selOeuvres.length > 0 && (
                  <span style={{ color: '#5B9BD5', fontWeight: 700 }}>{selOeuvres.length} sélectionnée{selOeuvres.length > 1 ? 's' : ''}</span>
                )}
              </div>
              <OeuvreSelector selected={selOeuvres} onChange={setSelOeuvres} />
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #E5E7EB', marginTop: 'auto' }}>
            <button className="btn btn-ghost" onClick={() => setTab(t => Math.max(0, t - 1))} disabled={tab === 0}
              style={{ opacity: tab === 0 ? 0.3 : 1, color: '#374151' }}>
              <I.chevL size={14} /> Précédent
            </button>
            <span style={{ fontSize: 11, color: '#9CA3AF', alignSelf: 'center' }}>
              {tab + 1} / {FORM_TABS.length}
            </span>
            {tab < FORM_TABS.length - 1 ? (
              <button className="btn btn-outline" onClick={() => setTab(t => t + 1)} style={{ color: '#374151', borderColor: '#D1D5DB' }}>
                Suivant <I.chevR size={14} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="ls-spinner" /> : <><I.check size={14} />{mode === 'create' ? 'Créer la paroisse' : 'Enregistrer'}</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────── */
const PAGE_SIZE = 50;

export default function ParoissesPage() {
  const { toasts, add: addToast, remove } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [filterRegionId, setFilterRegionId]     = useState(0);
  const [filterDistrictId, setFilterDistrictId] = useState(0);
  const [categorieFilter, setCategorieFilter] = useState('');
  const [gpsMode, setGpsMode]           = useState('');
  const [page, setPage]     = useState(1);
  const [refresh, setRefresh] = useState(0);

  const [paroisses, setParoisses] = useState<Paroisse[]>([]);
  const [count, setCount]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [regions, setRegions]     = useState<Region[]>([]);
  const [filterDistricts, setFilterDistricts] = useState<District[]>([]);

  const [selection, setSelection]     = useState<Set<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<Paroisse | null>(null);
  const [deleting, setDeleting]       = useState(false);
  const [viewPanel, setViewPanel]     = useState<Paroisse | null>(null);
  const [formPanel, setFormPanel]     = useState<{ mode: 'create' | 'edit'; paroisse?: Paroisse } | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { api.get<Region[]>('/api/geo/regions/liste/').then(setRegions).catch(() => {}); }, []);

  useEffect(() => {
    setFilterDistrictId(0);
    if (!filterRegionId) { setFilterDistricts([]); return; }
    api.get<PagedResult<District>>(`/api/geo/districts/?region=${filterRegionId}`)
      .then(r => setFilterDistricts(r.results)).catch(() => {});
  }, [filterRegionId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const p = new URLSearchParams();
    p.set('page', String(page));
    if (search) p.set('search', search);
    if (filterRegionId) p.set('region', String(filterRegionId));
    if (filterDistrictId) p.set('district', String(filterDistrictId));
    if (categorieFilter) p.set('categorie', categorieFilter);
    if (gpsMode === 'avec') p.set('avec_gps', '1');
    if (gpsMode === 'sans') p.set('sans_gps', '1');

    api.get<PagedResult<Paroisse>>(`/api/geo/paroisses/?${p}`)
      .then(data => { if (!cancelled) { setParoisses(data.results); setCount(data.count); } })
      .catch(() => { if (!cancelled) addToast({ type: 'error', title: 'Erreur de chargement des paroisses.' }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, search, filterRegionId, filterDistrictId, categorieFilter, gpsMode, refresh, addToast]);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const doRefresh  = useCallback(() => { setPage(1); setRefresh(r => r + 1); }, []);

  const hasFilter = !!(search || filterRegionId || filterDistrictId || categorieFilter || gpsMode);
  const resetFilters = () => {
    setSearchInput(''); setSearch('');
    setFilterRegionId(0); setFilterDistrictId(0);
    setCategorieFilter(''); setGpsMode(''); setPage(1);
  };

  const toggle    = (id: number) => { const s = new Set(selection); s.has(id) ? s.delete(id) : s.add(id); setSelection(s); };
  const toggleAll = () => { if (selection.size === paroisses.length) setSelection(new Set()); else setSelection(new Set(paroisses.map(p => p.id))); };

  // EXIGENCES : suppression et activation/désactivation d'une paroisse
  // n'existent plus (handlers retirés ; le backend renvoie 405 de toute façon).

  const handleSaved = (saved: Paroisse) => {
    const wasCreate = formPanel?.mode === 'create';
    setFormPanel(null);
    addToast({ type: 'success', title: wasCreate ? '✓ Paroisse créée avec succès !' : '✓ Modifications enregistrées.', body: saved.nom });
    doRefresh();
  };

  // Check URL params to open specific paroisse
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    const viewId = params.get('view');
    if ((editId || viewId) && paroisses.length > 0) {
      const id = parseInt(editId || viewId || '0');
      const p  = paroisses.find(x => x.id === id);
      if (p) {
        if (editId) setFormPanel({ mode: 'edit', paroisse: p });
        else setViewPanel(p);
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [paroisses]);

  const pageBtns = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  const categorieLabel = categorieFilter || 'Toutes catégories';
  const gpsLabel    = gpsMode === 'avec' ? 'GPS: avec' : gpsMode === 'sans' ? 'GPS: sans' : 'GPS: tous';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16, color: 'var(--text)' }}>
            {loading ? '—' : count.toLocaleString('fr')} paroisse{count !== 1 ? 's' : ''}
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>EEC Cameroun</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => {
            // EXIGENCE : exporter la liste AFFICHÉE avec les filtres appliqués
            const q = new URLSearchParams();
            if (search)           q.set('search', search);
            if (filterRegionId)   q.set('region', String(filterRegionId));
            if (filterDistrictId) q.set('district', String(filterDistrictId));
            if (categorieFilter)  q.set('categorie', categorieFilter);
            if (gpsMode === 'avec') q.set('avec_gps', '1');
            if (gpsMode === 'sans') q.set('sans_gps', '1');
            window.open(`${BACKEND}/api/exports/paroisses/excel/?${q}`, '_blank');
          }}>
            <I.download size={14} />Exporter Excel
          </button>
          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}>
            <I.plus size={14} />Créer une paroisse
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <div className="label">Rechercher</div>
          <I.search size={14} style={{ position: 'absolute', top: 33, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Nom de paroisse..." style={{ paddingLeft: 34, fontSize: 13 }}
            value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="label">Région</div>
          <select className="input" style={{ fontSize: 13 }} value={filterRegionId || ''} onChange={e => { setFilterRegionId(parseInt(e.target.value) || 0); setPage(1); }}>
            <option value="">Toutes régions</option>
            {regions.map(r => <option key={r.id} value={r.id}>{r.nom}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 175 }}>
          <div className="label">District</div>
          <select className="input" style={{ fontSize: 13 }} value={filterDistrictId || ''} onChange={e => { setFilterDistrictId(parseInt(e.target.value) || 0); setPage(1); }} disabled={!filterRegionId}>
            <option value="">Tous districts</option>
            {filterDistricts.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
          </select>
        </div>
        <div style={{ width: 150 }}>
          <Dropdown label="Catégorie" value={categorieLabel}
            options={['Toutes catégories', 'A++', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'C3', 'C4']}
            onChange={v => { setCategorieFilter(v === 'Toutes catégories' ? '' : v); setPage(1); }} />
        </div>
        <div style={{ width: 130 }}>
          <Dropdown label="GPS" value={gpsLabel} options={['GPS: tous', 'GPS: avec', 'GPS: sans']} onChange={v => { setGpsMode(v === 'GPS: tous' ? '' : v === 'GPS: avec' ? 'avec' : 'sans'); setPage(1); }} />
        </div>
        {hasFilter && <button className="btn btn-ghost" onClick={resetFilters} style={{ marginBottom: 1 }}><I.refresh size={13} />Réinitialiser</button>}
      </div>

      {hasFilter && !loading && (
        <div style={{ background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.25)', borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#1D4ED8', display: 'flex', gap: 8 }}>
          <I.filter size={13} />
          <b>{count.toLocaleString('fr')}</b> paroisse{count !== 1 ? 's' : ''} trouvée{count !== 1 ? 's' : ''}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: 13 }}>Chargement…</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}><input type="checkbox" className="checkbox" checked={paroisses.length > 0 && selection.size === paroisses.length} onChange={toggleAll} /></th>
                    <th style={{ width: 40 }}>#</th>
                    <th>Nom</th>
                    <th>Région</th>
                    <th>District</th>
                    <th>Catégorie</th>
                    <th style={{ textAlign: 'right' }}>Fidèles</th>
                    <th style={{ textAlign: 'right' }}>Communiants</th>
                    <th style={{ textAlign: 'right' }}>Non-comm.</th>
                    <th style={{ textAlign: 'center' }}>Ouvriers</th>
                    <th>GPS</th>
                    <th>Modifié</th>
                    <th style={{ width: 90 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paroisses.length === 0 && (
                    <tr><td colSpan={12} style={{ height: 280, textAlign: 'center', padding: 40 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <I.cross size={40} style={{ opacity: 0.2 }} />
                        <div className="sg-md" style={{ fontSize: 16 }}>Aucune paroisse trouvée</div>
                        <div style={{ color: 'var(--text-2)', fontSize: 13 }}>Modifiez vos filtres ou créez une nouvelle paroisse.</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                          {hasFilter && <button className="btn btn-outline" onClick={resetFilters}>Réinitialiser les filtres</button>}
                          <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14} />Créer une paroisse</button>
                        </div>
                      </div>
                    </td></tr>
                  )}
                  {paroisses.map((p, idx) => {
                    const complete = computeComplete(p);
                    const modifie  = new Date(p.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
                    return (
                      <tr key={p.id} style={{ background: selection.has(p.id) ? 'rgba(46,151,68,0.06)' : 'transparent' }}>
                        <td><input type="checkbox" className="checkbox" checked={selection.has(p.id)} onChange={() => toggle(p.id)} /></td>
                        <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String((page - 1) * PAGE_SIZE + idx + 1).padStart(3, '0')}</td>
                        <td><span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{p.nom}</span></td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.region_nom}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.district_nom}</td>
                        <td><CategoriePill categorie={p.categorie} /></td>
                        <td className="mono" style={{ textAlign: 'right' }}>
                          {p.nombre_fideles !== null ? p.nombre_fideles.toLocaleString('fr') : <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', color: '#5B9BD5' }}>
                          {p.communiants !== null ? p.communiants.toLocaleString('fr') : '—'}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', color: '#9B72CF' }}>
                          {p.non_communiants !== null ? p.non_communiants.toLocaleString('fr') : '—'}
                        </td>
                        <td className="mono" style={{ textAlign: 'center', fontWeight: 600 }}>{p.nb_ouvriers ?? 0}</td>
                        <td><GpsCell ok={p.latitude !== null} /></td>
                        <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{modifie}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <button className="icon-btn" title="Voir les détails" onClick={() => setViewPanel(p)}><I.eye size={15} /></button>
                            <button className="icon-btn green" title="Modifier (nom uniquement)" onClick={() => setFormPanel({ mode: 'edit', paroisse: p })}><I.pencil size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {count > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
                <span>Page <b style={{ color: 'var(--text)' }}>{page}</b> / <b style={{ color: 'var(--text)' }}>{totalPages}</b> · {count.toLocaleString('fr')} résultats</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="icon-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><I.chevL size={14} /></button>
                  {pageBtns.map(pn => (
                    <button key={pn} onClick={() => setPage(pn)} style={{ width: 28, height: 28, border: 0, borderRadius: 5, background: pn === page ? 'var(--green)' : 'transparent', color: pn === page ? '#fff' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{pn}</button>
                  ))}
                  <button className="icon-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}><I.chevR size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating action bar */}
      {selection.size > 0 && (
        <div className="float-bar">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{selection.size} sélectionnée{selection.size > 1 ? 's' : ''}</span>
          <span style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.10)' }} />
          <button className="btn btn-ghost" onClick={() => setSelection(new Set())}>Annuler</button>
        </div>
      )}

      {/* Panels & Modals */}
      {viewPanel && <ParoisseViewPanel paroisse={viewPanel} onClose={() => setViewPanel(null)} onEdit={() => { setFormPanel({ mode: 'edit', paroisse: viewPanel }); setViewPanel(null); }} />}
      {formPanel && <ParoisseFormPanel mode={formPanel.mode} paroisse={formPanel.paroisse} onClose={() => setFormPanel(null)} onSaved={handleSaved} />}

      <ToastStack toasts={toasts} remove={remove} />
    </div>
  );
}
