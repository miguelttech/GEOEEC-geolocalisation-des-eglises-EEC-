'use client';
import React from 'react';
import { I } from '@/components/admin/icons';

const C = '#E67A2E';
const AVATAR = 'NE';
const TABS = ['Profil', 'Sécurité', '2FA', 'Sessions', 'Préférences'] as const;
type Tab = typeof TABS[number];

interface Toast { id:number; type:'success'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function TabProfilContent({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  const [nom, setNom] = React.useState('ESSONO');
  const [prenom, setPrenom] = React.useState('Nicolas');
  const [tel, setTel] = React.useState('+237 677 88 99 00');
  const [lang, setLang] = React.useState('fr');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:`${C}22`, color:C, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:22, border:`2px solid ${C}40` }}>{AVATAR}</div>
        <div>
          <div style={{ fontSize:16, fontWeight:700 }}>Nicolas ESSONO</div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>n.essono@eec.cm</div>
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:700, background:`${C}18`, color:C, marginTop:6, display:'inline-block' }}>Admin Paroisse</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM</label>
          <input className="input" value={nom} onChange={e=>setNom(e.target.value)} style={{ width:'100%' }}/>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>PRÉNOM</label>
          <input className="input" value={prenom} onChange={e=>setPrenom(e.target.value)} style={{ width:'100%' }}/>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>EMAIL</label>
          <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
            <I.shield size={11}/> n.essono@eec.cm
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>TÉLÉPHONE</label>
          <input className="input" value={tel} onChange={e=>setTel(e.target.value)} style={{ width:'100%' }}/>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>PAROISSE</label>
          <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
            <I.shield size={11}/> Bafoussam-Centre — scopée
          </div>
        </div>
        <div>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>LANGUE</label>
          <select className="input" value={lang} onChange={e=>setLang(e.target.value)} style={{ width:'100%' }}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }}
          onClick={()=>addToast({ type:'success', title:'Profil mis à jour' })}><I.check size={14}/>Enregistrer</button>
      </div>
    </div>
  );
}

function TabSecuriteContent({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  const [cur, setCur] = React.useState('');
  const [nw, setNw] = React.useState('');
  const [conf, setConf] = React.useState('');
  const ok = nw.length >= 8 && nw === conf && cur.length > 0;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {[{label:'MOT DE PASSE ACTUEL', val:cur, set:setCur},{label:'NOUVEAU MOT DE PASSE', val:nw, set:setNw},{label:'CONFIRMER', val:conf, set:setConf}].map(f=>(
        <div key={f.label}>
          <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>{f.label}</label>
          <input className="input" type="password" value={f.val} onChange={e=>f.set(e.target.value)} style={{ width:'100%' }}/>
        </div>
      ))}
      {nw.length > 0 && nw.length < 8 && <div style={{ fontSize:12, color:'#FF8A7A' }}>Minimum 8 caractères.</div>}
      {nw.length >= 8 && conf.length > 0 && nw !== conf && <div style={{ fontSize:12, color:'#FF8A7A' }}>Les mots de passe ne correspondent pas.</div>}
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
        <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}`, opacity: ok?1:0.5 }} disabled={!ok}
          onClick={()=>{ if(ok) addToast({ type:'success', title:'Mot de passe modifié' }); }}>
          <I.check size={14}/>Changer le mot de passe</button>
      </div>
    </div>
  );
}

function Tab2FAContent({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  const [enabled, setEnabled] = React.useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background: enabled ? 'rgba(90,196,114,0.07)' : 'rgba(255,138,122,0.07)', border:`1px solid ${enabled?'rgba(90,196,114,0.25)':'rgba(255,138,122,0.25)'}`, borderRadius:6, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background: enabled ? '#5AC472' : '#FF8A7A', flexShrink:0 }}/>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color: enabled ? '#5AC472' : '#FF8A7A' }}>2FA {enabled ? 'activée' : 'désactivée'}</div>
          <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{enabled ? 'Votre compte est sécurisé.' : 'Activez la double authentification pour plus de sécurité.'}</div>
        </div>
      </div>
      {!enabled && (
        <div className="card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ fontSize:13, fontWeight:600 }}>Activer l'authentification à deux facteurs</div>
          <div style={{ fontSize:12, color:'var(--text-2)' }}>Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy…)</div>
          <div style={{ width:120, height:120, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--text-3)' }}>QR Code</div>
          <div>
            <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>CODE DE VÉRIFICATION</label>
            <input className="input" placeholder="6 chiffres" maxLength={6} style={{ width:140 }}/>
          </div>
          <div>
            <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }}
              onClick={()=>{ setEnabled(true); addToast({ type:'success', title:'2FA activée' }); }}>
              <I.check size={14}/>Activer la 2FA
            </button>
          </div>
        </div>
      )}
      {enabled && (
        <button className="btn btn-ghost"
          onClick={()=>{ setEnabled(false); addToast({ type:'warn', title:'2FA désactivée' }); }}>
          Désactiver la 2FA
        </button>
      )}
    </div>
  );
}

function TabSessionsContent({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  const sessions = [
    { id:1, device:'Chrome / Linux',    ip:'197.210.xx.xx', lieu:'Bafoussam, CM', heure:'Maintenant',  current:true },
    { id:2, device:'Firefox / Android', ip:'197.210.xx.xx', lieu:'Bafoussam, CM', heure:'Il y a 2 j',  current:false },
  ];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      <div style={{ fontSize:12, color:'var(--text-3)' }}>{sessions.length} session(s) active(s)</div>
      {sessions.map(s => (
        <div key={s.id} className="card" style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <I.monitor size={16}/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{s.device}</div>
              <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{s.ip} — {s.lieu} — {s.heure}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {s.current && <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:700, background:'rgba(90,196,114,0.12)', color:'#5AC472' }}>Actuelle</span>}
            {!s.current && <button className="btn btn-ghost" style={{ fontSize:12 }}
              onClick={()=>addToast({ type:'warn', title:'Session révoquée' })}>Révoquer</button>}
          </div>
        </div>
      ))}
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
        <button className="btn btn-ghost" style={{ color:'#FF8A7A', borderColor:'rgba(255,138,122,0.25)' }}
          onClick={()=>addToast({ type:'warn', title:'Toutes les autres sessions révoquées' })}>
          Révoquer toutes les autres sessions
        </button>
      </div>
    </div>
  );
}

function TabPrefsContent({ addToast }: { addToast:(t:Omit<Toast,'id'>)=>void }) {
  const [theme, setTheme] = React.useState<'dark'|'light'>('dark');
  const [notif, setNotif] = React.useState({ propositions: true, rappels: true, updates: false });
  const toggle = (k: keyof typeof notif) => setNotif(p => ({ ...p, [k]: !p[k] }));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Thème</div>
        <div style={{ display:'flex', gap:8 }}>
          {(['dark','light'] as const).map(t => (
            <button key={t} className={`btn${theme===t?'':' btn-ghost'}`}
              style={theme===t ? { background:C, color:'#fff', border:`1px solid ${C}` } : {}}
              onClick={()=>setTheme(t)}>
              {t==='dark'?'Sombre':'Clair'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize:13, fontWeight:700, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Notifications</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {([
            { key:'propositions' as const, label:'Statut de mes propositions', sub:'Validation ou refus par le district' },
            { key:'rappels'      as const, label:'Rappels de complétion',       sub:'Champs manquants dans la fiche paroisse' },
            { key:'updates'      as const, label:'Mises à jour système',        sub:'Nouvelles fonctionnalités' },
          ]).map(n => (
            <div key={n.key} className="card" style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500 }}>{n.label}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{n.sub}</div>
              </div>
              <button onClick={()=>toggle(n.key)} style={{
                width:40, height:22, borderRadius:11, border:'none', cursor:'pointer', transition:'background 0.2s',
                background: notif[n.key] ? C : 'rgba(255,255,255,0.12)',
                position:'relative', flexShrink:0
              }}>
                <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, transition:'left 0.2s', left: notif[n.key] ? 21 : 3 }}/>
              </button>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }}
          onClick={()=>addToast({ type:'success', title:'Préférences enregistrées' })}>
          <I.check size={14}/>Enregistrer
        </button>
      </div>
    </div>
  );
}

export default function ParametresParoissePage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState<Tab>('Profil');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', gap:4, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t}
            onClick={()=>setTab(t)}
            style={{
              background:'none', border:'none', cursor:'pointer', padding:'8px 14px',
              fontSize:13, fontWeight: tab===t ? 600 : 400,
              color: tab===t ? C : 'var(--text-3)',
              borderBottom: tab===t ? `2px solid ${C}` : '2px solid transparent',
              transition:'all 0.15s',
            }}>{t}</button>
        ))}
      </div>
      <div className="card" style={{ padding:'22px 24px' }}>
        {tab === 'Profil'      && <TabProfilContent    addToast={addToast}/>}
        {tab === 'Sécurité'    && <TabSecuriteContent  addToast={addToast}/>}
        {tab === '2FA'         && <Tab2FAContent        addToast={addToast}/>}
        {tab === 'Sessions'    && <TabSessionsContent   addToast={addToast}/>}
        {tab === 'Préférences' && <TabPrefsContent      addToast={addToast}/>}
      </div>
      <ToastStack toasts={toasts}/>
    </div>
  );
}
