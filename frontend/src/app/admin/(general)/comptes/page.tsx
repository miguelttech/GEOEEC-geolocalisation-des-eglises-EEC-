'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { api, UserAccount, RegionSynodale, District, Paroisse, PagedResult } from '@/lib/api';
import { I } from '@/components/admin/icons';
import { Avatar } from '@/components/admin/atoms';

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

// ─── Role helpers ─────────────────────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; cls: string; initBg: string; initColor: string }> = {
  SUPER:    { label: 'Administrateur Général', cls: 'pill-gold',   initBg: 'rgba(194,65,12,0.15)',  initColor: '#C2410C' },
  REGION:   { label: 'Admin Régional',   cls: 'pill-blue',   initBg: 'rgba(59,130,246,0.15)', initColor: '#3B82F6' },
  DISTRICT: { label: 'Admin District',   cls: 'pill-orange', initBg: 'rgba(249,115,22,0.15)', initColor: '#F97316' },
  PAROISSE: { label: 'Admin Paroisse',   cls: 'pill-green',  initBg: 'rgba(46,151,68,0.15)',  initColor: '#5AC472' },
  VISITEUR: { label: 'Visiteur',         cls: 'pill-gray',   initBg: 'rgba(148,163,184,0.15)', initColor: '#94A3B8' },
};
function RolePill({ role }: { role: string }) {
  const m = ROLE_META[role] || { label: role, cls: 'pill-gray', initBg: '', initColor: '' };
  return <span className={`pill ${m.cls}`}>{m.label}</span>;
}
function userInitials(u: UserAccount) {
  return ((u.first_name?.[0] || '') + (u.last_name?.[0] || '')).toUpperCase() || u.username?.[0]?.toUpperCase() || '?';
}
function userFullName(u: UserAccount) {
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username;
}

// ─── View Panel (lecture seule — le compte n'est plus modifiable ici) ─────────
function AccountViewPanel({ user: u, onClose }: {
  user: UserAccount; onClose: () => void;
}) {
  const m = ROLE_META[u.role] || ROLE_META.PAROISSE;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={userInitials(u)} size={44} bg={m.initBg} color={m.initColor}/>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{userFullName(u)}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{u.email}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <RolePill role={u.role}/>
            {u.is_active
              ? <span className="pill pill-green">Actif</span>
              : <span className="pill pill-red">Inactif</span>}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Identité</div>
            {[
              { label: 'Nom',          value: userFullName(u) },
              { label: 'Identifiant',  value: u.username },
              { label: 'Email',        value: u.email },
              { label: 'Téléphone',    value: u.telephone || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scope d'autorité</div>
            {[
              { label: 'Rôle',     value: u.role_display },
              { label: 'Région',   value: u.region_nom   || '—' },
              { label: 'District', value: u.district_nom || '—' },
              { label: 'Paroisse', value: u.paroisse_nom || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 5 }}>
              {u.scope_label}
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-3)', display: 'flex', gap: 16 }}>
            <span>Créé : {new Date(u.date_joined).toLocaleDateString('fr')}</span>
            {u.last_login && <span>Dernière connexion : {new Date(u.last_login).toLocaleDateString('fr')}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Form state (création uniquement — un compte existant n'est plus modifiable) ─
interface FormState {
  first_name: string; last_name: string; email: string;
  telephone: string; role: string; password: string;
  region: string; district: string; paroisse: string;
}
function emptyForm(): FormState {
  return { first_name: '', last_name: '', email: '', telephone: '', role: 'PAROISSE', password: '', region: '', district: '', paroisse: '' };
}

// ─── Form Panel (création) ─────────────────────────────────────────────────────
function AccountCreatePanel({ onClose, onSaved }: {
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [regions, setRegions] = useState<RegionSynodale[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [paroisses, setParoisses] = useState<Paroisse[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { api.get<RegionSynodale[]>('/api/geo/regions/liste/').then(setRegions).catch(() => {}); }, []);

  useEffect(() => {
    if (!form.region) { setDistricts([]); return; }
    api.get<PagedResult<District>>(`/api/geo/districts/?region=${form.region}`).then(r => setDistricts(r.results)).catch(() => {});
    setForm(f => ({ ...f, district: '', paroisse: '' }));
  }, [form.region]);

  useEffect(() => {
    if (!form.district) { setParoisses([]); return; }
    api.get<PagedResult<Paroisse>>(`/api/geo/paroisses/?district=${form.district}`).then(r => setParoisses(r.results)).catch(() => {});
    setForm(f => ({ ...f, paroisse: '' }));
  }, [form.district]);

  const needsRegion   = ['REGION', 'DISTRICT', 'PAROISSE'].includes(form.role);
  const needsDistrict = ['DISTRICT', 'PAROISSE'].includes(form.role);
  const needsParoisse = form.role === 'PAROISSE';

  async function handleSave() {
    if (!form.first_name || !form.last_name || !form.email) { setError('Prénom, nom et email sont obligatoires.'); return; }
    if (!form.password) { setError('Mot de passe obligatoire pour la création.'); return; }
    if (form.password.length < 12) { setError('Le mot de passe doit contenir au moins 12 caractères.'); return; }

    setSaving(true); setError('');
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name, last_name: form.last_name,
        email: form.email, telephone: form.telephone,
        role: form.role, password: form.password,
        username: form.email,
      };
      if (form.region)   payload.region   = Number(form.region);
      if (form.district) payload.district = Number(form.district);
      if (form.paroisse) payload.paroisse = Number(form.paroisse);
      await api.post('/api/auth/users/create/', payload);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.');
    } finally { setSaving(false); }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>Créer un compte admin</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>Console Synodale · EEC Cameroun</div>
          </div>
          <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
        </div>

        <div style={{ padding: '22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ background: 'rgba(198,40,40,0.12)', border: '1px solid rgba(198,40,40,0.35)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FF8A7A' }}>
              <I.alert size={13} style={{ marginRight: 6 }}/>{error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <div className="label">Prénom *</div>
              <input className="input" placeholder="Prénom(s)" value={form.first_name} onChange={e => set('first_name', e.target.value)}/>
            </div>
            <div>
              <div className="label">Nom *</div>
              <input className="input" placeholder="NOM DE FAMILLE" value={form.last_name} onChange={e => set('last_name', e.target.value)}/>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Email *</div>
              <input className="input" type="email" placeholder="admin@eec.cm" value={form.email} onChange={e => set('email', e.target.value)}/>
            </div>
            <div>
              <div className="label">Téléphone</div>
              <input className="input mono" placeholder="+237 6XX XXX XXX" value={form.telephone} onChange={e => set('telephone', e.target.value)}/>
            </div>
            <div>
              <div className="label">Rôle *</div>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="REGION">Admin Régional</option>
                <option value="DISTRICT">Admin District</option>
                <option value="PAROISSE">Admin Paroisse</option>
              </select>
            </div>
            <div style={{ gridColumn: form.role === 'REGION' ? 'auto' : '1/-1' }}>
              <div className="label">Mot de passe temporaire * (12 car. min.)</div>
              <input className="input mono" type="password" placeholder="••••••••••••" value={form.password} onChange={e => set('password', e.target.value)}/>
            </div>

            {needsRegion && (
              <>
                <div style={{ gridColumn: '1/-1', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Périmètre d'autorité</div>
                </div>
                <div>
                  <div className="label">Région synodale *</div>
                  <select className="input" value={form.region} onChange={e => set('region', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {regions.map(r => <option key={r.id} value={String(r.id)}>{r.nom}</option>)}
                  </select>
                </div>
                {needsDistrict && (
                  <div>
                    <div className="label">District {form.role === 'DISTRICT' ? '*' : ''}</div>
                    <select className="input" value={form.district} onChange={e => set('district', e.target.value)} disabled={!form.region}>
                      <option value="">— Sélectionner —</option>
                      {districts.map(d => <option key={d.id} value={String(d.id)}>{d.nom}</option>)}
                    </select>
                  </div>
                )}
                {needsParoisse && (
                  <div style={{ gridColumn: '1/-1' }}>
                    <div className="label">Paroisse *</div>
                    <select className="input" value={form.paroisse} onChange={e => set('paroisse', e.target.value)} disabled={!form.district}>
                      <option value="">— Sélectionner —</option>
                      {paroisses.map(p => <option key={p.id} value={String(p.id)}>{p.nom}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Annuler</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Enregistrement…' : 'Créer le compte'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal (SUPER only) ─────────────────────────────────────────────────
function DeleteAccountModal({ user, onClose, onDeleted }: {
  user: UserAccount; onClose: () => void; onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const fullName = userFullName(user);

  async function handleDelete() {
    setDeleting(true); setError('');
    try {
      await api.delete(`/api/auth/users/${user.id}/`);
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
            <div className="sg-md" style={{ fontSize: 16 }}>Supprimer ce compte utilisateur ?</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{fullName} — action irréversible</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Êtes-vous sûr de vouloir supprimer ce compte utilisateur ?
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
export default function ComptesPage() {
  const { toasts, add: addToast } = useToast();
  const [users, setUsers]       = useState<UserAccount[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [refresh, setRefresh]   = useState(0);
  const [viewPanel, setViewPanel]   = useState<UserAccount | null>(null);
  const [createPanel, setCreatePanel] = useState(false);
  const [deleteModal, setDeleteModal] = useState<UserAccount | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  function doRefresh() { setRefresh(r => r + 1); }

  useEffect(() => {
    api.get<{ id: number; role: string }>('/api/auth/me/')
      .then(me => { setIsSuper(me.role === 'SUPER'); setCurrentUserId(me.id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get<UserAccount[]>('/api/auth/users/')
      .then(setUsers)
      .catch(() => addToast({ type: 'error', title: 'Erreur de chargement des comptes.' }))
      .finally(() => setLoading(false));
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDeleted() {
    const nom = deleteModal ? userFullName(deleteModal) : '';
    setDeleteModal(null);
    addToast({ type: 'warn', title: `Compte "${nom}" supprimé.` });
    doRefresh();
  }

  const filtered = users.filter(u => {
    const nameMatch = !search || userFullName(u).toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const roleMatch = !filterRole || u.role === filterRole;
    const activeMatch = filterActive === '' || String(u.is_active) === filterActive;
    return nameMatch && roleMatch && activeMatch;
  });

  // Counts by role
  const counts = { SUPER: 0, REGION: 0, DISTRICT: 0, PAROISSE: 0, actif: 0, inactif: 0 };
  users.forEach(u => {
    if (u.role in counts) (counts as Record<string,number>)[u.role]++;
    if (u.is_active) counts.actif++; else counts.inactif++;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {(['SUPER','REGION','DISTRICT','PAROISSE'] as const).map(role => {
          const m = ROLE_META[role];
          return (
            <div key={role} className="card" style={{ padding: '12px 16px', cursor: 'pointer', outline: filterRole === role ? `2px solid ${m.initColor}` : 'none' }}
              onClick={() => setFilterRole(filterRole === role ? '' : role)}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{m.label}</div>
              <div className="sg-md" style={{ fontSize: 28, marginTop: 4, color: m.initColor }}>
                {loading ? '—' : (counts as Record<string,number>)[role]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h2 className="sg-md" style={{ margin: 0, fontSize: 16 }}>{loading ? '—' : users.length} compte{users.length !== 1 ? 's' : ''} administrateur{users.length !== 1 ? 's' : ''}</h2>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{counts.actif} actif{counts.actif !== 1 ? 's' : ''} · {counts.inactif} inactif{counts.inactif !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setCreatePanel(true)}><I.plus size={14}/>Créer un compte</button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <I.search size={14} style={{ position: 'absolute', top: 11, left: 11, color: 'var(--text-3)' }}/>
          <input className="input" placeholder="Rechercher un admin…" style={{ paddingLeft: 34, fontSize: 13 }}
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="input" style={{ width: 180 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">Tous les rôles</option>
          <option value="REGION">Admin Régional</option>
          <option value="DISTRICT">Admin District</option>
          <option value="PAROISSE">Admin Paroisse</option>
          <option value="VISITEUR">Visiteur</option>
        </select>
        <select className="input" style={{ width: 140 }} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="">Tous statuts</option>
          <option value="true">Actif</option>
          <option value="false">Inactif</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: 'var(--text-3)' }}>
            <span className="ls-spinner" style={{ width: 32, height: 32 }}/>
            <span style={{ fontSize: 13 }}>Chargement des comptes…</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Administrateur</th>
                  <th>Rôle</th>
                  <th>Scope</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Dernière connexion</th>
                  <th style={{ width: 70 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ height: 200, textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                      <I.users size={40} style={{ opacity: 0.25 }}/>
                      <div className="sg-md" style={{ fontSize: 15 }}>Aucun compte trouvé</div>
                    </div>
                  </td></tr>
                )}
                {filtered.map((u, idx) => {
                  const m = ROLE_META[u.role] || ROLE_META.PAROISSE;
                  return (
                    <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.55 }}>
                      <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(idx + 1).padStart(2, '0')}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar initials={userInitials(u)} size={34} bg={m.initBg} color={m.initColor}/>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5 }}>{userFullName(u)}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td><RolePill role={u.role}/></td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.scope_label || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.email}</td>
                      <td className="mono" style={{ fontSize: 12, color: 'var(--text-2)' }}>{u.telephone || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-2)' }}>
                        {u.last_login ? new Date(u.last_login).toLocaleString('fr') : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button className="icon-btn" onClick={() => setViewPanel(u)} title="Voir les détails"><I.eye size={15}/></button>
                          {isSuper && u.id !== currentUserId && (
                            <button className="icon-btn" style={{ color: '#FF8A7A' }} onClick={() => setDeleteModal(u)} title="Supprimer le compte">
                              <I.trash size={15}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewPanel && <AccountViewPanel user={viewPanel} onClose={() => setViewPanel(null)}/>}
      {createPanel && <AccountCreatePanel onClose={() => setCreatePanel(false)}
        onSaved={() => { setCreatePanel(false); addToast({ type: 'success', title: 'Compte créé avec succès.' }); doRefresh(); }}/>}
      {deleteModal && <DeleteAccountModal user={deleteModal} onClose={() => setDeleteModal(null)} onDeleted={handleDeleted}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
