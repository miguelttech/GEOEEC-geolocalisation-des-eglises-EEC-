'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { I } from '@/components/admin/icons';
import { Avatar, Widget, HorizontalBars, Donut, StackedBars, LineChart, CategoriePill, GpsCell } from '@/components/admin/atoms';
import { api, type DashboardStats, type Paroisse } from '@/lib/api';

/* ── Types ────────────────────────────────────────────────────────────────── */
interface FullStats extends DashboardStats {
  validations_attente: number;
  fideles_par_annee: { year: number; comm: number; noncomm: number; total: number }[];
  // Années réellement présentes en base, plus récente d'abord.
  annees_disponibles: number[];
  top_regions: { name: string; fideles: number; paroisses: number }[];
  oeuvres_par_type: { type: string; count: number; color: string }[];
  top_paroisses_fideles: { name: string; fideles: number }[];
  oeuvres_par_region: ({ name: string; total: number } & Record<string, unknown>)[];
  categories_par_region: { name: string; cat_a: number; cat_b: number; cat_c: number }[];
  activite_recente: { who: string; role: string; action: string; entity: string; description: string; when: string; initials: string }[];
}

/* ── StatCard ─────────────────────────────────────────────────────────────── */
function StatCard({ label, icon: Ic, value, sub, delta }: {
  label: string; icon: (p: { size?: number }) => React.ReactElement;
  value: string | number; sub: string; delta: { type: 'up' | 'down' | 'flat'; text: string };
}) {
  return (
    <div className="stat-card">
      <div className="sc-head"><span>{label}</span><span style={{ color: 'rgba(245,197,24,0.55)' }}><Ic size={16} /></span></div>
      <div className="sc-num">{typeof value === 'number' ? value.toLocaleString('fr') : value}</div>
      <div className="sc-label">{sub}</div>
      <div className="sc-delta" style={{ color: delta.type === 'up' ? '#5AC472' : delta.type === 'down' ? '#FF6B6B' : 'var(--text-3)' }}>
        {delta.type === 'up' && <I.up size={12} />}
        {delta.type === 'flat' && <span style={{ display: 'inline-block', width: 12, height: 1, background: 'currentColor' }} />}
        {delta.text}
      </div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function Skeleton({ h = 24, w = '100%' }: { h?: number; w?: string | number }) {
  return <div style={{ height: h, width: w, background: 'rgba(255,255,255,0.07)', borderRadius: 6, animation: 'pulse 1.4s ease infinite' }} />;
}

/* ── ParoissesTable ───────────────────────────────────────────────────────── */
function ParoissesTable({ onEdit, onView, onCreate }: { onEdit: (p: Paroisse) => void; onView: (p: Paroisse) => void; onCreate: () => void }) {
  const [data, setData]     = React.useState<Paroisse[]>([]);
  const [total, setTotal]   = React.useState(0);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    api.get<{ count: number; results: Paroisse[] }>(`/api/geo/paroisses/?page_size=10&search=${encodeURIComponent(search)}`)
      .then(r => { setData(r.results); setTotal(r.count); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
        <h3 className="sg-md" style={{ margin: 0, fontSize: 14, color: 'var(--text)', marginRight: 'auto' }}>Paroisses récentes</h3>
        <div style={{ position: 'relative', width: 240 }}>
          <I.search size={14} style={{ position: 'absolute', top: 11, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Rechercher..." style={{ paddingLeft: 34, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={onCreate}><I.plus size={14} />Créer une paroisse</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data">
          <thead>
            <tr>
              <th className="sortable">Nom</th>
              <th>Région</th>
              <th>District</th>
              <th style={{ textAlign: 'right' }}>Fidèles</th>
              <th>Niveau</th>
              <th>GPS</th>
              <th style={{ width: 90 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><Skeleton h={32} /></td></tr>
              ))
            ) : data.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.nom}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.region_nom}</td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{p.district_nom}</td>
                <td className="mono" style={{ textAlign: 'right', fontSize: 13 }}>
                  {p.nombre_fideles != null ? p.nombre_fideles.toLocaleString('fr') : '—'}
                </td>
                <td><CategoriePill categorie={p.categorie} /></td>
                <td><GpsCell ok={p.latitude != null} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="icon-btn" title="Voir les détails" onClick={() => onView(p)}><I.eye size={15} /></button>
                    <button className="icon-btn green" title="Modifier" onClick={() => onEdit(p)}><I.pencil size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: 12, color: 'var(--text-2)' }}>
        <span>Affichage <span style={{ color: 'var(--text)' }}>1 à {data.length}</span> sur <span style={{ color: 'var(--text)' }}>{total.toLocaleString('fr')}</span></span>
      </div>
    </div>
  );
}

/* ── Dashboard page ───────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const nav    = (key: string) => router.push(`/admin/${key}`);

  const [stats, setStats]     = React.useState<FullStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError]     = React.useState('');
  // `null` au premier chargement : on laisse le serveur choisir l'année la
  // plus récente réellement présente en base. Une valeur en dur (2025) faisait
  // manquer les statistiques saisies depuis l'interface, qui portent l'année
  // courante — modifier un effectif ne changeait alors rien à l'écran.
  const [annee, setAnnee]     = React.useState<number | null>(null);

  React.useEffect(() => {
    setLoading(true);
    api.get<FullStats>('/api/auth/dashboard-stats/' + (annee !== null ? `?annee=${annee}` : ''))
      .then(d => { setStats(d); if (annee === null) setAnnee(d.annee); })
      .catch(e => setError(e.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [annee]);

  if (error) return (
    <div style={{ padding: 32, color: '#FF6B6B' }}>
      <I.alert size={18} /> {error}
      <button className="btn btn-outline" style={{ marginLeft: 12 }} onClick={() => setError('')}>Réessayer</button>
    </div>
  );

  const s = stats;
  // Année à AFFICHER : celle du serveur tant que l'utilisateur n'a rien choisi.
  const anneeAffichee = annee ?? s?.annee ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Row 1 — 5 stat cards */}
      <div className="g g-5" style={{ gap: 16 }}>
        {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="stat-card"><Skeleton h={80} /></div>) : (<>
          <StatCard label="Régions"   icon={I.compass}   value={s?.nb_regions ?? 0}   sub="Régions synodales"     delta={{ type: 'flat', text: 'Données stables' }} />
          <StatCard label="Districts" icon={I.network}   value={s?.nb_districts ?? 0} sub="Districts"              delta={{ type: 'flat', text: 'Données stables' }} />
          <StatCard label="Paroisses" icon={I.church}    value={s?.nb_paroisses ?? 0} sub="Paroisses enregistrées" delta={{ type: 'flat', text: `${s?.nb_paroisses_sans_gps ?? 0} sans GPS` }} />
          <StatCard label="Œuvres"    icon={I.hexagon}   value={s?.nb_oeuvres ?? 0}   sub="Œuvres déclarées"      delta={{ type: 'flat', text: 'Toutes catégories' }} />
          <StatCard label="Ouvriers"  icon={I.briefcase} value={s?.nb_ouvriers ?? 0}  sub="Ouvriers enregistrés"  delta={{ type: 'flat', text: 'Tous statuts' }} />
        </>)}
      </div>

      {/* Row 2 — 4 widgets */}
      <div className="g g-4" style={{ gap: 16 }}>
        {/* Aucune action d'édition ici : le total vient exclusivement des
            statistiques annuelles en base. Un « Modifier » local existait, qui
            affichait un nombre stocké dans le navigateur sans rapport avec la
            donnée réelle — deux visiteurs voyaient deux totaux différents. */}
        <Widget title={`Total fidèles ${anneeAffichee}`}>
          {loading ? <Skeleton h={80} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="sg" style={{ fontSize: 28, lineHeight: 1 }}>
                {(s?.total_fideles ?? 0).toLocaleString('fr')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: '#2E9744', borderRadius: 2 }} />
                  Communiants
                  <span style={{ marginLeft: 'auto', color: 'var(--text)' }}>{(s?.total_communiants ?? 0).toLocaleString('fr')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, background: 'rgba(240,244,241,0.45)', borderRadius: 2 }} />
                  Non-communiants
                  <span style={{ marginLeft: 'auto', color: 'var(--text)' }}>{(s?.total_non_communiants ?? 0).toLocaleString('fr')}</span>
                </div>
              </div>
            </div>
          )}
        </Widget>

        <Widget title="Paroisses sans GPS" action={<button className="btn-ghost btn" style={{ padding: '4px 6px', fontSize: 11 }} onClick={() => nav('paroisses')}>Voir →</button>}>
          {loading ? <Skeleton h={60} /> : (
            <>
              <div className="sg" style={{ fontSize: 28, color: '#FF6B6B', lineHeight: 1 }}>{s?.nb_paroisses_sans_gps ?? 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                {s && s.nb_paroisses > 0 ? `${Math.round((s.nb_paroisses_sans_gps / s.nb_paroisses) * 100)}% du total sans coordonnées` : 'Aucune paroisse'}
              </div>
            </>
          )}
        </Widget>

        <Widget title="Validations en attente">
          {loading ? <Skeleton h={60} /> : (
            <>
              <div className="sg" style={{ fontSize: 28, color: s?.validations_attente ? '#FF8A3D' : '#5AC472', lineHeight: 1 }}>
                {s?.validations_attente ?? 0}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Statistiques soumises à valider</div>
            </>
          )}
        </Widget>

        <Widget title="Scope de données">
          {loading ? <Skeleton h={60} /> : (
            <>
              <div className="sg" style={{ fontSize: 18, lineHeight: 1.3, color: '#5AC472' }}>{s?.scope ?? '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Rôle : {s?.role ?? '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Données {anneeAffichee}</div>
            </>
          )}
        </Widget>
      </div>

      {/* Row 3 — graphiques */}
      <div className="g g-2" style={{ gap: 16 }}>

        <Widget title="Top régions par fidèles" action={
          <select className="input" style={{ padding: '2px 8px', fontSize: 12, height: 28 }}
            value={annee ?? ''} onChange={e => setAnnee(Number(e.target.value))}>
            {/* Années issues de la base, pas d'une liste figée : proposer
                des années sans aucune donnée n'aidait personne. */}
            {(stats?.annees_disponibles ?? []).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }>
          {loading ? <Skeleton h={180} /> :
            s?.top_regions?.length ? <HorizontalBars data={s.top_regions.map(r => ({ label: r.name, value: r.fideles }))} /> :
            <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune statistique pour {anneeAffichee}</div>}
        </Widget>

        <Widget title="Répartition des œuvres">
          {loading ? <Skeleton h={180} /> : s?.oeuvres_par_type?.length ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '8px 0' }}>
              <Donut segments={s.oeuvres_par_type.map(o => ({ count: o.count, color: o.color }))} total={s.nb_oeuvres} label="œuvres" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {s.oeuvres_par_type.map((o, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <span style={{ width: 10, height: 10, background: o.color, borderRadius: 2 }} />
                    <span style={{ color: 'var(--text-2)' }}>{o.type}</span>
                    <span className="mono" style={{ marginLeft: 'auto', color: 'var(--text)' }}>{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune œuvre enregistrée</div>}
        </Widget>

        <Widget title="Catégories de paroisses par région">
          {loading ? <Skeleton h={180} /> : s?.categories_par_region?.length ? (
            <>
              {/* StackedBars accepte un Record<string, ...> générique (accès dynamique
                  par clé) — un type nommé avec des propriétés fixes n'a pas de
                  signature d'index compatible, d'où ce transtypage explicite. */}
              <StackedBars data={s.categories_par_region as unknown as Record<string, string | number>[]} keys={[
                { key: 'cat_a', color: '#E8B600' },
                { key: 'cat_b', color: '#1565C0' },
                { key: 'cat_c', color: '#2E9744' },
              ]} />
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginTop: 6, justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#E8B600', borderRadius: 2 }} />Catégorie A</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#1565C0', borderRadius: 2 }} />Catégorie B</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, background: '#2E9744', borderRadius: 2 }} />Catégorie C</span>
              </div>
            </>
          ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Importez des données pour voir les catégories</div>}
        </Widget>

        <Widget title={`Évolution des fidèles ${(s?.fideles_par_annee?.[0]?.year ?? '')} → ${anneeAffichee}`}>
          {loading ? <Skeleton h={180} /> : s?.fideles_par_annee?.length ? (
            <>
              <LineChart data={s.fideles_par_annee.map(d => ({ year: d.year, comm: d.comm, noncomm: d.noncomm }))} height={210} />
              <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-2)', marginTop: -4, justifyContent: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 2, background: '#2E9744' }} />Communiants</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 14, height: 2, background: 'rgba(240,244,241,0.45)' }} />Non-communiants</span>
              </div>
            </>
          ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune statistique historique</div>}
        </Widget>
      </div>

      {/* Row 4 — Top 10 paroisses (EXIGENCE : le widget « Aperçu géographique »
          / mini-carte a été retiré — la carte interactive est désormais
          l'élément principal, accessible en plein écran depuis la sidebar.
          Cette statistique occupe maintenant tout l'espace disponible). */}
      <Widget title="Top 10 — paroisses par nombre de fidèles">
        {loading ? <Skeleton h={280} /> : s?.top_paroisses_fideles?.length ? (
          <HorizontalBars data={s.top_paroisses_fideles.map(p => ({ label: p.name, value: p.fideles }))} />
        ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Aucune donnée de fidèles</div>}
      </Widget>

      {/* Row 4bis — Œuvres par région (EXIGENCE : par région ET par type,
          couleurs pertinentes + légende) + Activité */}
      <div className="g g-3-2" style={{ gap: 16 }}>
        <Widget title="Répartition des œuvres par région">
          {loading ? <Skeleton h={280} /> : s?.oeuvres_par_region?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(() => {
                const TYPES: { key: string; label: string; color: string }[] = [
                  { key: 'SCOLAIRE',      label: 'Scolaire',      color: '#1565C0' },
                  { key: 'UNIVERSITAIRE', label: 'Universitaire', color: '#6A1B9A' },
                  { key: 'MEDICALE',      label: 'Médical',       color: '#C62828' },
                  { key: 'AGROPASTORALE', label: 'Agropastoral',  color: '#E65100' },
                  { key: 'IMMEUBLE',      label: 'Immeuble',      color: '#455A64' },
                  { key: 'TERRAIN',       label: 'Terrain',       color: '#2E9744' },
                  { key: 'AUTRE',         label: 'Autre',         color: '#5B9BD5' },
                ];
                const max = Math.max(...s.oeuvres_par_region.map(r => r.total));
                return (
                  <>
                    {s.oeuvres_par_region.map(r => (
                      <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 150, fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
                        <div style={{ flex: 1, display: 'flex', height: 16, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                          {TYPES.map(t => {
                            const v = (r as Record<string, unknown>)[t.key] as number | undefined;
                            if (!v) return null;
                            return <span key={t.key} title={`${t.label} : ${v}`}
                              style={{ width: `${(v / max) * 100}%`, background: t.color }} />;
                          })}
                        </div>
                        <span className="mono" style={{ width: 34, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{r.total}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, fontSize: 11, color: 'var(--text-2)' }}>
                      {TYPES.map(t => (
                        <span key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 10, height: 10, background: t.color, borderRadius: 2 }} />{t.label}
                        </span>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          ) : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Réservé à l&apos;administrateur général</div>}
        </Widget>

        <Widget title="Activité récente" action={<span style={{ color: '#5AC472', textDecoration: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} onClick={() => nav('journal')}>Voir tout →</span>}>
          {loading ? <Skeleton h={280} /> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {s?.activite_recente?.length ? s.activite_recente.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < (s.activite_recente.length - 1) ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                  <Avatar initials={a.initials} size={30} bg="rgba(46,151,68,0.2)" color="#5AC472" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{a.who}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 11 }}>{a.when}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>{a.role}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      <span style={{ color: 'var(--text)' }}>{a.action}</span> {a.entity}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-3)', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>
                  Aucune activité enregistrée
                </div>
              )}
            </div>
          )}
        </Widget>
      </div>

      {/* Row 5 — Table paroisses */}
      <ParoissesTable
        onCreate={() => nav('paroisses')}
        onView={(p) => nav(`paroisses?view=${p.id}`)}
        onEdit={(p) => nav(`paroisses?edit=${p.id}`)}
      />
    </div>
  );
}
