'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, useOutside } from '@/components/admin/atoms';
import { COMPTES_DISTRICT, PAROISSES_DISTRICT } from '@/components/admin/dataDistrict';

const C = '#9B72CF';

interface Toast { id:number; type:'success'|'info'|'warn'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

function AccountMenu({ compte, onView, onReset, onDisable }: { compte: any; onView:()=>void; onReset:()=>void; onDisable:()=>void }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  if (compte.readonly) return null;
  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block' }}>
      <button className="icon-btn" onClick={()=>setOpen(o=>!o)}><I.more size={15}/></button>
      {open && (
        <div className="menu" style={{ top:'calc(100% + 4px)', right:0, minWidth:200 }}>
          <button onClick={()=>{setOpen(false);onView();}}><I.eye size={13}/>Voir le profil</button>
          <button onClick={()=>{setOpen(false);onReset();}}><I.shield size={13}/>Réinitialiser MDP</button>
          <button onClick={()=>{setOpen(false);onDisable();}} style={{ color:'#FF8A7A' }}><I.x size={13}/>Désactiver le compte</button>
        </div>
      )}
    </div>
  );
}

function InviteDistrictPanel({ onClose, onInvite }: { onClose:()=>void; onInvite:()=>void }) {
  const [step, setStep] = React.useState(1);
  const [prenom, setPrenom] = React.useState('');
  const [nom, setNom] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [tel, setTel] = React.useState('');
  const [paroisse, setParoisse] = React.useState(PAROISSES_DISTRICT[0].nom);
  const [mdp] = React.useState('EEC-' + Math.random().toString(36).slice(2,8).toUpperCase());

  return (
    <div className="overlay" onClick={onClose}>
      <div className="slide-panel" style={{ width:500 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <div>
            <h2 className="sg-md" style={{ fontSize:15, margin:0 }}>Inviter un Admin Paroisse</h2>
            <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>Étape {step} / 2</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
        </div>
        {/* Progress */}
        <div style={{ display:'flex', height:3 }}>
          <div style={{ flex:1, background: step >= 1 ? C : 'rgba(255,255,255,0.08)', transition:'background 200ms' }}/>
          <div style={{ flex:1, background: step >= 2 ? C : 'rgba(255,255,255,0.08)', transition:'background 200ms' }}/>
        </div>

        <div style={{ padding:'20px 22px', overflowY:'auto', height:'calc(100% - 150px)', display:'flex', flexDirection:'column', gap:14 }}>
          {step === 1 && (
            <>
              <div style={{ fontSize:12, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Identité</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>PRÉNOM *</label>
                  <input className="input" value={prenom} onChange={e=>setPrenom(e.target.value)} placeholder="Prénom" style={{ width:'100%' }}/>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>NOM *</label>
                  <input className="input" value={nom} onChange={e=>setNom(e.target.value)} placeholder="NOM" style={{ width:'100%' }}/>
                </div>
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>EMAIL *</label>
                <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom.nom@eec.cm" style={{ width:'100%' }}/>
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, display:'block', marginBottom:4 }}>TÉLÉPHONE</label>
                <input className="input" value={tel} onChange={e=>setTel(e.target.value)} placeholder="+237 6xx xx xx xx" style={{ width:'100%' }}/>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize:12, color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Portée & Accès</div>
              <div>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>RÔLE</div>
                <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
                  <I.shield size={12}/> Admin Paroisse — seul rôle possible
                </div>
              </div>
              <div>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>DISTRICT</div>
                <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border)', fontSize:13, color:'var(--text-3)', display:'flex', alignItems:'center', gap:8 }}>
                  <I.shield size={12}/> Bafoussam Centre — scopé
                </div>
              </div>
              <Dropdown label="PAROISSE D'AFFECTATION *" value={paroisse} options={PAROISSES_DISTRICT.map(p=>p.nom)} onChange={setParoisse}/>
              <div>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, marginBottom:4 }}>MOT DE PASSE TEMPORAIRE</div>
                <div style={{ padding:'9px 12px', borderRadius:6, background:'rgba(155,114,207,0.08)', border:`1px solid rgba(155,114,207,0.25)`, fontSize:13, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span className="mono" style={{ color:C, fontWeight:600 }}>{mdp}</span>
                  <span style={{ fontSize:10, color:'var(--text-3)' }}>À changer à la 1ère connexion</span>
                </div>
              </div>
              <div style={{ background:'rgba(255,193,7,0.06)', border:'1px solid rgba(255,193,7,0.20)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(255,193,7,0.85)' }}>
                <I.shield size={12}/> L'invitation sera envoyée par email. La paroisse assignée sera {paroisse}.
              </div>
            </>
          )}
        </div>

        <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'space-between' }}>
          {step === 1 ? <button className="btn btn-ghost" onClick={onClose}>Annuler</button> : <button className="btn btn-ghost" onClick={()=>setStep(1)}>← Retour</button>}
          {step === 1
            ? <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={()=>setStep(2)} disabled={!prenom||!nom||!email}>Suivant →</button>
            : <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={onInvite}><I.check size={14}/>Envoyer l'invitation</button>}
        </div>
      </div>
    </div>
  );
}

export default function ComptesDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [showInvite, setShowInvite] = React.useState(false);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Info banner */}
      <div style={{ background:`rgba(155,114,207,0.06)`, border:`1px solid rgba(155,114,207,0.20)`, borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(155,114,207,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={13}/>
        Vous gérez les comptes Admin Paroisse de votre district. Vous ne pouvez pas créer d'autres Admin District.
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontSize:12, color:'var(--text-3)' }}>
          <b style={{ color:'var(--text)' }}>{COMPTES_DISTRICT.length}</b> compte{COMPTES_DISTRICT.length > 1 ? 's' : ''} dans ce district
        </div>
        <button className="btn" style={{ background:C, color:'#fff', border:`1px solid ${C}` }} onClick={() => setShowInvite(true)}>
          <I.plus size={14}/>Inviter un admin
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead>
            <tr><th>Utilisateur</th><th>Rôle</th><th>Portée</th><th>2FA</th><th>Dernière connexion</th><th>Statut</th><th style={{width:40}}></th></tr>
          </thead>
          <tbody>
            {COMPTES_DISTRICT.map((c,i) => (
              <tr key={i}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:30, height:30, borderRadius:'50%', background:c.bg, color:c.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{c.initials}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{c.nom}</div>
                      <div style={{ fontSize:11, color:'var(--text-3)' }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:c.color+'18', color:c.color }}>{c.role}</span></td>
                <td style={{ fontSize:12, color:'var(--text-2)' }}>{c.portee}</td>
                <td><span style={{ fontSize:11 }}>{c.tfa ? '✅ Actif' : '—'}</span></td>
                <td style={{ fontSize:12, color:'var(--text-3)' }}>{c.last}</td>
                <td><div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background: c.statut==='actif' ? '#5AC472' : '#FF8A7A' }}/>
                  <span style={{ fontSize:12, textTransform:'capitalize', color:'var(--text-2)' }}>{c.statut}</span>
                </div></td>
                <td>
                  <AccountMenu compte={c}
                    onView={() => addToast({ type:'info', title:`Profil — ${c.nom}` })}
                    onReset={() => addToast({ type:'warn', title:'MDP réinitialisé', body:`Email envoyé à ${c.email}` })}
                    onDisable={() => addToast({ type:'warn', title:'Compte désactivé', body:c.nom })}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showInvite && <InviteDistrictPanel onClose={() => setShowInvite(false)}
        onInvite={() => { setShowInvite(false); addToast({ type:'success', title:'Invitation envoyée', body:'Email d\'invitation transmis à l\'adresse indiquée' }); }}/>}
      <ToastStack toasts={toasts}/>
    </div>
  );
}
