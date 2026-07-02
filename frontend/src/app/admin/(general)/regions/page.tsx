'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, RegionSynodale } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { CompleteBar, TopCount } from '@/components/admin/atoms';

// ─── View Panel ───────────────────────────────────────────────────────────────
function RegionViewPanel({ region: r, onClose }: { region: RegionSynodale; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,214,0,0.12)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.compass size={18} />
            </div>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{r.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Région Synodale EEC</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16} /></button>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Districts', value: String(r.nb_districts), color: 'var(--text)' },
              { label: 'Paroisses', value: String(r.nb_paroisses), color: '#5AC472' },
              { label: 'Fidèles',   value: (r.nb_fideles ?? 0).toLocaleString('fr'), color: '#FFD600' },
              { label: 'Ouvriers',  value: String(r.nb_ouvriers ?? 0), color: '#5B9BD5' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize: 24, marginTop: 4, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</div>
            {[
              { label: 'Nom officiel', value: r.nom },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,214,0,0.06)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 6, padding: '12px 14px', fontSize: 12, color: 'rgba(255,214,0,0.80)', display: 'flex', gap: 8 }}>
            <I.alert size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Les régions synodales sont définies par le Shapefile officiel EEC et ne peuvent pas être modifiées depuis cette interface.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RegionsPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<RegionSynodale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewPanel, setViewPanel] = useState<RegionSynodale | null>(null);

  useEffect(() => {
    api.get<RegionSynodale[]>('/api/geo/regions/liste/')
      .then(setRegions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const data = search
    ? regions.filter(r => r.nom.toLowerCase().includes(search.toLowerCase()))
    : regions;

  const totalDistricts = regions.reduce((s, r) => s + r.nb_districts, 0);
  const totalParoisses = regions.reduce((s, r) => s + r.nb_paroisses, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <TopCount label="Régions synodales" value={loading ? '…' : String(regions.length)} />
        <TopCount label="Districts" value={loading ? '…' : String(totalDistricts)} />
        <TopCount label="Paroisses" value={loading ? '…' : totalParoisses.toLocaleString('fr')} color="#5AC472" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>
            {loading ? '—' : regions.length} régions synodales
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>source : Shapefile officiel EEC</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => router.push('/admin/map')}><I.map size={14} />Voir sur la carte</button>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <I.search size={14} style={{ position: 'absolute', top: 12, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Rechercher une région..." style={{ paddingLeft: 34, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: 13 }}>Chargement des régions…</span>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Région synodale</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Districts</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Paroisses</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Fidèles</th>
                    <th className="sortable" style={{ textAlign: 'right' }}>Ouvriers</th>
                    <th style={{ width: 60 }}>Détail</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 && (
                    <tr><td colSpan={7} style={{ height: 200, textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <I.compass size={40} style={{ opacity: 0.25 }} />
                        <div className="sg-md" style={{ fontSize: 15 }}>Aucune région trouvée</div>
                        {search && <button className="btn btn-outline" onClick={() => setSearch('')}>Effacer la recherche</button>}
                      </div>
                    </td></tr>
                  )}
                  {data.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(idx + 1).padStart(2, '0')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(255,214,0,0.10)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <I.compass size={16} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.nom}</span>
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.nb_districts}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5AC472', fontWeight: 600 }}>{r.nb_paroisses}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#FFD600' }}>{(r.nb_fideles ?? 0).toLocaleString('fr')}</td>
                      <td className="mono" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#5B9BD5' }}>{r.nb_ouvriers ?? 0}</td>
                      <td>
                        <button className="icon-btn" title="Vue détaillée" onClick={() => setViewPanel(r)}><I.eye size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {!loading && data.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(46,151,68,0.06)', borderTop: '2px solid rgba(46,151,68,0.30)' }}>
                      <td colSpan={2} style={{ padding: 14, fontWeight: 700 }} className="sg-md">Totaux</td>
                      <td className="mono sg-md" style={{ textAlign: 'right', padding: 14 }}>
                        {data.reduce((s, r) => s + r.nb_districts, 0)}
                      </td>
                      <td className="mono sg-md" style={{ textAlign: 'right', padding: 14, color: '#5AC472' }}>
                        {data.reduce((s, r) => s + r.nb_paroisses, 0).toLocaleString('fr')}
                      </td>
                      <td className="mono sg-md" style={{ textAlign: 'right', padding: 14, color: '#FFD600' }}>
                        {data.reduce((s, r) => s + (r.nb_fideles ?? 0), 0).toLocaleString('fr')}
                      </td>
                      <td className="mono sg-md" style={{ textAlign: 'right', padding: 14, color: '#5B9BD5' }}>
                        {data.reduce((s, r) => s + (r.nb_ouvriers ?? 0), 0)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </>
        )}
      </div>

      {viewPanel && <RegionViewPanel region={viewPanel} onClose={() => setViewPanel(null)} />}
    </div>
  );
}
