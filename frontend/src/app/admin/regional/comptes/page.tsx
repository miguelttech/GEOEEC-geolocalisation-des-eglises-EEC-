'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, StatusPill, Dropdown, useOutside } from '@/components/admin/atoms';
import { COMPTES_REGION_MIFI, DISTRICTS_MIFI } from '@/components/admin/dataRegional';

interface Toast { id: number; type: 'success'|'warn'|'info'|'error'; title: string; body?: string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast, 'id'>) => { const id = Date.now(); setToasts(p => [...p, { ...t, id }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); };
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

function RowMenuCompte({ onView, compte }: { onView: () => void; compte: any }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 200 }}>
          <button onClick={() => { setOpen(false); onView(); }}><I.eye size={13}/>Voir le profil</button>
          <button onClick={() => setOpen(false)}><I.key size={13}/>Réinitialiser le mot de passe</button>
          <button onClick={() => setOpen(false)}><I.shield size={13}/>Révoquer les sessions</button>
          <hr/>
          <button onClick={() => setOpen(false)}><I.lock size={13}/>{compte.statut === 'actif' ? 'Désactiver le compte' : 'Réactiver le compte'}</button>
        </div>
      )}
    </div>
  );
}

function AccountViewPanel({ compte, onClose }: { compte: any; onClose: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={compte.initials} size={44} bg={compte.bg} color={compte.color}/>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{compte.nom}</h2>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{compte.email}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: compte.color + '22', color: compte.color, borderColor: compte.color + '55' }}>{compte.role}</span>
            <StatusPill statut={compte.statut}/>
            {compte.tfa && <span className="pill pill-green" style={{ fontSize: 10 }}>2FA activée</span>}
          </div>
          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Portée d'accès</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Périmètre</span>
              <span style={{ fontWeight: 500 }}>{compte.portee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-3)' }}>Dernière connexion</span>
              <span style={{ fontWeight: 500 }}>{compte.last}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}><I.key size={14}/>Réinitialiser le mot de passe</button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}><I.shield size={14}/>Révoquer les sessions actives</button>
            {compte.statut === 'actif' ? (
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10, color: '#FF6B6B', borderColor: 'rgba(198,40,40,0.40)' }}><I.lock size={14}/>Désactiver le compte</button>
            ) : (
              <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10, color: '#5AC472', borderColor: 'rgba(46,151,68,0.40)' }}><I.check size={14}/>Réactiver le compte</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InviteRegionalPanel({ onClose, onCreated }: { onClose: () => void; onCreated: (form: any) => void }) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    nom: '', prenom: '', email: '', tel: '',
    role: '', district: '', paroisse: '',
    password: 'EEc@' + Math.floor(Math.random() * 9000 + 1000) + '!xK9m',
  });
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const roles = [
    { id: 'district', title: 'Admin District', sub: 'Gère un district de la région MIFI.', icon: 'network' },
    { id: 'paroisse', title: 'Admin Paroisse', sub: 'Gère une paroisse spécifique.', icon: 'church' },
  ] as const;

  return (
    <>
      <div className="overlay" onClick={onClose}/>
      <div className="slide-panel">
        <div style={{ background: 'var(--chrome)', padding: '18px 22px', borderBottom: '1px solid rgba(91,155,213,0.15)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Inviter un administrateur</div>
          <span style={{ fontSize: 11, color: '#5B9BD5' }}>Région MIFI · Étape {step}/2</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && (
            <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 className="sg" style={{ fontSize: 17, margin: 0 }}>Informations personnelles</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div className="label">Nom *</div><input className="input" value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="KAMGA" /></div>
                <div><div className="label">Prénom *</div><input className="input" value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Jean-Marie" /></div>
              </div>
              <div><div className="label">Email *</div><input className="input" value={form.email} onChange={e => update('email', e.target.value)} placeholder="prenom.nom@eec-cameroun.org" /></div>
              <div>
                <div className="label">Rôle *</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {roles.map(r => {
                    const Ic = I[r.icon as keyof typeof I];
                    const selected = form.role === r.id;
                    return (
                      <div key={r.id} onClick={() => update('role', r.id)} style={{ padding: 12, borderRadius: 7, cursor: 'pointer', background: selected ? 'rgba(91,155,213,0.08)' : 'rgba(255,255,255,0.02)', border: selected ? '2px solid #5B9BD5' : '1px solid rgba(245,197,24,0.13)', display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 200ms ease' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + (selected ? '#5B9BD5' : 'rgba(255,255,255,0.25)'), flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5B9BD5' }}/>}
                        </div>
                        {Ic && <Ic size={18} style={{ color: selected ? '#5B9BD5' : 'var(--text-2)', flexShrink: 0, marginTop: 1 }}/>}
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.title}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2 }}>{r.sub}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {form.role && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <Dropdown label="District *" value={form.district} options={DISTRICTS_MIFI.map(d => d.nom)} onChange={v => update('district', v)} placeholder="Sélectionner un district" />
                  {form.role === 'paroisse' && form.district && (
                    <div><div className="label">Paroisse *</div><input className="input" value={form.paroisse} onChange={e => update('paroisse', e.target.value)} placeholder="Nom de la paroisse" /></div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3 className="sg" style={{ fontSize: 17, margin: 0 }}>Mot de passe temporaire</h3>
              <div style={{ background: 'rgba(91,155,213,0.08)', border: '1px solid rgba(91,155,213,0.30)', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <I.check size={14} style={{ color: '#5B9BD5' }}/>
                <span style={{ fontSize: 13, color: '#5B9BD5', fontWeight: 500 }}>{form.role === 'district' ? 'Admin District' : 'Admin Paroisse'} · {form.district}{form.paroisse ? ` / ${form.paroisse}` : ''}</span>
              </div>
              <div style={{ background: 'rgba(255,214,0,0.04)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><I.key size={14} style={{ color: '#FFD600' }}/><span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mot de passe temporaire</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="code-chip" style={{ flex: 1, padding: '8px 12px' }}>{form.password}</div>
                  <button className="icon-btn" onClick={() => navigator.clipboard.writeText(form.password)}><I.copy size={14}/></button>
                </div>
                <div style={{ fontSize: 11, color: '#FFB877', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <I.alert size={11} style={{ marginTop: 1, flexShrink: 0 }}/>
                  Affiché une seule fois. L'administrateur devra le changer à sa première connexion.
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--chrome)', padding: '14px 22px', borderTop: '1px solid rgba(91,155,213,0.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {step > 1 && <button className="btn btn-outline" onClick={() => setStep(step - 1)}><I.chevL size={13}/>Retour</button>}
          {step < 2 && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
              disabled={!form.nom || !form.email || !form.role || !form.district}
              onClick={() => setStep(2)}>
              Étape suivante<I.chevR size={13}/>
            </button>
          )}
          {step === 2 && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onCreated(form)}>
              Créer le compte<I.check size={14}/>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default function ComptesMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState('Tous rôles');
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [showInvite, setShowInvite] = React.useState(false);

  let data = [...COMPTES_REGION_MIFI];
  if (search) data = data.filter(c => c.nom.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));
  if (roleFilter !== 'Tous rôles') data = data.filter(c => c.role === roleFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Info scope */}
      <div style={{ background: 'rgba(91,155,213,0.06)', border: '1px solid rgba(91,155,213,0.20)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#7FB2E8', display: 'flex', alignItems: 'center', gap: 8 }}>
        <I.shield size={13}/>
        En tant qu'Admin Régional, vous pouvez gérer les comptes Admin District et Admin Paroisse de votre région MIFI. Vous ne pouvez pas créer d'autres Admin Régionaux.
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <I.search size={14} style={{ position: 'absolute', top: 10, left: 10, color: 'var(--text-3)' }}/>
            <input className="input" placeholder="Rechercher un compte..." style={{ paddingLeft: 32, width: 240, fontSize: 13 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Dropdown value={roleFilter} options={['Tous rôles','Admin Régional','Admin District','Admin Paroisse']} onChange={setRoleFilter} width={200}/>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInvite(true)}><I.plus size={14}/>Inviter un administrateur</button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 40 }}>#</th>
              <th className="sortable">Administrateur</th>
              <th>Rôle</th>
              <th>Portée</th>
              <th>2FA</th>
              <th>Dernière connexion</th>
              <th>Statut</th>
              <th style={{ width: 100 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c, i) => (
              <tr key={i}>
                <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{String(i+1).padStart(2,'0')}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar initials={c.initials} size={34} bg={c.bg} color={c.color}/>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className="pill" style={{ background: c.color + '22', color: c.color, borderColor: c.color + '55' }}>{c.role}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.portee}</td>
                <td>
                  {c.tfa
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5AC472' }}><I.shield size={12}/>Active</span>
                    : <span style={{ fontSize: 12, color: 'var(--text-3)' }}>—</span>
                  }
                </td>
                <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{c.last}</td>
                <td><StatusPill statut={c.statut}/></td>
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="icon-btn" onClick={() => setViewPanel(c)}><I.eye size={15}/></button>
                    <RowMenuCompte onView={() => setViewPanel(c)} compte={c}/>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)' }}>Aucun compte trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {viewPanel && <AccountViewPanel compte={viewPanel} onClose={() => setViewPanel(null)}/>}
      {showInvite && (
        <InviteRegionalPanel onClose={() => setShowInvite(false)}
          onCreated={form => { setShowInvite(false); addToast({ type:'success', title:`Compte créé — ${form.prenom} ${form.nom}`, body: form.email }); }}/>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
