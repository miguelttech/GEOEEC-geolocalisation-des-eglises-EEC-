'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, SegButtons, Dropdown } from '@/components/admin/atoms';

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

export default function ParametresMifiPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState('profil');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="tabs-bar">
        {[{k:'profil',l:'Profil'},{k:'security',l:'Sécurité'},{k:'tfa',l:'2FA'},{k:'sessions',l:'Sessions actives'},{k:'prefs',l:'Préférences'}].map(t => (
          <button key={t.k} className={'tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {tab === 'profil'   && <PrefProfil />}
      {tab === 'security' && <PrefSecurity onAddToast={addToast} />}
      {tab === 'tfa'      && <PrefTFA />}
      {tab === 'sessions' && <PrefSessions />}
      {tab === 'prefs'    && <PrefPrefs />}
      <ToastStack toasts={toasts} />
    </div>
  );
}

function PrefProfil() {
  return (
    <div className="anim-in card" style={{ padding: 24, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Profil — Admin Régional MIFI</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar initials="PA" size={72} bg="rgba(91,155,213,0.20)" color="#5B9BD5" ringColor="rgba(91,155,213,0.50)" />
        <div>
          <button className="btn btn-outline" style={{ marginBottom: 6 }}>Changer la photo</button>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>JPG ou PNG, 2 Mo max.</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div><div className="label">Nom complet</div><input className="input" defaultValue="Paul ATEBA" /></div>
        <div><div className="label">Email</div><input className="input" defaultValue="p.ateba@eec.cm" /></div>
        <div><div className="label">Téléphone</div><input className="input" defaultValue="+237 695 11 22 33" /></div>
        <div>
          <div className="label">Rôle & portée</div>
          <div style={{ display: 'flex', gap: 6, paddingTop: 10, flexWrap: 'wrap' }}>
            <span className="pill" style={{ background: 'rgba(91,155,213,0.18)', color: '#5B9BD5', borderColor: 'rgba(91,155,213,0.35)' }}>Admin Régional</span>
            <span className="pill pill-blue" style={{ fontSize: 11 }}>Région MIFI</span>
          </div>
        </div>
      </div>
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Sauvegarder les modifications</button>
    </div>
  );
}

function PrefSecurity({ onAddToast }: { onAddToast: (t: Omit<{id:number;type:'success'|'warn'|'info'|'error';title:string;body?:string}, 'id'>) => void }) {
  const [pw, setPw] = React.useState('');
  const strength = [pw.length >= 12, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = strength.filter(Boolean).length;
  const colors = ['#C62828','#E65100','#5AC472','#1F8A3D'];
  const labels = ['Faible','Moyen','Fort','Très fort'];
  return (
    <div className="anim-in card" style={{ padding: 24, maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Changement de mot de passe</h3>
      <div><div className="label">Mot de passe actuel</div><input className="input" type="password" placeholder="••••••••••" /></div>
      <div>
        <div className="label">Nouveau mot de passe</div>
        <input className="input" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••••" />
        {pw && (
          <>
            <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)' }} />)}
            </div>
            <div style={{ fontSize: 11, color: colors[Math.max(0, score - 1)], marginTop: 4 }}>{labels[Math.max(0, score - 1)]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10, fontSize: 11.5 }}>
              {([
                ['12 caractères minimum', strength[0]],
                ['Au moins une majuscule', strength[1]],
                ['Au moins un chiffre', strength[2]],
                ['Au moins un caractère spécial', strength[3]],
              ] as [string, boolean][]).map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, color: r[1] ? '#5AC472' : 'var(--text-3)' }}>
                  {r[1] ? <I.check size={11}/> : <I.x size={11}/>} {r[0]}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div><div className="label">Confirmer le nouveau mot de passe</div><input className="input" type="password" placeholder="••••••••••" /></div>
      <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => onAddToast({ type:'success', title:'Mot de passe modifié.' })}>Mettre à jour</button>
    </div>
  );
}

function PrefTFA() {
  return (
    <div className="anim-in card" style={{ padding: 24, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Authentification à deux facteurs (2FA)</h3>
      <div style={{ background: 'rgba(91,155,213,0.10)', border: '1px solid rgba(91,155,213,0.30)', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <I.shield size={16} style={{ color: '#5B9BD5' }}/>
        <span style={{ fontSize: 13, color: '#5B9BD5', fontWeight: 600 }}>2FA non activée</span>
        <button className="btn btn-primary" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: 12 }}>Activer la 2FA</button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
        La double authentification renforce la sécurité de votre compte Admin Régional MIFI. Elle est fortement recommandée pour les administrateurs qui gèrent des données sensibles.
      </div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ width: 192, height: 192, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: 12 }}>
          <svg width="168" height="168" viewBox="0 0 32 32">
            {Array.from({length:32}).map((_, y) => Array.from({length:32}).map((_, x) => {
              const seed = (x*31+y*17+x*y) % 7;
              if ((x<7 && y<7) || (x>24 && y<7) || (x<7 && y>24)) return null;
              return seed < 3 ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0D1B12"/> : null;
            }))}
            <rect x="0" y="0" width="7" height="7" fill="none" stroke="#0D1B12" strokeWidth="1"/>
            <rect x="2" y="2" width="3" height="3" fill="#0D1B12"/>
            <rect x="25" y="0" width="7" height="7" fill="none" stroke="#0D1B12" strokeWidth="1"/>
            <rect x="27" y="2" width="3" height="3" fill="#0D1B12"/>
            <rect x="0" y="25" width="7" height="7" fill="none" stroke="#0D1B12" strokeWidth="1"/>
            <rect x="2" y="27" width="3" height="3" fill="#0D1B12"/>
          </svg>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Scannez ce QR code avec votre application 2FA (Google Authenticator, Authy, ou similaire). Ou saisissez le code secret :</div>
          <div className="code-chip" style={{ alignSelf: 'flex-start' }}>JBSWY3DPEHPK3PXP</div>
          <div className="label" style={{ marginTop: 10 }}>Code à 6 chiffres</div>
          <input className="input mono" placeholder="123 456" style={{ width: 160, fontSize: 18, letterSpacing: '0.2em', textAlign: 'center' }} />
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }}>Confirmer l'activation</button>
        </div>
      </div>
    </div>
  );
}

function PrefSessions() {
  const sessions = [
    { device:'MacBook Pro',     browser:'Chrome 126', ip:'197.145.43.12', loc:'Bafoussam, Cameroun', last:'Maintenant', current: true },
    { device:'Android',         browser:'Chrome Mobile', ip:'237.110.8.54', loc:'Bafoussam, Cameroun', last:'Il y a 4 h' },
  ];
  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead><tr><th>Appareil</th><th>Navigateur</th><th>IP</th><th>Localisation</th><th>Dernière activité</th><th></th></tr></thead>
          <tbody>
            {sessions.map((s, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <I.monitor size={16} style={{ color: 'var(--text-2)' }}/>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.device}</div>
                      {s.current && <span className="pill pill-green" style={{ marginTop: 4, padding: '1px 7px' }}>Session actuelle</span>}
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-2)' }}>{s.browser}</td>
                <td className="mono" style={{ color: 'var(--text-2)', fontSize: 12 }}>{s.ip}</td>
                <td style={{ color: 'var(--text-2)' }}>{s.loc}</td>
                <td style={{ color: 'var(--text-2)' }}>{s.last}</td>
                <td>{!s.current && <button className="btn btn-outline" style={{ color: '#FF6B6B', borderColor: 'rgba(198,40,40,0.40)', padding: '5px 10px', fontSize: 11 }}>Déconnecter</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn btn-outline" style={{ alignSelf: 'flex-start', color: '#FF6B6B', borderColor: 'rgba(198,40,40,0.40)' }}>Se déconnecter de toutes les autres sessions</button>
    </div>
  );
}

function PrefPrefs() {
  const [theme, setTheme] = React.useState<'dark'|'light'|'auto'>('dark');

  React.useEffect(() => {
    const stored = (localStorage.getItem('eec-admin-theme') as 'dark'|'light') || 'dark';
    setTheme(stored);
  }, []);

  function applyTheme(t: 'dark'|'light'|'auto') {
    const effective = t === 'auto'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    setTheme(t);
    (window as any).__setEECTheme?.(effective);
    localStorage.setItem('eec-admin-theme', effective);
  }

  return (
    <div className="anim-in card" style={{ padding: 24, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h3 className="sg" style={{ fontSize: 16, margin: '0 0 12px' }}>Thème</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            {k:'light', l:'Clair',       ic:'sun',     bg:'#F0F4F1',                                        accent:'#0D1B12'},
            {k:'dark',  l:'Sombre',      ic:'moon',    bg:'#0D1B12',                                        accent:'#5B9BD5'},
            {k:'auto',  l:'Automatique', ic:'monitor', bg:'linear-gradient(135deg,#F0F4F1 50%,#0D1B12 50%)', accent:'#5B9BD5'},
          ].map(t => {
            const Ic = I[t.ic as keyof typeof I];
            const selected = t.k === theme;
            return (
              <div key={t.k} onClick={() => applyTheme(t.k as 'dark'|'light'|'auto')}
                style={{ padding: 14, borderRadius: 7, background: 'rgba(255,255,255,0.02)', border: '2px solid ' + (selected ? '#5B9BD5' : 'var(--border)'), cursor: 'pointer', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                <div style={{ width: '100%', height: 60, borderRadius: 4, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {Ic && <Ic size={22} style={{ color: t.accent }}/>}
                  {selected && <span style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#5B9BD5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><I.check size={10} style={{ color: '#fff' }}/></span>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.l}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h3 className="sg" style={{ fontSize: 16, margin: '0 0 12px' }}>Format de date</h3>
        <SegButtons value="dd/mm/yyyy" options={[{label:'JJ/MM/AAAA',value:'dd/mm/yyyy'},{label:'AAAA-MM-JJ',value:'yyyy-mm-dd'}]} onChange={() => {}}/>
      </div>
      <div>
        <h3 className="sg" style={{ fontSize: 16, margin: '0 0 12px' }}>Fuseau horaire</h3>
        <Dropdown value="Afrique/Douala (UTC+1)" options={['Afrique/Douala (UTC+1)','Europe/Paris (UTC+1)','UTC']} onChange={() => {}} width={280}/>
      </div>
      <div>
        <h3 className="sg" style={{ fontSize: 16, margin: '0 0 12px' }}>Notifications par email</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox" defaultChecked/> Validations en attente dans ma région</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox" defaultChecked/> Imports terminés</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox"/> Rapport hebdomadaire MIFI</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}><input type="checkbox" className="checkbox"/> Résumé mensuel</label>
        </div>
      </div>
    </div>
  );
}
