'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown } from '@/components/admin/atoms';
import { JOURNAL_DISTRICT } from '@/components/admin/dataDistrict';

const C = '#9B72CF';

interface Toast { id:number; type:'info'; title:string; body?:string; }
function useToast() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const add = (t: Omit<Toast,'id'>) => { const id=Date.now(); setToasts(p=>[...p,{...t,id}]); setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),4000); };
  return { toasts, add };
}
function ToastStack({ toasts }: { toasts: Toast[] }) {
  return <div className="toast-stack">{toasts.map(t=><div key={t.id} className={`toast ${t.type}`}><div style={{fontWeight:600,fontSize:13}}>{t.title}</div>{t.body&&<div style={{fontSize:12,color:'var(--text-2)',marginTop:2}}>{t.body}</div>}</div>)}</div>;
}

const ACTION_PILL: Record<string,{bg:string;color:string}> = {
  'Modification': { bg:'rgba(230,81,0,0.12)',   color:'#E65100' },
  'Création':     { bg:'rgba(46,151,68,0.12)',   color:'#5AC472' },
  'Import':       { bg:'rgba(106,27,154,0.12)',  color:'#B377D9' },
  'Export':       { bg:'rgba(148,163,184,0.12)', color:'#94A3B8' },
  'Connexion':    { bg:`rgba(155,114,207,0.12)`, color:C },
  'Suppression':  { bg:'rgba(198,40,40,0.12)',   color:'#FF6B6B' },
};

export default function JournalDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [period, setPeriod] = React.useState('7j');
  const [actionFilter, setActionFilter] = React.useState('Toutes actions');
  const [userFilter, setUserFilter] = React.useState('Tous utilisateurs');
  const [expanded, setExpanded] = React.useState<number|null>(null);

  const actions = ['Toutes actions','Modification','Création','Import','Export','Connexion'];
  const users = ['Tous utilisateurs', ...Array.from(new Set(JOURNAL_DISTRICT.map(e => e.who)))];

  let data = [...JOURNAL_DISTRICT];
  if (actionFilter !== 'Toutes actions') data = data.filter(e => e.action === actionFilter);
  if (userFilter !== 'Tous utilisateurs') data = data.filter(e => e.who === userFilter);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:`rgba(155,114,207,0.06)`, border:`1px solid rgba(155,114,207,0.20)`, borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(155,114,207,0.85)', display:'flex', alignItems:'center', gap:8 }}>
        <I.shield size={13}/>
        Le journal est filtré à votre district Bafoussam Centre. Seules les actions de vos administrateurs sont visibles.
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="seg">
            <button className={period==='24h' ? 'on' : ''} onClick={()=>setPeriod('24h')}>24h</button>
            <button className={period==='7j' ? 'on' : ''} onClick={()=>setPeriod('7j')}>7 jours</button>
            <button className={period==='30j' ? 'on' : ''} onClick={()=>setPeriod('30j')}>30 jours</button>
          </div>
          <Dropdown value={actionFilter} options={actions} onChange={setActionFilter} width={180}/>
          <Dropdown value={userFilter} options={users} onChange={setUserFilter} width={200}/>
        </div>
        <button className="btn btn-outline" onClick={()=>addToast({type:'info',title:'Export journal…',body:'Journal district → .xlsx'})}><I.download size={13}/>Exporter</button>
      </div>

      <div style={{ fontSize:12, color:'var(--text-3)' }}>
        <b style={{ color:'var(--text)' }}>{data.length}</b> entrée{data.length > 1 ? 's' : ''} trouvée{data.length > 1 ? 's' : ''}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table className="data">
          <thead>
            <tr><th style={{width:140}}>Date & heure</th><th>Utilisateur</th><th>Action</th><th>Entité</th><th>Résumé</th><th style={{width:40}}></th></tr>
          </thead>
          <tbody>
            {data.map((e,i) => {
              const pill = ACTION_PILL[e.action] || { bg:'rgba(255,255,255,0.06)', color:'var(--text-2)' };
              const isExp = expanded === i;
              return (
                <React.Fragment key={i}>
                  <tr>
                    <td className="mono" style={{ fontSize:12, color:'var(--text-2)' }}>{e.time}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:26, height:26, borderRadius:'50%', background:e.color+'22', color:e.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>
                          {e.who.split(' ').map((w:string)=>w[0]).join('').slice(0,2)}
                        </div>
                        <span style={{ fontSize:13, fontWeight:500 }}>{e.who}</span>
                      </div>
                    </td>
                    <td><span style={{ padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:pill.bg, color:pill.color }}>{e.action}</span></td>
                    <td style={{ fontSize:13, fontWeight:500 }}>{e.entity}</td>
                    <td style={{ fontSize:12, color:'var(--text-2)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.summary}</td>
                    <td>
                      <button className="icon-btn" onClick={()=>setExpanded(isExp?null:i)} style={{ transform:isExp?'rotate(90deg)':'none', transition:'transform 200ms ease' }}>
                        <I.chevR size={14}/>
                      </button>
                    </td>
                  </tr>
                  {isExp && (
                    <tr>
                      <td colSpan={6} style={{ padding:0 }}>
                        <div style={{ background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.04)', padding:'14px 20px 14px 60px', display:'flex', gap:24, fontSize:12 }}>
                          <div>
                            <div style={{ color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:10, marginBottom:4 }}>Détails</div>
                            <div style={{ color:'var(--text-2)' }}>{e.summary}</div>
                          </div>
                          <div>
                            <div style={{ color:'var(--text-3)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', fontSize:10, marginBottom:4 }}>Date & heure</div>
                            <div className="mono" style={{ color:'var(--text-2)' }}>{e.time}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {data.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:48, color:'var(--text-3)' }}>Aucune entrée trouvée</td></tr>}
          </tbody>
        </table>
      </div>
      <ToastStack toasts={toasts}/>
    </div>
  );
}
