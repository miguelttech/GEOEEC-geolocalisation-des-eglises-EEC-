'use client';
import React from 'react';
import { api, LogEntry, PagedResult, UserAccount } from '@/lib/api';
import { I } from '@/components/admin/icons';

const ACTION_META: Record<string, { label: string; color: string; icon: keyof typeof I }> = {
  LOGIN:  { label: 'Connexion',    color: '#60A5FA', icon: 'user'     },
  LOGOUT: { label: 'Déconnexion',  color: '#94A3B8', icon: 'user'     },
  CREATE: { label: 'Création',     color: '#34D399', icon: 'plus'     },
  UPDATE: { label: 'Modification', color: '#FBBF24', icon: 'pencil'   },
  DELETE: { label: 'Suppression',  color: '#F87171', icon: 'trash'    },
  IMPORT: { label: 'Import',       color: '#A78BFA', icon: 'upload'   },
  EXPORT: { label: 'Export',       color: '#22D3EE', icon: 'download' },
  VIEW:   { label: 'Consultation', color: '#94A3B8', icon: 'eye'      },
};

const TYPE_LABELS: Record<string, string> = {
  paroisse:    'Paroisse',
  district:    'District',
  region:      'Région',
  oeuvre:      'Œuvre',
  ouvrier:     'Ouvrier',
  user:        'Utilisateur',
  statistique: 'Statistique',
  import:      'Import',
  systeme:     'Système',
};

function fmtDatetime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    time: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const PAGE_SIZE = 50;

export default function JournalPage() {
  const [entries, setEntries]     = React.useState<LogEntry[]>([]);
  const [count, setCount]         = React.useState(0);
  const [page, setPage]           = React.useState(1);
  const [loading, setLoading]     = React.useState(true);
  const [expanded, setExpanded]   = React.useState<number>(-1);
  const [action, setAction]       = React.useState('');
  const [typeObjet, setTypeObjet] = React.useState('');
  const [dateDebut, setDateDebut] = React.useState('');
  const [dateFin, setDateFin]     = React.useState('');
  const [utilisateur, setUtilisateur] = React.useState('');
  const [users, setUsers]         = React.useState<UserAccount[]>([]);

  React.useEffect(() => {
    api.get<UserAccount[]>('/api/auth/users/').then(setUsers).catch(() => {});
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setExpanded(-1);
    const params = new URLSearchParams({ page: String(page) });
    if (action)      params.set('action', action);
    if (typeObjet)   params.set('type_objet', typeObjet);
    if (dateDebut)   params.set('date_debut', dateDebut);
    if (dateFin)     params.set('date_fin', dateFin);
    if (utilisateur) params.set('utilisateur', utilisateur);
    api.get<PagedResult<LogEntry>>(`/api/audit/journal/?${params}`)
      .then(d => { setEntries(d.results); setCount(d.count); })
      .catch(() => { setEntries([]); setCount(0); })
      .finally(() => setLoading(false));
  }, [page, action, typeObjet, dateDebut, dateFin, utilisateur]);

  const totalPages  = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const hasFilter   = !!(action || typeObjet || dateDebut || dateFin || utilisateur);
  const reset = () => { setAction(''); setTypeObjet(''); setDateDebut(''); setDateFin(''); setUtilisateur(''); setPage(1); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div className="label">Action</div>
          <select className="input" value={action} style={{ width: 170 }}
            onChange={e => { setAction(e.target.value); setPage(1); }}>
            <option value="">Toutes actions</option>
            {Object.entries(ACTION_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">Entité</div>
          <select className="input" value={typeObjet} style={{ width: 160 }}
            onChange={e => { setTypeObjet(e.target.value); setPage(1); }}>
            <option value="">Toutes entités</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">Utilisateur</div>
          <select className="input" value={utilisateur} style={{ width: 190 }}
            onChange={e => { setUtilisateur(e.target.value); setPage(1); }}>
            <option value="">Tous les utilisateurs</option>
            {users.map(u => (
              <option key={u.id} value={String(u.id)}>
                {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">Du</div>
          <input type="date" className="input mono" value={dateDebut} style={{ width: 150 }}
            onChange={e => { setDateDebut(e.target.value); setPage(1); }} />
        </div>
        <div>
          <div className="label">Au</div>
          <input type="date" className="input mono" value={dateFin} style={{ width: 150 }}
            onChange={e => { setDateFin(e.target.value); setPage(1); }} />
        </div>
        {hasFilter && (
          <button className="btn btn-ghost" onClick={reset}><I.refresh size={13}/>Réinitialiser</button>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {count.toLocaleString('fr')} entrée{count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {hasFilter && (
        <div className="anim-fade" style={{
          background: 'rgba(21,101,192,0.08)', border: '1px solid rgba(21,101,192,0.30)',
          borderRadius: 6, padding: '8px 14px', fontSize: 12, color: '#7FB2E8',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <I.filter size={13}/>
          <span>Filtres actifs · <b style={{ color: '#A4CFF0' }}>{count}</b> résultat{count !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 10, fontSize: 13 }}>
            <I.refresh size={16} style={{ opacity: 0.5 }}/>Chargement…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table className="data">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Date / Heure</th>
                <th>Utilisateur</th>
                <th style={{ width: 150 }}>Action</th>
                <th style={{ width: 120 }}>Entité</th>
                <th>Objet</th>
                <th style={{ width: 130 }}>IP</th>
                <th style={{ width: 36 }}></th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ height: 260, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <I.list size={40} style={{ opacity: 0.18 }}/>
                      <div className="sg-md" style={{ fontSize: 15 }}>Aucune entrée trouvée</div>
                      {hasFilter && (
                        <button className="btn btn-outline" onClick={reset}>Réinitialiser les filtres</button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : entries.map(e => {
                const meta  = ACTION_META[e.action] || { label: e.action_display || e.action, color: '#94A3B8', icon: 'list' as keyof typeof I };
                const Ic    = I[meta.icon];
                const { date, time } = fmtDatetime(e.created_at);
                const isExp = expanded === e.id;
                return (
                  <React.Fragment key={e.id}>
                    <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(isExp ? -1 : e.id)}>
                      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text)', fontSize: 12 }}>{date}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{time}</div>
                      </td>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{e.utilisateur_nom}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, color: meta.color, fontSize: 12 }}>
                          {Ic && <Ic size={13}/>}
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        {e.type_objet ? (
                          <span className="pill" style={{
                            background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)',
                            border: '1px solid var(--border)', fontSize: 11,
                          }}>
                            {TYPE_LABELS[e.type_objet] || e.type_objet}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-3)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.objet_nom || (e.objet_id ? `#${e.objet_id}` : <span style={{ color: 'var(--text-3)' }}>—</span>)}
                      </td>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>
                        {e.ip_address || '—'}
                      </td>
                      <td>
                        <I.chevD size={13} style={{
                          transform: isExp ? 'rotate(180deg)' : 'none',
                          transition: 'transform 200ms',
                          opacity: 0.35,
                        }}/>
                      </td>
                    </tr>
                    {isExp && (
                      <tr className="anim-fade">
                        <td colSpan={7} style={{
                          background: 'rgba(255,255,255,0.02)',
                          padding: '14px 24px',
                          borderBottom: '1px solid var(--border)',
                        }}>
                          <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
                            {e.description
                              ? e.description
                              : <em style={{ opacity: 0.45 }}>Aucun détail disponible.</em>
                            }
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            Page {page} / {totalPages} · {count.toLocaleString('fr')} entrée{count !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" disabled={page <= 1}
              onClick={() => setPage(1)} style={{ padding: '6px 10px', fontSize: 12 }}>«</button>
            <button className="btn btn-outline" disabled={page <= 1}
              onClick={() => setPage(p => p - 1)} style={{ padding: '6px 10px', fontSize: 12 }}>‹</button>
            <span className="mono" style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.06)',
              borderRadius: 6, fontSize: 12, minWidth: 36, textAlign: 'center',
            }}>{page}</span>
            <button className="btn btn-outline" disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)} style={{ padding: '6px 10px', fontSize: 12 }}>›</button>
            <button className="btn btn-outline" disabled={page >= totalPages}
              onClick={() => setPage(totalPages)} style={{ padding: '6px 10px', fontSize: 12 }}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
