'use client';
import React from 'react';
import { api, getCsrf, UserAccount } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { Avatar } from '@/components/admin/atoms';

interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast, 'id'>) => {
    const id = Date.now();
    setToasts(p => [...p, { ...t, id }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000);
  };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.title}</div>
            {t.body && <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.body}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

const ROLE_LABEL: Record<string, string> = {
  SUPER: 'Administrateur Général',
  REGION: 'Administrateur Régional',
  DISTRICT: 'Administrateur District',
  PAROISSE: 'Administrateur Paroisse',
  VISITEUR: 'Visiteur',
};

export default function ParametresPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState('profil');
  const [me, setMe] = React.useState<UserAccount | null>(null);

  const loadMe = React.useCallback(() => {
    api.get<UserAccount>('/api/auth/me/').then(setMe).catch(() => {});
  }, []);

  React.useEffect(() => { loadMe(); }, [loadMe]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="tabs-bar">
        {[{ k: 'profil', l: 'Profil' }, { k: 'prefs', l: 'Préférences' }].map(t => (
          <button key={t.k} className={'tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {tab === 'profil' && <PrefProfil me={me} onAddToast={addToast} onSaved={loadMe} />}
      {tab === 'prefs' && <PrefPrefs me={me} onAddToast={addToast} />}
      <ToastStack toasts={toasts} />
    </div>
  );
}

function PrefProfil({ me, onAddToast, onSaved }: {
  me: UserAccount | null; onAddToast: (t: Omit<Toast, 'id'>) => void; onSaved: () => void;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  if (!me) {
    return (
      <div className="card" style={{ padding: 24, maxWidth: 720, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: 'var(--text-3)' }}>
        <I.refresh size={16} style={{ opacity: 0.5, marginRight: 8 }} />Chargement du profil…
      </div>
    );
  }

  const initials = ((me.first_name?.[0] || '') + (me.last_name?.[0] || '')).toUpperCase() || me.username[0]?.toUpperCase() || '?';
  const fullName = [me.first_name, me.last_name].filter(Boolean).join(' ') || me.username;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const csrf = await getCsrf();
      const form = new FormData();
      form.append('file', file);
      const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');
      const res = await fetch(`${BACKEND}/api/auth/me/avatar/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrf },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur lors du téléversement.');
      }
      onAddToast({ type: 'success', title: 'Photo de profil mise à jour.' });
      onSaved();
      // EXIGENCE : répercuter immédiatement la nouvelle photo partout
      // (navbar, etc.) — chaque vue écoute cet événement et se resynchronise.
      window.dispatchEvent(new Event('eec-profile-updated'));
    } catch (err: unknown) {
      onAddToast({ type: 'error', title: err instanceof Error ? err.message : 'Erreur lors du téléversement.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleRemove() {
    setUploading(true);
    try {
      const csrf = await getCsrf();
      const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api\/?$/, '');
      const res = await fetch(`${BACKEND}/api/auth/me/avatar/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrf },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erreur lors de la suppression.');
      }
      onAddToast({ type: 'success', title: 'Photo de profil supprimée.' });
      onSaved();
      window.dispatchEvent(new Event('eec-profile-updated'));
    } catch (err: unknown) {
      onAddToast({ type: 'error', title: err instanceof Error ? err.message : 'Erreur lors de la suppression.' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="anim-in card" style={{ padding: 24, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Profil</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {me.avatar_url ? (
          <img src={me.avatar_url} alt={fullName} width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
        ) : (
          <Avatar initials={initials} size={72} bg="rgba(46,151,68,0.25)" color="#5AC472" ringColor="rgba(46,151,68,0.50)" />
        )}
        <div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <button className="btn btn-outline-green" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? 'Envoi…' : 'Changer la photo'}
            </button>
            {me.avatar_url && (
              <button className="btn btn-outline" style={{ color: '#FF8A7A', borderColor: 'rgba(198,40,40,0.40)' }} disabled={uploading} onClick={handleRemove}>
                Supprimer la photo
              </button>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>JPG ou PNG, 5 Mo max.</div>
        </div>
      </div>
      <div className="g g-2" style={{ gap: 14 }}>
        <div>
          <div className="label">Nom complet</div>
          <input className="input" value={fullName} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
        </div>
        <div>
          <div className="label">Email</div>
          <input className="input" value={me.email} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
        </div>
        <div>
          <div className="label">Téléphone</div>
          <input className="input" value={me.telephone || '—'} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }} />
        </div>
        <div>
          <div className="label">Rôle</div>
          <div style={{ paddingTop: 10 }}><span className="pill pill-gold">{ROLE_LABEL[me.role] || me.role}</span></div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <I.alert size={12} />Le nom, l'email et le rôle sont définis à la création du compte et ne peuvent pas être modifiés ici.
      </div>
    </div>
  );
}

function PrefPrefs({ me, onAddToast }: { me: UserAccount | null; onAddToast: (t: Omit<Toast, 'id'>) => void }) {
  const [theme, setTheme] = React.useState<'clair' | 'sombre'>('sombre');

  React.useEffect(() => { if (me) setTheme(me.theme || 'sombre'); }, [me]);

  function applyTheme(t: 'clair' | 'sombre') {
    setTheme(t);
    window.__setEECTheme?.(t === 'clair' ? 'light' : 'dark');
    onAddToast({ type: 'success', title: t === 'clair' ? 'Thème clair activé.' : 'Thème sombre activé.' });
  }

  return (
    <div className="anim-in card" style={{ padding: 24, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h3 className="sg" style={{ fontSize: 16, margin: '0 0 12px' }}>Thème</h3>
        <div className="g g-2" style={{ gap: 12, maxWidth: 400 }}>
          {[
            { k: 'clair' as const, l: 'Clair', ic: 'sun' as const, bg: '#F0F4F1', accent: '#0D1B12' },
            { k: 'sombre' as const, l: 'Sombre', ic: 'moon' as const, bg: '#0D1B12', accent: '#FFD600' },
          ].map(t => {
            const Ic = I[t.ic];
            const selected = t.k === theme;
            return (
              <div key={t.k} onClick={() => applyTheme(t.k)}
                style={{ padding: 14, borderRadius: 7, background: 'rgba(255,255,255,0.02)', border: '2px solid ' + (selected ? '#2E9744' : 'var(--border)'), cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <div style={{ width: '100%', height: 60, borderRadius: 4, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {Ic && <Ic size={22} style={{ color: t.accent }} />}
                  {selected && <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#2E9744', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.check size={10} style={{ color: '#fff' }} /></span>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.l}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 10 }}>Le thème est enregistré sur votre compte et restauré à chaque connexion.</div>
      </div>
    </div>
  );
}
