'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Avatar, Dropdown } from '@/components/admin/atoms';

const C = '#9B72CF';

interface Toast { id:number; type:'success'|'warn'|'info'|'error'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

export default function ParametresDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [tab, setTab] = React.useState('profil');
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div className="tabs-bar">
        {[{k:'profil',l:'Profil'},{k:'security',l:'Sécurité'},{k:'tfa',l:'2FA'},{k:'sessions',l:'Sessions actives'},{k:'prefs',l:'Préférences'}].map(t=>(
          <button key={t.k} className={'tab'+(tab===t.k?' active':'')} onClick={()=>setTab(t.k)}>{t.l}</button>
        ))}
      </div>
      {tab === 'profil'    && <PrefProfil />}
      {tab === 'security'  && <PrefSecurity onAddToast={addToast}/>}
      {tab === 'tfa'       && <PrefTFA />}
      {tab === 'sessions'  && <PrefSessions />}
      {tab === 'prefs'     && <PrefPrefs />}
      <ToastStack toasts={toasts}/>
    </div>
  );
}

function PrefProfil() {
  return (
    <div className="anim-in card" style={{ padding:24, maxWidth:720, display:'flex', flexDirection:'column', gap:18 }}>
      <h3 className="sg" style={{ fontSize:18, margin:0 }}>Profil — Admin District Bafoussam Centre</h3>
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <Avatar initials="DA" size={72} bg={`rgba(155,114,207,0.20)`} color={C} ringColor={`rgba(155,114,207,0.50)`} />
        <div>
          <button className="btn btn-outline" style={{ marginBottom:6 }}>Changer la photo</button>
          <div style={{ fontSize:11, color:'var(--text-3)' }}>JPG ou PNG, 2 Mo max.</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div><div className="label">Nom complet</div><input className="input" defaultValue="Daniel AWONO"/></div>
        <div><div className="label">Email</div><input className="input" defaultValue="d.awono@eec.cm"/></div>
        <div><div className="label">Téléphone</div><input className="input" defaultValue="+237 695 44 55 66"/></div>
        <div>
          <div className="label">Rôle & portée</div>
          <div style={{ display:'flex', gap:6, paddingTop:10, flexWrap:'wrap' }}>
            <span className="pill" style={{ background:`rgba(155,114,207,0.18)`, color:C, borderColor:`rgba(155,114,207,0.35)` }}>Admin District</span>
            <span className="pill" style={{ fontSize:11 }}>District Bafoussam Centre</span>
            <span className="pill" style={{ fontSize:11, color:'var(--text-3)' }}>Région MIFI</span>
          </div>
        </div>
      </div>
      <button className="btn btn-primary" style={{ alignSelf:'flex-start' }}>Sauvegarder les modifications</button>
    </div>
  );
}

function PrefSecurity({ onAddToast }: { onAddToast: (t: any) => void }) {
  const [pw, setPw] = React.useState('');
  const strength = [pw.length>=12, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)];
  const score = strength.filter(Boolean).length;
  const colors = ['#C62828','#E65100','#5AC472','#1F8A3D'];
  const labels = ['Faible','Moyen','Fort','Très fort'];
  return (
    <div className="anim-in card" style={{ padding:24, maxWidth:640, display:'flex', flexDirection:'column', gap:18 }}>
      <h3 className="sg" style={{ fontSize:18, margin:0 }}>Changement de mot de passe</h3>
      <div><div className="label">Mot de passe actuel</div><input className="input" type="password" placeholder="••••••••••"/></div>
      <div>
        <div className="label">Nouveau mot de passe</div>
        <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••••"/>
        {pw && (
          <>
            <div style={{ display:'flex', gap:3, marginTop:8 }}>
              {[0,1,2,3].map(i=><div key={i} style={{ flex:1, height:4, borderRadius:2, background: i<score ? colors[score-1] : 'rgba(255,255,255,0.08)' }}/>)}
            </div>
            <div style={{ fontSize:11, color:colors[Math.max(0,score-1)], marginTop:4 }}>{labels[Math.max(0,score-1)]}</div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginTop:10, fontSize:11.5 }}>
              {[['12 caractères minimum',strength[0]],['Au moins une majuscule',strength[1]],['Au moins un chiffre',strength[2]],['Au moins un caractère spécial',strength[3]]].map((r,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, color: r[1] ? '#5AC472' : 'var(--text-3)' }}>
                  {r[1] ? <I.check size={11}/> : <I.x size={11}/>} {r[0] as string}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div><div className="label">Confirmer le nouveau mot de passe</div><input className="input" type="password" placeholder="••••••••••"/></div>
      <button className="btn btn-primary" style={{ alignSelf:'flex-start' }} onClick={()=>onAddToast({type:'success',title:'Mot de passe modifié.'})}>Mettre à jour</button>
    </div>
  );
}

function PrefTFA() {
  return (
    <div className="anim-in card" style={{ padding:24, maxWidth:720, display:'flex', flexDirection:'column', gap:18 }}>
      <h3 className="sg" style={{ fontSize:18, margin:0 }}>Authentification à deux facteurs (2FA)</h3>
      <div style={{ background:`rgba(155,114,207,0.10)`, border:`1px solid rgba(155,114,207,0.30)`, borderRadius:6, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
        <I.shield size={16} style={{ color:C }}/>
        <span style={{ fontSize:13, color:C, fontWeight:600 }}>2FA non activée</span>
        <button className="btn btn-primary" style={{ marginLeft:'auto', padding:'6px 12px', fontSize:12 }}>Activer la 2FA</button>
      </div>
      <div style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6 }}>
        La double authentification renforce la sécurité de votre compte Admin District Bafoussam Centre.
      </div>
      <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>
        <div style={{ width:160, height:160, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:8, padding:12 }}>
          <svg width="136" height="136" viewBox="0 0 32 32">
            {Array.from({length:32}).map((_,y)=>Array.from({length:32}).map((_,x)=>{
              const seed=(x*31+y*17+x*y)%7;
              if((x<7&&y<7)||(x>24&&y<7)||(x<7&&y>24))return null;
              return seed<3?<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#0D1B12"/>:null;
            }))}
            <rect x="0" y="0" width="7" height="7" fill="none" stroke="#0D1B12" strokeWidth="1"/>
            <rect x="2" y="2" width="3" height="3" fill="#0D1B12"/>
            <rect x="25" y="0" width="7" height="7" fill="none" stroke="#0D1B12" strokeWidth="1"/>
            <rect x="27" y="2" width="3" height="3" fill="#0D1B12"/>
            <rect x="0" y="25" width="7" height="7" fill="none" stroke="#0D1B12" strokeWidth="1"/>
            <rect x="2" y="27" width="3" height="3" fill="#0D1B12"/>
          </svg>
        </div>
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:13, color:'var(--text-2)' }}>Scannez ce QR code avec votre application 2FA.</div>
          <div className="code-chip" style={{ alignSelf:'flex-start' }}>KBSWY4DPFHPK4PYQ</div>
          <div className="label" style={{ marginTop:10 }}>Code à 6 chiffres</div>
          <input className="input mono" placeholder="123 456" style={{ width:160, fontSize:18, letterSpacing:'0.2em', textAlign:'center' }}/>
          <button className="btn btn-primary" style={{ alignSelf:'flex-start', marginTop:6 }}>Confirmer l'activation</button>
        </div>
      </div>
    </div>
  );
}

function PrefSessions() {
  return (
    <div className="anim-in" style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead><tr><th>Appareil</th><th>Navigateur</th><th>IP</th><th>Localisation</th><th>Dernière activité</th><th></th></tr></thead>
          <tbody>
            {[
              { device:'MacBook Air', browser:'Chrome 126', ip:'197.145.43.12', loc:'Bafoussam, Cameroun', last:'Maintenant', current:true },
            ].map((s,i)=>(
              <tr key={i}>
                <td><div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <I.monitor size={16} style={{ color:'var(--text-2)' }}/>
                  <div><div style={{ fontSize:13, fontWeight:500 }}>{s.device}</div>
                    {s.current && <span className="pill pill-green" style={{ marginTop:4, padding:'1px 7px' }}>Session actuelle</span>}
                  </div>
                </div></td>
                <td style={{ color:'var(--text-2)' }}>{s.browser}</td>
                <td className="mono" style={{ color:'var(--text-2)', fontSize:12 }}>{s.ip}</td>
                <td style={{ color:'var(--text-2)' }}>{s.loc}</td>
                <td style={{ color:'var(--text-2)' }}>{s.last}</td>
                <td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PrefPrefs() {
  const [theme, setTheme] = React.useState<'light'|'dark'|'auto'>('dark');
  const [dateFormat, setDateFormat] = React.useState<'fr'|'iso'>('fr');
  const [tz, setTz] = React.useState('Afrique/Douala (UTC+1)');
  const themes = [{k:'light',l:'Clair'},{k:'dark',l:'Sombre'},{k:'auto',l:'Automatique'}] as const;
  return (
    <div className="anim-in card" style={{ padding:24, maxWidth:720, display:'flex', flexDirection:'column', gap:22 }}>
      <div>
        <h4 className="sg" style={{ fontSize:15, margin:'0 0 14px' }}>Thème</h4>
        <div style={{ display:'flex', gap:12 }}>
          {themes.map(t=>(
            <button key={t.k} onClick={()=>setTheme(t.k)} style={{ flex:1, padding:'18px 12px', borderRadius:8, border:`2px solid ${theme===t.k ? C : 'var(--border)'}`, background: theme===t.k ? `rgba(155,114,207,0.08)` : 'transparent', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{t.k==='light'?'☀️':t.k==='dark'?'🌙':'🌗'}</span>
              <span style={{ fontSize:13, fontWeight:500, color: theme===t.k ? C : 'var(--text-2)' }}>{t.l}</span>
              {theme===t.k && <span style={{ width:8, height:8, borderRadius:'50%', background:C }}/>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="sg" style={{ fontSize:15, margin:'0 0 14px' }}>Format de date</h4>
        <div style={{ display:'flex', gap:8 }}>
          {[{k:'fr',l:'JJ/MM/AAAA'},{k:'iso',l:'AAAA-MM-JJ'}].map(f=>(
            <button key={f.k} onClick={()=>setDateFormat(f.k as any)} className="btn btn-outline" style={{ fontWeight: dateFormat===f.k ? 700 : 400, borderColor: dateFormat===f.k ? C : undefined, color: dateFormat===f.k ? C : undefined }}>{f.l}</button>
          ))}
        </div>
      </div>
      <div>
        <h4 className="sg" style={{ fontSize:15, margin:'0 0 14px' }}>Fuseau horaire</h4>
        <Dropdown value={tz} options={['Afrique/Douala (UTC+1)','UTC','Europe/Paris (UTC+2)']} onChange={setTz} width={260}/>
      </div>
      <div>
        <h4 className="sg" style={{ fontSize:15, margin:'0 0 12px' }}>Notifications par email</h4>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'Validations en attente dans mon district', defaultChecked:true },
            { label:'Imports terminés', defaultChecked:true },
            { label:'Rapport hebdomadaire Bafoussam Centre', defaultChecked:false },
            { label:'Résumé mensuel', defaultChecked:false },
          ].map((n,i)=>(
            <label key={i} style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
              <input type="checkbox" defaultChecked={n.defaultChecked} style={{ accentColor:C }}/>
              <span style={{ fontSize:13, color:'var(--text-2)' }}>{n.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
