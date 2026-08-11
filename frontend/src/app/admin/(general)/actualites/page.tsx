'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, getCsrf, News, NewsImage, PagedResult } from '@/lib/api';
import { I } from '@/components/admin/icons';

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; type: 'success'|'warn'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts(p => p.filter(x => x.id !== id)), []);
  const add    = useCallback((t: Omit<Toast,'id'>) => {
    const id = Date.now(); setToasts(p => [...p, { ...t, id }]);
    setTimeout(() => remove(id), 4500);
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

async function uploadImages(newsId: number, files: File[]): Promise<News> {
  const csrf = await getCsrf();
  const form = new FormData();
  files.forEach(f => form.append('images', f));
  const res = await fetch(`${BACKEND}/api/news/${newsId}/images/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrf },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erreur lors de l'envoi des images.");
  }
  return res.json();
}

async function deleteImage(newsId: number, imageId: number): Promise<News> {
  const csrf = await getCsrf();
  const res = await fetch(`${BACKEND}/api/news/${newsId}/images/${imageId}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'X-CSRFToken': csrf },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression de l'image.");
  return res.json();
}

// ─── Form Panel (création + édition, texte + galerie d'images) ────────────────
function NewsFormPanel({ news, onClose, onSaved, onAddToast }: {
  news: News | null; onClose: () => void; onSaved: () => void;
  onAddToast: (t: Omit<Toast, 'id'>) => void;
}) {
  const isEdit = !!news;
  const [titre, setTitre] = useState(news?.titre ?? '');
  const [contenu, setContenu] = useState(news?.contenu ?? '');
  const [estPubliee, setEstPubliee] = useState(news?.est_publiee ?? false);
  const [images, setImages] = useState<NewsImage[]>(news?.images ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (isEdit && news) {
      // Édition : l'actualité existe déjà, on envoie tout de suite.
      setUploading(true);
      uploadImages(news.id, files)
        .then(updated => { setImages(updated.images); onAddToast({ type: 'success', title: 'Image(s) ajoutée(s).' }); })
        .catch(err => onAddToast({ type: 'error', title: err instanceof Error ? err.message : 'Erreur.' }))
        .finally(() => setUploading(false));
    } else {
      // Création : pas encore d'id — on met en attente, envoyé après la création.
      setPendingFiles(f => [...f, ...files]);
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  function removePendingFile(idx: number) {
    setPendingFiles(f => f.filter((_, i) => i !== idx));
  }

  function removeExistingImage(imageId: number) {
    if (!news) return;
    setUploading(true);
    deleteImage(news.id, imageId)
      .then(updated => setImages(updated.images))
      .catch(err => onAddToast({ type: 'error', title: err instanceof Error ? err.message : 'Erreur.' }))
      .finally(() => setUploading(false));
  }

  async function handleSave() {
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return; }
    setSaving(true); setError('');
    try {
      if (isEdit && news) {
        await api.patch(`/api/news/${news.id}/`, { titre, contenu, est_publiee: estPubliee });
      } else {
        const created = await api.post<News>('/api/news/', { titre, contenu, est_publiee: estPubliee });
        if (pendingFiles.length) {
          await uploadImages(created.id, pendingFiles);
        }
      }
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>
              {isEdit ? "Modifier l'actualité" : 'Nouvelle actualité'}
            </h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Visible sur la landing page une fois publiée</div>
          </div>
          <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
        </div>

        <div style={{ padding: '22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'rgba(198,40,40,0.12)', border: '1px solid rgba(198,40,40,0.35)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FF8A7A' }}>
              <I.alert size={13} style={{ marginRight: 6 }}/>{error}
            </div>
          )}

          <div>
            <div className="label">Titre *</div>
            <input className="input" placeholder="Titre de l'actualité" value={titre} onChange={e => setTitre(e.target.value)} />
          </div>

          <div>
            <div className="label">Texte</div>
            <textarea className="input" rows={6} placeholder="Texte de l'actualité (optionnel — une actualité peut être uniquement des photos)"
              value={contenu} onChange={e => setContenu(e.target.value)} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" className="checkbox" checked={estPubliee} onChange={e => setEstPubliee(e.target.checked)} />
            <span style={{ fontSize: 13 }}>Publiée (visible immédiatement sur la landing page)</span>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div className="label" style={{ margin: 0 }}>Images {uploading && '(envoi…)'}</div>
              <button className="btn btn-outline-green" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <I.upload size={13}/>Ajouter
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={pickFiles} />
            </div>

            {(images.length === 0 && pendingFiles.length === 0) && (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Aucune image — l&apos;actualité s&apos;affichera en texte seul.</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {images.map(img => (
                <div key={img.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button className="icon-btn" onClick={() => removeExistingImage(img.id)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: '#fff', width: 22, height: 22 }}>
                    <I.x size={12}/>
                  </button>
                </div>
              ))}
              {pendingFiles.map((f, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', border: '1px dashed var(--border-strong)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button className="icon-btn" onClick={() => removePendingFile(i)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: '#fff', width: 22, height: 22 }}>
                    <I.x size={12}/>
                  </button>
                </div>
              ))}
            </div>
            {!isEdit && pendingFiles.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>Ces images seront envoyées à la création de l&apos;actualité.</div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : "Créer l'actualité"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ───────────────────────────────────────────────────────────────
function DeleteNewsModal({ news, onClose, onDeleted }: {
  news: News; onClose: () => void; onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true); setError('');
    try {
      await api.delete(`/api/news/${news.id}/`);
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  }

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(198,40,40,0.15)', color: '#FF8A7A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I.trash size={18}/>
          </div>
          <div>
            <div className="sg-md" style={{ fontSize: 16 }}>Supprimer cette actualité ?</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{news.titre} — action irréversible</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
          L&apos;actualité et toutes ses images seront définitivement supprimées, y compris du site public.
        </p>
        {error && <div style={{ marginTop: 8, fontSize: 12, color: '#FF8A7A' }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={deleting}>Annuler</button>
          <button className="btn" style={{ background: '#C62828', color: '#fff' }}
            onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ActualitesPage() {
  const { toasts, add: addToast } = useToast();
  const [items, setItems]       = useState<News[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refresh, setRefresh]   = useState(0);
  const [formPanel, setFormPanel] = useState<{ mode: 'create' } | { mode: 'edit'; news: News } | null>(null);
  const [deleteModal, setDeleteModal] = useState<News | null>(null);

  function doRefresh() { setRefresh(r => r + 1); }

  useEffect(() => {
    setLoading(true);
    api.get<PagedResult<News>>('/api/news/?page_size=200')
      .then(r => setItems(r.results))
      .catch(() => addToast({ type: 'error', title: 'Erreur de chargement des actualités.' }))
      .finally(() => setLoading(false));
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  async function togglePublish(n: News) {
    try {
      await api.patch(`/api/news/${n.id}/`, { est_publiee: !n.est_publiee });
      doRefresh();
    } catch (e: unknown) {
      addToast({
        type: 'error',
        title: 'Impossible de changer le statut de publication.',
        body: e instanceof Error ? e.message : undefined,
      });
    }
  }

  function handleSaved(mode: 'create' | 'edit') {
    setFormPanel(null);
    addToast({ type: 'success', title: mode === 'create' ? 'Actualité créée.' : 'Modifications enregistrées.' });
    doRefresh();
  }

  function handleDeleted() {
    setDeleteModal(null);
    addToast({ type: 'warn', title: 'Actualité supprimée.' });
    doRefresh();
  }

  const nbPubliees = items.filter(n => n.est_publiee).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>{loading ? '—' : items.length} actualité{items.length !== 1 ? 's' : ''}</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{nbPubliees} publiée{nbPubliees !== 1 ? 's' : ''} sur la landing page</span>
        </div>
        <button className="btn btn-primary" onClick={() => setFormPanel({ mode: 'create' })}><I.plus size={14}/>Nouvelle actualité</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }}/>
            <span style={{ fontSize: 13 }}>Chargement des actualités…</span>
          </div>
        ) : items.length === 0 ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: 'var(--text-3)' }}>
            <I.bell size={40} style={{ opacity: 0.25 }}/>
            <div className="sg-md" style={{ fontSize: 15 }}>Aucune actualité</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>Photos</th>
                  <th>Titre</th>
                  <th>Auteur</th>
                  <th>Statut</th>
                  <th>Créée le</th>
                  <th style={{ width: 90 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(n => (
                  <tr key={n.id}>
                    <td>
                      {n.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.images[0].image_url} alt="" width={40} height={40} style={{ borderRadius: 5, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 5, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                          <I.bell size={15}/>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{n.titre}</div>
                      {n.images.length > 1 && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{n.images.length} photos</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{n.auteur_nom || '—'}</td>
                    <td>
                      <span className={`pill ${n.est_publiee ? 'pill-green' : 'pill-gray'}`} style={{ cursor: 'pointer' }}
                        onClick={() => togglePublish(n)} title="Cliquer pour changer le statut">
                        {n.est_publiee ? 'Publiée' : 'Brouillon'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{new Date(n.created_at).toLocaleDateString('fr')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="icon-btn" onClick={() => setFormPanel({ mode: 'edit', news: n })} title="Modifier"><I.pencil size={15}/></button>
                        <button className="icon-btn" style={{ color: '#FF8A7A' }} onClick={() => setDeleteModal(n)} title="Supprimer"><I.trash size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formPanel && (
        <NewsFormPanel
          news={formPanel.mode === 'edit' ? formPanel.news : null}
          onClose={() => setFormPanel(null)}
          onSaved={() => handleSaved(formPanel.mode)}
          onAddToast={addToast}
        />
      )}
      {deleteModal && <DeleteNewsModal news={deleteModal} onClose={() => setDeleteModal(null)} onDeleted={handleDeleted} />}
      <ToastStack toasts={toasts} />
    </div>
  );
}
