'use client';
import React from 'react';
import { getCsrf, api, LogEntry, PagedResult } from '@/lib/api';
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

/* ─── Types ────────────────────────────────────────────────────────────── */
interface ImportResult {
  created: number;
  updated: number;
  errors_count: number;
  errors: Array<{ ligne: number; erreur: string }>;
  total_lignes: number;
  preview?: ParoissePreviewRow[];
}

interface ParoissePreviewRow {
  nom: string;
  niveau: string;
  region: string;
  district: string;
  adresse: string;
  gps: boolean;
  communiants: number;
  non_communiants: number;
  statut: string;
}

type ImportTab = 'paroisses' | 'ouvriers' | 'oeuvres';

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

/* ─── Progress bar ──────────────────────────────────────────────────────── */
function ProgressBar({ value }: { value: number }) {
  return (
    <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${value}%`, borderRadius: 4,
        background: 'linear-gradient(90deg, #2E9744, #5AC472)',
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

/* ─── Config import ─────────────────────────────────────────────────────── */
const IMPORT_CONFIG: Record<ImportTab, {
  label: string; templateUrl: string; importUrl: string; icon: keyof typeof I;
  columns: string[];
}> = {
  paroisses: {
    label: 'Paroisses',
    templateUrl: `${BACKEND}/api/exports/templates/paroisses/`,
    importUrl:   `${BACKEND}/api/imports/paroisses/`,
    icon: 'cross',
    columns: ['Niveau', 'Région Synodale *', 'District', 'Nom Paroisse *', 'Quartier/Adresse', 'Communiants', 'Non-Comm.', 'Ouvriers', 'Coord. X', 'Coord. Y', 'Altitude'],
  },
  ouvriers: {
    label: 'Ouvriers',
    templateUrl: `${BACKEND}/api/exports/templates/ouvriers/`,
    importUrl:   `${BACKEND}/api/imports/ouvriers/`,
    icon: 'user',
    columns: ['Nom *', 'Prénom *', 'Sexe *', 'Grade', 'Paroisse *', 'Statut', 'Téléphone'],
  },
  oeuvres: {
    label: 'Œuvres',
    templateUrl: `${BACKEND}/api/exports/templates/oeuvres/`,
    importUrl:   `${BACKEND}/api/imports/oeuvres/`,
    icon: 'hexagon',
    columns: ['Nom *', 'Type *', 'Paroisse', 'District', 'Région', 'Adresse', 'Latitude', 'Longitude', 'Capacité'],
  },
};

/* ─── Import panel ──────────────────────────────────────────────────────── */
function ImportPanel({ tab, onDone }: { tab: ImportTab; onDone: () => void }) {
  const [step, setStep]       = React.useState<1 | 2 | 3>(1);
  const [file, setFile]       = React.useState<File | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [loading, setLoad]    = React.useState(false);
  const [result, setResult]   = React.useState<ImportResult | null>(null);
  const [error, setError]     = React.useState('');
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef          = React.useRef<HTMLInputElement>(null);
  const cfg                   = IMPORT_CONFIG[tab];

  React.useEffect(() => { setStep(1); setFile(null); setResult(null); setError(''); setProgress(0); }, [tab]);

  function pickFile(f: File) {
    setFile(f);
    setError('');
    setStep(2);
  }

  async function runImport() {
    if (!file) return;
    setLoad(true);
    setError('');
    setProgress(0);

    try {
      const csrf = await getCsrf();
      const form = new FormData();
      form.append('file', file);

      // XHR pour les events de progression
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', cfg.importUrl);
        xhr.withCredentials = true;
        xhr.setRequestHeader('X-CSRFToken', csrf);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 80));
        };

        xhr.onload = () => {
          setProgress(100);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data: ImportResult = JSON.parse(xhr.responseText);
              setResult(data);
              setStep(3);
              onDone();
              resolve();
            } catch {
              reject(new Error('Réponse invalide du serveur.'));
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.detail || `Erreur ${xhr.status}`));
            } catch {
              reject(new Error(`Erreur ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Erreur réseau. Vérifiez votre connexion.'));
        xhr.send(form);
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
      setProgress(0);
    } finally {
      setLoad(false);
    }
  }

  const steps = [{ n: 1, l: 'Gabarit' }, { n: 2, l: 'Fichier' }, { n: 3, l: 'Résultat' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`step-dot ${step > s.n ? 'done' : step === s.n ? 'current' : 'future'}`}>
                {step > s.n ? <I.check size={12} /> : s.n}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: step >= s.n ? 'var(--text)' : 'var(--text-3)' }}>{s.l}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`step-line ${step > s.n ? 'done' : ''}`} style={{ flex: 1, minWidth: 40 }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1 — Gabarit ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h3 className="sg" style={{ fontSize: 15, margin: '0 0 6px' }}>
              Étape 1 — Télécharger le gabarit {cfg.label}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              Téléchargez le gabarit Excel officiel EEC, remplissez vos données ligne par ligne
              en respectant les colonnes, puis revenez pour importer votre fichier.
            </p>
          </div>

          {/* Colonnes du gabarit */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Colonnes du gabarit
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cfg.columns.map((col, idx) => {
                const required = col.includes('*');
                return (
                  <span key={idx} style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 4,
                    background: required ? 'rgba(46,151,68,0.12)' : 'rgba(255,255,255,0.06)',
                    color: required ? '#5AC472' : 'var(--text-2)',
                    border: `1px solid ${required ? 'rgba(46,151,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                    fontFamily: 'var(--font-mono, monospace)',
                  }}>
                    {String.fromCharCode(65 + idx)}. {col}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 8 }}>
              <span style={{ color: '#5AC472' }}>■</span> Champs obligatoires &nbsp;·&nbsp;
              <span style={{ color: 'var(--text-3)' }}>■</span> Champs optionnels (laisser vide si inconnu)
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => triggerDownload(cfg.templateUrl)}>
              <I.download size={14} /> Télécharger le gabarit .xlsx
            </button>
            <button className="btn btn-outline" onClick={() => setStep(2)}>
              J'ai déjà mon fichier →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2 — Upload ─────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 className="sg" style={{ fontSize: 15, margin: 0 }}>
            Étape 2 — Sélectionner le fichier à importer
          </h3>

          {/* Zone de drop */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) pickFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: dragOver ? 'rgba(46,151,68,0.08)' : 'rgba(255,255,255,0.03)',
              border: `2px dashed ${dragOver ? 'rgba(90,196,114,0.70)' : file ? 'rgba(90,196,114,0.50)' : 'rgba(245,197,24,0.30)'}`,
              borderRadius: 10, padding: '44px 24px', textAlign: 'center', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
            />
            <div style={{
              display: 'inline-flex', width: 56, height: 56, borderRadius: 14,
              background: file ? 'rgba(46,151,68,0.15)' : 'rgba(245,197,24,0.10)',
              alignItems: 'center', justifyContent: 'center',
              color: file ? '#5AC472' : '#F5C518', marginBottom: 12,
            }}>
              {file ? <I.check size={26} /> : <I.upload size={26} />}
            </div>
            {file ? (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#5AC472' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                  {(file.size / 1024).toFixed(1)} Ko · Cliquez pour changer de fichier
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  Déposez votre fichier Excel ici
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                  ou cliquez pour parcourir · Formats acceptés : .xlsx, .xls
                </div>
              </>
            )}
          </div>

          {/* Barre de progression */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-2)' }}>
                <span>{progress < 80 ? 'Envoi du fichier…' : 'Traitement en cours…'}</span>
                <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#5AC472' }}>{progress}%</span>
              </div>
              <ProgressBar value={progress} />
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(198,40,40,0.08)', border: '1px solid rgba(198,40,40,0.30)',
              borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FF8A7A',
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <I.alert size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-ghost" disabled={loading} onClick={() => { setFile(null); setStep(1); }}>
              ← Retour au gabarit
            </button>
            <button
              className="btn btn-primary"
              disabled={!file || loading}
              style={{ opacity: (!file || loading) ? 0.5 : 1, minWidth: 160 }}
              onClick={runImport}
            >
              {loading
                ? <><I.refresh size={13} style={{ animation: 'spin 1s linear infinite' }} /> Import en cours…</>
                : <><I.upload size={13} /> Lancer l'import</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 — Résultat + Aperçu ───────────────────────────────────── */}
      {step === 3 && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Compteurs résumé */}
          <div className="card" style={{ padding: 20 }}>
            <h3 className="sg" style={{ fontSize: 15, margin: '0 0 14px' }}>Résultat de l'import</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Total lignes',  value: result.total_lignes,  color: 'var(--text)'   },
                { label: 'Créés',         value: result.created,       color: '#34D399'        },
                { label: 'Mis à jour',    value: result.updated,       color: '#FBBF24'        },
                { label: 'Erreurs',       value: result.errors_count,  color: result.errors_count > 0 ? '#F87171' : 'var(--text-3)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                  <div className="sg" style={{ fontSize: 28, color: s.color, marginTop: 4 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {result.errors.length > 0 && (
              <div style={{ marginTop: 16, background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.22)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(198,40,40,0.15)', fontSize: 12, color: '#FF8A7A', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <I.alert size={13} /> {result.errors_count} erreur{result.errors_count > 1 ? 's' : ''} détectée{result.errors_count > 1 ? 's' : ''}
                  {result.errors_count > 50 && <span style={{ fontWeight: 400, opacity: 0.7 }}>(50 premières affichées)</span>}
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  <table className="data" style={{ fontSize: 12 }}>
                    <thead><tr><th style={{ width: 80 }}>Ligne</th><th>Erreur</th></tr></thead>
                    <tbody>
                      {result.errors.map((err, i) => (
                        <tr key={i}>
                          <td className="mono" style={{ color: '#FF8A7A' }}>L.{err.ligne}</td>
                          <td style={{ color: 'var(--text-2)' }}>{err.erreur}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button className="btn btn-outline" onClick={() => { setStep(1); setFile(null); setResult(null); setError(''); setProgress(0); }}>
                <I.plus size={13} /> Nouvel import
              </button>
            </div>
          </div>

          {/* Aperçu des données importées */}
          {result.preview && result.preview.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                    Aperçu des données importées
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {result.preview.length} enregistrement{result.preview.length > 1 ? 's' : ''} affiché{result.preview.length > 1 ? 's' : ''}
                    {result.total_lignes > result.preview.length && ` sur ${result.total_lignes} total`}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <I.eye size={13} /> Glissez horizontalement pour voir toutes les colonnes
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data" style={{ fontSize: 12, minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Statut</th>
                      <th>Nom de la Paroisse</th>
                      <th>Niveau</th>
                      <th>Région Synodale</th>
                      <th>District</th>
                      <th>Adresse</th>
                      <th style={{ textAlign: 'right' }}>Communiants</th>
                      <th style={{ textAlign: 'right' }}>Non-Comm.</th>
                      <th style={{ textAlign: 'center' }}>GPS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{
                            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 3,
                            background: row.statut === 'Créé' ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                            color: row.statut === 'Créé' ? '#34D399' : '#FBBF24',
                          }}>
                            {row.statut}
                          </span>
                        </td>
                        <td style={{ fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.nom}
                        </td>
                        <td>
                          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
                            {row.niveau}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-2)', fontSize: 11 }}>{row.region}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 11 }}>{row.district}</td>
                        <td style={{ color: 'var(--text-3)', fontSize: 11, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.adresse || '—'}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', color: row.communiants > 0 ? 'var(--text)' : 'var(--text-3)' }}>
                          {row.communiants > 0 ? row.communiants.toLocaleString('fr') : '—'}
                        </td>
                        <td className="mono" style={{ textAlign: 'right', color: row.non_communiants > 0 ? 'var(--text)' : 'var(--text-3)' }}>
                          {row.non_communiants > 0 ? row.non_communiants.toLocaleString('fr') : '—'}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {row.gps
                            ? <span style={{ color: '#34D399' }}>●</span>
                            : <span style={{ color: 'var(--text-3)' }}>○</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function IOPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab]             = React.useState<'import' | 'export' | 'historique'>('import');
  const [importTab, setImportTab] = React.useState<ImportTab>('paroisses');
  const [importKey, setImportKey] = React.useState(0);

  const [history, setHistory]   = React.useState<LogEntry[]>([]);
  const [histLoad, setHistLoad] = React.useState(false);

  React.useEffect(() => {
    if (tab !== 'historique') return;
    setHistLoad(true);
    Promise.all([
      api.get<PagedResult<LogEntry>>('/api/audit/journal/?action=IMPORT&page_size=100'),
      api.get<PagedResult<LogEntry>>('/api/audit/journal/?action=EXPORT&page_size=100'),
    ])
      .then(([imp, exp]) => {
        setHistory([...imp.results, ...exp.results]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      })
      .catch(() => {})
      .finally(() => setHistLoad(false));
  }, [tab, importKey]);

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
          { k: 'import',     l: 'Import de données', ic: 'upload'   as keyof typeof I },
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

      {/* ── IMPORT ────────────────────────────────────────────────────── */}
      {tab === 'import' && (
        <>
          {/* Sélecteur de type */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['paroisses', 'ouvriers', 'oeuvres'] as ImportTab[]).map(k => {
              const cfg = IMPORT_CONFIG[k];
              const Ic  = I[cfg.icon];
              return (
                <button key={k}
                  className={`btn ${importTab === k ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => { setImportTab(k); setImportKey(n => n + 1); }}
                  style={{ gap: 7 }}>
                  <Ic size={13} /> {cfg.label}
                </button>
              );
            })}
          </div>

          <ImportPanel
            key={`${importTab}-${importKey}`}
            tab={importTab}
            onDone={() => setImportKey(k => k + 1)}
          />
        </>
      )}

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
              <div className="sg-md" style={{ fontSize: 14 }}>Aucun import ou export enregistré</div>
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
                  const isImp = e.action === 'IMPORT';
                  return (
                    <tr key={e.id}>
                      <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{date}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{time}</div>
                      </td>
                      <td>
                        <span className={`pill ${isImp ? 'pill-blue' : 'pill-green'}`} style={{ fontSize: 11 }}>
                          {isImp ? 'Import' : 'Export'}
                        </span>
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
