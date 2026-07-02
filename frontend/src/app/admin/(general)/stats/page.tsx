'use client';
import React from 'react';
import { api } from '@/lib/api';
import { I } from '@/components/admin/icons';

/* ─── Types (réponses réelles des endpoints B12/B13) ────────────────── */
interface NameValue { name: string; value: number; }

interface StatsGlobales {
  scope: string;
  role: string;
  nb_regions: number;
  nb_districts: number;
  nb_paroisses: number;
  nb_oeuvres: number;
  nb_ouvriers: number;
  nb_admins: number | null;
  paroisses_par_region: NameValue[];
  paroisses_par_district: NameValue[];
}

interface StatsVisiteurs {
  scope: string;
  role: string;
  top_regions: NameValue[];
  top_districts: NameValue[];
  top_paroisses: NameValue[];
  top_oeuvres: NameValue[];
  top_favoris: NameValue[];
  top_itineraires: NameValue[];
  connexions_total: number | null;
  recherches_total: number | null;
  visiteurs_actifs_jour: number;
  visiteurs_quotidiens: number;
  visiteurs_mensuels: number;
}

/* ─── Petits composants de présentation ──────────────────────────────── */
function StatCard({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div className="sg" style={{ fontSize: 24, color: color || 'var(--text)' }}>{value}</div>
    </div>
  );
}

const BAR_COLORS = ['#2E9744','#3B82F6','#F59E0B','#8B5CF6','#EF4444','#06B6D4','#F97316','#5AC472','#94A3B8','#EC4899'];

function BarList({ title, items, emptyLabel }: { title: string; items: NameValue[]; emptyLabel: string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
      {items.length === 0 ? (
        <div style={{ fontSize: 12.5, color: 'var(--text-3)', padding: '10px 0' }}>{emptyLabel}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {items.map((it, i) => (
            <div key={it.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-2)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                <span className="mono" style={{ fontWeight: 700, color: 'var(--text)' }}>{it.value.toLocaleString('fr')}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((it.value / max) * 100)}%`, height: '100%', background: BAR_COLORS[i % BAR_COLORS.length], borderRadius: 3 }}/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────── */
interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id = Date.now(); setToasts(p => [...p, { ...t, id }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}><div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div></div>
      ))}
    </div>
  );
}

/* ─── Onglet 1 — Statistiques Globales ───────────────────────────────── */
function GlobalesTab({ data, loading }: { data: StatsGlobales | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10, fontSize: 13 }}>
        <I.refresh size={16} style={{ opacity: 0.5 }}/>Chargement des statistiques…
      </div>
    );
  }
  const isSuper = data.role === 'SUPER';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {isSuper && <StatCard label="Régions synodales" value={data.nb_regions} color="#3B82F6"/>}
        <StatCard label="Districts" value={data.nb_districts} color="#F59E0B"/>
        <StatCard label="Paroisses" value={data.nb_paroisses} color="#2E9744"/>
        <StatCard label="Œuvres" value={data.nb_oeuvres} color="#8B5CF6"/>
        <StatCard label="Ouvriers" value={data.nb_ouvriers} color="#EF4444"/>
        {data.nb_admins !== null && <StatCard label="Comptes administrateurs" value={data.nb_admins} color="#06B6D4"/>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isSuper ? '1fr 1fr' : '1fr', gap: 14 }}>
        {isSuper && (
          <BarList title="Paroisses par région synodale" items={data.paroisses_par_region} emptyLabel="Aucune donnée disponible."/>
        )}
        <BarList title="Paroisses par district" items={data.paroisses_par_district} emptyLabel="Aucune donnée disponible."/>
      </div>
    </div>
  );
}

/* ─── Onglet 2 — Statistiques Visiteurs ──────────────────────────────── */
function VisiteursTab({ data, loading }: { data: StatsVisiteurs | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10, fontSize: 13 }}>
        <I.refresh size={16} style={{ opacity: 0.5 }}/>Chargement des statistiques…
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {data.connexions_total !== null && <StatCard label="Connexions totales" value={data.connexions_total} color="#2E9744"/>}
        <StatCard label="Visiteurs actifs aujourd'hui" value={data.visiteurs_actifs_jour} color="#3B82F6"/>
        <StatCard label="Visiteurs (jour)" value={data.visiteurs_quotidiens} color="#F59E0B"/>
        <StatCard label="Visiteurs (mois)" value={data.visiteurs_mensuels} color="#8B5CF6"/>
        {data.recherches_total !== null && <StatCard label="Recherches effectuées" value={data.recherches_total} color="#EF4444"/>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <BarList title="Régions les plus consultées" items={data.top_regions} emptyLabel="Aucune consultation enregistrée."/>
        <BarList title="Districts les plus consultés" items={data.top_districts} emptyLabel="Aucune consultation enregistrée."/>
        <BarList title="Paroisses les plus consultées" items={data.top_paroisses} emptyLabel="Aucune consultation enregistrée."/>
        <BarList title="Œuvres les plus consultées" items={data.top_oeuvres} emptyLabel="Aucune consultation enregistrée."/>
        <BarList title="Paroisses les plus favorisées" items={data.top_favoris} emptyLabel="Aucun favori enregistré."/>
        <BarList title="Itinéraires les plus utilisés" items={data.top_itineraires} emptyLabel="Aucun itinéraire enregistré."/>
      </div>
    </div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────── */
export default function StatsPage() {
  const { toasts } = useToast();
  const [tab, setTab] = React.useState<'globales'|'visiteurs'>('globales');
  const [globales, setGlobales]   = React.useState<StatsGlobales | null>(null);
  const [visiteurs, setVisiteurs] = React.useState<StatsVisiteurs | null>(null);
  const [loadingG, setLoadingG]   = React.useState(true);
  const [loadingV, setLoadingV]   = React.useState(true);

  React.useEffect(() => {
    api.get<StatsGlobales>('/api/stats/globales/').then(setGlobales).catch(() => {}).finally(() => setLoadingG(false));
    api.get<StatsVisiteurs>('/api/stats/visiteurs/').then(setVisiteurs).catch(() => {}).finally(() => setLoadingV(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="seg">
        <button className={tab === 'globales' ? 'on' : ''} onClick={() => setTab('globales')}>
          <I.compass size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Statistiques globales
        </button>
        <button className={tab === 'visiteurs' ? 'on' : ''} onClick={() => setTab('visiteurs')}>
          <I.users size={12} style={{ marginRight: 6, verticalAlign: -2 }}/>Statistiques visiteurs
        </button>
      </div>

      {tab === 'globales'
        ? <GlobalesTab data={globales} loading={loadingG}/>
        : <VisiteursTab data={visiteurs} loading={loadingV}/>}

      <ToastStack toasts={toasts}/>
    </div>
  );
}
