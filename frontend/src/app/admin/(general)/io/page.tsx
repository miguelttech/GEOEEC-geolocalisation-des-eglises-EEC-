'use client';
import React from 'react';
import { api, LogEntry, PagedResult } from '@/lib/api';
import { I } from '@/components/admin/icons';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

/* ─── Toast ────────────────────────────────────────────────────────────── */
interface Toast { id: number; type: 'success' | 'warn' | 'info' | 'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setToasts(p => [...p, { ...t, id }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 5500);
  };
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

/* ─── Download helper ──────────────────────────────────────────────────── */
function triggerDownload(url: string, filename?: string) {
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function IOPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState<'export' | 'historique'>('export');

  const [history, setHistory]   = React.useState<LogEntry[]>([]);
  const [histLoad, setHistLoad] = React.useState(false);

  React.useEffect(() => {
    if (tab !== 'historique') return;
    setHistLoad(true);
    api.get<PagedResult<LogEntry>>('/api/audit/journal/?action=EXPORT&page_size=100')
      .then(r => {
        setHistory([...r.results]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      })
      .catch(() => {})
      .finally(() => setHistLoad(false));
  }, [tab]);

  const EXPORTS = [
    { key: 'paroisses-excel', label: 'Paroisses',          desc: 'Toutes les paroisses avec GPS',    icon: 'cross'   as keyof typeof I, url: `${BACKEND}/api/exports/paroisses/excel/`    },
    { key: 'ouvriers-excel',  label: 'Ouvriers',           desc: 'Tous les ouvriers, tous grades',   icon: 'user'    as keyof typeof I, url: `${BACKEND}/api/exports/ouvriers/excel/`     },
    { key: 'oeuvres-excel',   label: 'Œuvres',             desc: 'Toutes les œuvres sociales EEC',   icon: 'hexagon' as keyof typeof I, url: `${BACKEND}/api/exports/oeuvres/excel/`      },
    { key: 'stats-excel',     label: 'Statistiques .xlsx', desc: 'Rapport annuel agrégé',            icon: 'list'    as keyof typeof I, url: `${BACKEND}/api/exports/statistiques/excel/` },
    { key: 'stats-pdf',       label: 'Statistiques .pdf',  desc: 'Rapport PDF imprimable A4',        icon: 'list'    as keyof typeof I, url: `${BACKEND}/api/exports/statistiques/pdf/`   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Onglets principaux */}
      <div className="tabs-bar" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { k: 'export',     l: 'Export de données', ic: 'download' as keyof typeof I },
          { k: 'historique', l: 'Historique',        ic: 'list'     as keyof typeof I },
        ].map(t => {
          const Ic = I[t.ic];
          return (
            <button key={t.k} className={`tab${tab === t.k ? ' active' : ''}`}
              onClick={() => setTab(t.k as typeof tab)}>
              <Ic size={13} /> {t.l}
            </button>
          );
        })}
      </div>

      {/* ── EXPORT ─────────────────────────────────────────────────────── */}
      {tab === 'export' && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <h3 className="sg" style={{ fontSize: 16, margin: '0 0 6px' }}>Exports de données</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0 }}>
              Téléchargez les données de votre périmètre en un clic. Les fichiers sont générés à la demande avec les données actuelles de la base.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {EXPORTS.map(ex => {
              const Ic = I[ex.icon];
              return (
                <div key={ex.key} className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(90,196,114,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5AC472' }}>
                      <Ic size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{ex.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ex.desc}</div>
                    </div>
                  </div>
                  <button className="btn btn-outline" style={{ justifyContent: 'center', fontSize: 12 }}
                    onClick={() => {
                      triggerDownload(ex.url);
                      addToast({ type: 'info', title: `Export ${ex.label} lancé`, body: 'Le fichier se télécharge depuis le serveur…' });
                    }}>
                    <I.download size={13} /> Télécharger
                  </button>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <I.alert size={13} />
            Les exports sont filtrés selon votre périmètre administratif (région, district ou paroisse selon votre rôle).
          </div>
        </div>
      )}

      {/* ── HISTORIQUE ─────────────────────────────────────────────────── */}
      {tab === 'historique' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {histLoad ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10, fontSize: 13 }}>
              <I.refresh size={16} style={{ opacity: 0.5 }} /> Chargement…
            </div>
          ) : history.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
              <I.list size={36} style={{ opacity: 0.18 }} />
              <div className="sg-md" style={{ fontSize: 14 }}>Aucun export enregistré</div>
            </div>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Date / Heure</th>
                  <th>Type</th>
                  <th>Utilisateur</th>
                  <th>Entité</th>
                  <th>Détail</th>
                </tr>
              </thead>
              <tbody>
                {history.map(e => {
                  const d    = new Date(e.created_at);
                  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={e.id}>
                      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{date}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{time}</div>
                      </td>
                      <td>
                        <span className="pill pill-green" style={{ fontSize: 11 }}>Export</span>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{e.utilisateur_nom}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{e.type_objet || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.description || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
