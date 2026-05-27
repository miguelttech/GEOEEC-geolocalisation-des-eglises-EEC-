'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, Dropdown, TopCount, StatusPill, useOutside } from '@/components/admin/atoms';
import { accounts, REGIONS_22 } from '@/components/admin/data';
import InvitePanel from '@/components/admin/InvitePanel';

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

// ── View Panel ────────────────────────────────────────────────────────────────
function AccountViewPanel({ account, onClose, onEdit }: { account: any; onClose: () => void; onEdit: () => void }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials={account.initials} size={44} bg={account.bg} color={account.color}/>
            <div>
              <h2 className="sg-md" style={{ fontSize: 15, margin: 0 }}>{account.nom}</h2>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{account.email}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={onEdit}><I.pencil size={13}/>Modifier</button>
            <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '20px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {account.role === 'SUPER ADMIN'    && <span className="pill pill-gold">{account.role}</span>}
            {account.role === 'Admin Régional' && <span className="pill pill-blue">{account.role}</span>}
            {account.role === 'Admin District' && <span className="pill pill-orange">{account.role}</span>}
            {account.role === 'Admin Paroisse' && <span className="pill pill-green">{account.role}</span>}
            <StatusPill statut={account.statut}/>
            {account.tfa && <span style={{ display:'inline-flex',alignItems:'center',gap:4,fontSize:10,fontWeight:600,color:'#5AC472',background:'rgba(46,151,68,0.12)',border:'1px solid rgba(46,151,68,0.30)',borderRadius:99,padding:'3px 8px',textTransform:'uppercase',letterSpacing:'0.04em' }}><I.shield size={11}/>2FA</span>}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Informations</div>
            {[
              { label: 'Portée', value: account.portee },
              { label: 'Dernière connexion', value: account.last },
              { label: '2FA', value: account.tfa ? 'Activée' : 'Désactivée' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <span style={{ color: 'var(--text-3)' }}>{f.label}</span>
                <span style={{ fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Actions rapides</div>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}><I.key size={14}/>Réinitialiser le mot de passe</button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10 }}><I.shield size={14}/>Révoquer toutes les sessions</button>
            <button className="btn btn-outline" style={{ justifyContent: 'flex-start', gap: 10, color: 'var(--text-2)' }}><I.lock size={14}/>Désactiver le compte</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Panel ────────────────────────────────────────────────────────────────
function AccountEditPanel({ account, onClose, onSave }: { account: any; onClose: () => void; onSave: (d: any) => void }) {
  const [form, setForm] = React.useState({
    nom: account.nom,
    email: account.email,
    role: account.role,
    portee: account.portee,
    statut: account.statut,
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--chrome)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize: 18, margin: 0, color: '#F0F4F1' }}>Modifier le compte</h2>
            <div style={{ fontSize: 11, color: 'rgba(240,244,241,0.50)', marginTop: 2 }}>{account.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: 12, color: 'rgba(240,244,241,0.80)', borderColor: 'rgba(255,255,255,0.20)' }} onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }} onClick={() => onSave(form)}>Enregistrer</button>
            <button className="icon-btn" style={{ color: 'rgba(240,244,241,0.60)' }} onClick={onClose}><I.x size={16}/></button>
          </div>
        </div>

        <div style={{ padding: '22px 22px', overflowY: 'auto', height: 'calc(100% - 72px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
            <Avatar initials={account.initials} size={52} bg={account.bg} color={account.color}/>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{account.nom}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{account.email}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Nom complet</div>
              <input className="input" value={form.nom} onChange={e => set('nom', e.target.value)}/>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Email</div>
              <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)}/>
            </div>
            <div>
              <div className="label">Rôle</div>
              <Dropdown value={form.role} options={['SUPER ADMIN','Admin Régional','Admin District','Admin Paroisse']} onChange={v => set('role', v)}/>
            </div>
            <div>
              <div className="label">Statut</div>
              <Dropdown value={form.statut} options={['actif','inactif']} onChange={v => set('statut', v)}/>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div className="label">Portée (région / district / paroisse)</div>
              <input className="input" placeholder="Ex. MIFI / BAFOUSSAM NORD" value={form.portee} onChange={e => set('portee', e.target.value)}/>
            </div>
          </div>

          <div style={{ background: 'rgba(255,214,0,0.06)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#FFD600', display: 'flex', gap: 8, alignItems: 'center' }}>
            <I.alert size={13}/>La modification du rôle prend effet immédiatement. L'utilisateur sera notifié par email.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)', marginTop: 4 }}>
            <button className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button className="btn btn-primary" onClick={() => onSave(form)}>Enregistrer les modifications</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RowMenuAccount({ onAction }: { onAction: (a: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button className="icon-btn" onClick={() => setOpen(o => !o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top: 'calc(100% + 4px)', right: 0, minWidth: 200 }}>
          <button onClick={() => { setOpen(false); onAction('reset'); }}><I.key size={13}/>Réinitialiser MDP</button>
          <button onClick={() => { setOpen(false); onAction('revoke'); }}><I.shield size={13}/>Révoquer sessions</button>
          <button onClick={() => { setOpen(false); onAction('disable'); }}><I.lock size={13}/>Désactiver</button>
          <hr/>
          <button className="danger" onClick={() => { setOpen(false); onAction('delete'); }}><I.trash size={13}/>Supprimer</button>
        </div>
      )}
    </div>
  );
}

export default function ComptesPage() {
  const { toasts, add: addToast } = useToast();
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState('Tous rôles');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [viewPanel, setViewPanel] = React.useState<any>(null);
  const [editPanel, setEditPanel] = React.useState<any>(null);

  const data = accounts.filter(a =>
    a.nom.toLowerCase().includes(search.toLowerCase()) &&
    (role === 'Tous rôles' || a.role === role)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <TopCount label="Total actifs"                  value="48" color="var(--text)" />
        <TopCount label="Super Admins"                  value="2"  color="#FFD600" />
        <TopCount label="Admin Régionaux"               value="11" color="#5B9BD5" />
        <TopCount label="Admin Districts + Paroisses"   value="35" color="#5AC472" />
      </div>

      <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <I.search size={14} style={{ position: 'absolute', top: 11, left: 11, color: 'var(--text-3)' }} />
          <input className="input" placeholder="Rechercher un compte..." style={{ paddingLeft: 34 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Dropdown value={role} options={['Tous rôles','SUPER ADMIN','Admin Régional','Admin District','Admin Paroisse']} onChange={setRole} width={180} />
        <Dropdown value="Toutes régions" options={['Toutes régions', ...REGIONS_22]} onChange={() => {}} width={170} />
        <Dropdown value="Tous statuts" options={['Tous statuts','Actif','Inactif']} onChange={() => {}} width={140} />
        <Dropdown value="2FA: tous" options={['2FA: tous','2FA: activée','2FA: désactivée']} onChange={() => {}} width={140} />
        <button className="btn btn-primary" onClick={() => setInviteOpen(true)}><I.plus size={14}/>Inviter un administrateur</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" className="checkbox" /></th>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Portée</th>
              <th>2FA</th>
              <th>Dernière connexion</th>
              <th>Statut</th>
              <th style={{ width: 110 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((a, i) => (
              <tr key={i}>
                <td><input type="checkbox" className="checkbox" /></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar initials={a.initials} size={34} bg={a.bg} color={a.color} />
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.nom}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{a.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {a.role === 'SUPER ADMIN'    && <span className="pill pill-gold">{a.role}</span>}
                  {a.role === 'Admin Régional' && <span className="pill pill-blue">{a.role}</span>}
                  {a.role === 'Admin District' && <span className="pill pill-orange">{a.role}</span>}
                  {a.role === 'Admin Paroisse' && <span className="pill pill-green">{a.role}</span>}
                </td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{a.portee}</td>
                <td>
                  {a.tfa
                    ? <span style={{ color: '#5AC472', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}><I.shield size={14}/>Activée</span>
                    : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>
                  }
                </td>
                <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{a.last}</td>
                <td><StatusPill statut={a.statut} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button className="icon-btn" onClick={() => setViewPanel(a)}><I.eye size={15}/></button>
                    <button className="icon-btn green" onClick={() => setEditPanel(a)}><I.pencil size={15}/></button>
                    <RowMenuAccount onAction={(act) => addToast({
                      type: act === 'delete' ? 'warn' : 'success',
                      title: act === 'reset' ? 'Mot de passe réinitialisé.' : act === 'revoke' ? 'Sessions révoquées.' : act === 'disable' ? 'Compte désactivé.' : 'Compte supprimé.'
                    })} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {inviteOpen && (
        <InvitePanel
          onClose={() => setInviteOpen(false)}
          onCreated={(form) => {
            setInviteOpen(false);
            addToast({ type: 'success', title: `Compte créé : ${form.prenom} ${form.nom}` });
          }}
        />
      )}

      {viewPanel && (
        <AccountViewPanel
          account={viewPanel}
          onClose={() => setViewPanel(null)}
          onEdit={() => { setEditPanel(viewPanel); setViewPanel(null); }}
        />
      )}

      {editPanel && (
        <AccountEditPanel
          account={editPanel}
          onClose={() => setEditPanel(null)}
          onSave={(d) => {
            setEditPanel(null);
            addToast({ type: 'success', title: 'Compte mis à jour.', body: d.nom });
          }}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}
