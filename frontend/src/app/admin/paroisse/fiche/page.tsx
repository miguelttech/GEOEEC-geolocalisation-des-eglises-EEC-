'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { CompleteBar } from '@/components/admin/atoms';
import { api, type Paroisse, type PagedResult } from '@/lib/api';

const C = '#E67A2E';

interface Toast { id:number; type:'success'|'info'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function Section({ title, children }: { title:string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border)', paddingBottom:10 }}>{title}</div>
      {children}
    </div>
  );
}

function LockedField({ label, value }: { label:string; value:string }) {
  return (
    <div>
      <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>{label}</div>
      <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={11}/> {value}
      </div>
    </div>
  );
}

// Mini-carte centrée sur les coordonnées réelles de la paroisse (à la
// différence de l'ancienne carte nationale générique, sans rapport avec la
// paroisse affichée). Import de Leaflet différé au montage client, comme
// dans MiniLeafletMap — pas besoin de next/dynamic pour ça.
function ParoisseMiniMap({ lat, lng, height = 220 }: { lat: number; lng: number; height?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const initRef = React.useRef(false);

  React.useEffect(() => {
    if (!ref.current || initRef.current) return;
    initRef.current = true;

    import('leaflet').then(({ default: L }) => {
      if (!ref.current) return;
      const map = L.map(ref.current, {
        zoomControl: false, attributionControl: true,
        dragging: false, scrollWheelZoom: false,
        doubleClickZoom: false, touchZoom: false, boxZoom: false,
      }).setView([lat, lng], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap · © CartoDB',
        maxZoom: 19, subdomains: 'abcd',
      }).addTo(map);

      L.circleMarker([lat, lng], {
        radius: 9, color: C, fillColor: C, fillOpacity: 0.85, weight: 2,
      }).addTo(map);
    });
  }, [lat, lng]);

  return <div ref={ref} style={{ height, width: '100%' }} />;
}

export default function FicheParoissePage() {
  const { toasts, add: addToast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [paroisse, setParoisse] = React.useState<Paroisse | null>(null);

  const [editMode, setEditMode] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [nomDraft, setNomDraft] = React.useState('');
  const [enProspectionDraft, setEnProspectionDraft] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    api.get<PagedResult<Paroisse>>('/api/geo/paroisses/')
      .then(r => {
        const p = r.results[0] ?? null;
        setParoisse(p);
        setNotFound(!p);
        if (p) { setNomDraft(p.nom); setEnProspectionDraft(p.en_prospection); }
      })
      .catch(() => addToast({ type: 'warn', title: 'Impossible de charger la fiche', body: 'Vérifiez votre connexion et réessayez.' }))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!paroisse) return;
    setSaving(true);
    try {
      const updated = await api.patch<Paroisse>(`/api/geo/paroisses/${paroisse.id}/`, {
        nom: nomDraft,
        en_prospection: enProspectionDraft,
      });
      setParoisse(updated);
      setEditMode(false);
      addToast({ type: 'success', title: 'Fiche mise à jour' });
    } catch (e) {
      addToast({ type: 'warn', title: 'Échec de l\'enregistrement', body: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card" style={{ padding: 24, fontSize: 13, color: 'var(--text-3)' }}>Chargement de la fiche…</div>;
  }
  if (notFound || !paroisse) {
    return <div className="card" style={{ padding: 24, fontSize: 13, color: 'var(--text-3)' }}>Aucune paroisse n'est associée à votre compte.</div>;
  }

  const champsCompletion = [
    { label: 'Nom officiel',        renseigne: !!paroisse.nom },
    { label: 'Catégorie',           renseigne: !!paroisse.categorie },
    { label: 'Adresse physique',    renseigne: !!paroisse.adresse },
    { label: 'Téléphone',           renseigne: !!paroisse.telephone },
    { label: 'E-mail',              renseigne: !!paroisse.email },
    { label: 'Coordonnées GPS',     renseigne: paroisse.latitude != null && paroisse.longitude != null },
    { label: 'Effectif de fidèles', renseigne: paroisse.nombre_fideles != null },
  ];
  const renseignes = champsCompletion.filter(c => c.renseigne).length;
  const pct = Math.round(renseignes / champsCompletion.length * 100);
  const hasGps = paroisse.latitude != null && paroisse.longitude != null;
  const totalFideles = (paroisse.communiants ?? 0) + (paroisse.non_communiants ?? 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* En-tête */}
      <div className="card" style={{ padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <h1 className="sg" style={{ fontSize:22, margin:0 }}>{paroisse.nom}</h1>
            <span style={{ padding:'3px 10px', borderRadius:4, fontSize:12, fontWeight:700, background:`rgba(230,122,46,0.15)`, color:C }}>PAROISSE</span>
            {paroisse.en_prospection && (
              <span style={{ padding:'3px 10px', borderRadius:4, fontSize:12, fontWeight:700, background:'rgba(255,193,7,0.12)', color:'#FFC107' }}>En prospection</span>
            )}
          </div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:4 }}>
            {paroisse.district_nom} · {paroisse.region_nom} · Mis à jour le {new Date(paroisse.updated_at).toLocaleDateString('fr')}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ fontSize:12, color:'var(--text-3)' }}>Complétion</div>
          <div style={{ width:100 }}><CompleteBar pct={pct}/></div>
          <div style={{ fontSize:13, fontWeight:700, color:C }}>{pct}%</div>
          {!editMode
            ? <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}`, marginLeft:8 }} onClick={() => setEditMode(true)}><I.pencil size={14}/>Modifier la fiche</button>
            : <>
                <button className="btn btn-ghost" disabled={saving} onClick={() => { setEditMode(false); setNomDraft(paroisse.nom); setEnProspectionDraft(paroisse.en_prospection); }}>Annuler</button>
                <button className="btn" disabled={saving} style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={handleSave}>
                  <I.check size={14}/>{saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </>
          }
        </div>
      </div>

      {editMode && (
        <div style={{ background:'rgba(255,193,7,0.07)', border:'1px solid rgba(255,193,7,0.25)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(255,193,7,0.90)', display:'flex', alignItems:'center', gap:8 }}>
          <I.shield size={13}/>
          Seuls le nom et l'état « en prospection » sont modifiables par un administrateur de paroisse. Les autres informations (adresse, contact, GPS, catégorie) sont gérées par l'administrateur de district.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* Colonne gauche */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <Section title="Identité">
            <LockedField label="RÉGION" value={paroisse.region_nom}/>
            <LockedField label="DISTRICT" value={paroisse.district_nom}/>
            <LockedField label="CATÉGORIE" value={(paroisse.categorie ?? 'Non renseignée') + ' — modifiable par l\'administrateur de district'}/>
            <div>
              <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>NOM DE LA PAROISSE</div>
              {editMode
                ? <input className="input" value={nomDraft} onChange={e=>setNomDraft(e.target.value)} style={{ width:'100%' }}/>
                : <div style={{ fontSize:13, padding:'9px 0' }}>{paroisse.nom}</div>}
            </div>
            {editMode && (
              <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, cursor:'pointer' }}>
                <input type="checkbox" checked={enProspectionDraft} onChange={e=>setEnProspectionDraft(e.target.checked)} />
                Paroisse en prospection (en cours d'implantation)
              </label>
            )}
            <LockedField label="ADRESSE PHYSIQUE" value={paroisse.adresse || 'Non renseignée'}/>
            <LockedField label="TÉLÉPHONE" value={paroisse.telephone || 'Non renseigné'}/>
            <LockedField label="E-MAIL" value={paroisse.email || 'Non renseigné'}/>
          </Section>

          <Section title="Statistiques 2025">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <div style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>COMMUNIANTS</div>
                <div className="sg-md" style={{ fontSize:22, color:'#5AC472', paddingTop:4 }}>{(paroisse.communiants ?? '—').toLocaleString?.('fr') ?? paroisse.communiants ?? '—'}</div>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text-3)', fontWeight:600, letterSpacing:'0.06em', marginBottom:4 }}>NON-COMMUNIANTS</div>
                <div className="sg-md" style={{ fontSize:22, color:'var(--text)', paddingTop:4 }}>{(paroisse.non_communiants ?? '—').toLocaleString?.('fr') ?? paroisse.non_communiants ?? '—'}</div>
              </div>
            </div>
            {(paroisse.communiants != null || paroisse.non_communiants != null) && (
              <div style={{ fontSize:12, color:'var(--text-3)' }}>Total : {totalFideles.toLocaleString('fr')} fidèles</div>
            )}
            <div style={{ fontSize:11, color:'var(--text-3)' }}>Statistiques modifiables uniquement par import (Import / Export).</div>
          </Section>

        </div>

        {/* Colonne droite */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <Section title="Géolocalisation GPS">
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 0' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background: hasGps ? '#5AC472' : '#FF8A7A' }}/>
              <span style={{ fontSize:13, color: hasGps ? '#5AC472' : '#FF8A7A', fontWeight:600 }}>
                {hasGps ? '✓ Coordonnées GPS renseignées' : '✗ Aucune coordonnée GPS'}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <LockedField label="LATITUDE" value={hasGps ? String(paroisse.latitude) : '—'}/>
              <LockedField label="LONGITUDE" value={hasGps ? String(paroisse.longitude) : '—'}/>
            </div>
            {hasGps ? (
              <div style={{ height:220, borderRadius:8, overflow:'hidden' }}>
                <ParoisseMiniMap lat={paroisse.latitude as number} lng={paroisse.longitude as number} height={220}/>
              </div>
            ) : (
              <div style={{ height:120, borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px dashed var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'var(--text-3)' }}>
                Aucune coordonnée GPS enregistrée pour cette paroisse.
              </div>
            )}
            <div style={{ fontSize:11, color:'var(--text-3)' }}>La géolocalisation est gérée par l'administrateur de district.</div>
          </Section>

          <Section title="Complétion de la fiche">
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
              <div style={{ flex:1 }}><CompleteBar pct={pct}/></div>
              <div style={{ fontSize:18, fontWeight:700, color:C }}>{pct}%</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {champsCompletion.map((c,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                  <span style={{ color: c.renseigne ? '#5AC472' : '#FF8A7A', flexShrink:0 }}>{c.renseigne ? '✓' : '✗'}</span>
                  <span style={{ color: c.renseigne ? 'var(--text-2)' : 'var(--text-3)' }}>{c.label}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>
      </div>

      <ToastStack toasts={toasts}/>
    </div>
  );
}
