'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { CompleteBar, LineChart } from '@/components/admin/atoms';
import { STATS_PAROISSES_DISTRICT, FIDELES_EVOLUTION_DISTRICT, MOCK_DISTRICT } from '@/components/admin/dataDistrict';

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

export default function StatsDistrictPage() {
  const { toasts, add: addToast } = useToast();
  const [vue, setVue] = React.useState<'paroisses'|'evolution'>('paroisses');

  const totaux = { communiants: STATS_PAROISSES_DISTRICT.reduce((a,p)=>a+p.communiants,0), noncomm: STATS_PAROISSES_DISTRICT.reduce((a,p)=>a+p.noncomm,0), total: STATS_PAROISSES_DISTRICT.reduce((a,p)=>a+p.total,0), ouvriers: STATS_PAROISSES_DISTRICT.reduce((a,p)=>a+p.ouvriers,0) };

  const evolData = FIDELES_EVOLUTION_DISTRICT.map(e => ({ year: e.year, comm: e.comm, noncomm: e.noncomm }));
  const evolAvecDelta = FIDELES_EVOLUTION_DISTRICT.map((e,i,arr) => {
    const prev = arr[i-1];
    const delta = prev ? Math.round(((e.comm+e.noncomm)-(prev.comm+prev.noncomm))/(prev.comm+prev.noncomm)*100) : null;
    return { ...e, total: e.comm+e.noncomm, delta };
  });

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div className="seg">
            <button className={vue==='paroisses' ? 'on' : ''} onClick={()=>setVue('paroisses')}>Par paroisse</button>
            <button className={vue==='evolution' ? 'on' : ''} onClick={()=>setVue('evolution')}>Évolution</button>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export PDF…', body:'Statistiques district Bafoussam Centre' })}><I.download size={13}/>PDF</button>
          <button className="btn btn-outline" onClick={() => addToast({ type:'info', title:'Export Excel…', body:'Statistiques district Bafoussam Centre' })}><I.download size={13}/>Excel</button>
        </div>
      </div>

      {vue === 'paroisses' && (
        <>
          <div style={{ background:`rgba(155,114,207,0.06)`, border:`1px solid rgba(155,114,207,0.20)`, borderRadius:6, padding:'10px 14px', fontSize:12, color:'rgba(155,114,207,0.85)', display:'flex', alignItems:'center', gap:8 }}>
            <I.shield size={13}/>Statistiques filtrées au district Bafoussam Centre · {STATS_PAROISSES_DISTRICT.length} paroisses
          </div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Paroisse</th><th>Niveau</th>
                  <th style={{textAlign:'right'}}>Communiants</th><th style={{textAlign:'right'}}>Non-comm.</th>
                  <th style={{textAlign:'right'}}>Total fidèles</th><th style={{textAlign:'right'}}>Ouvriers</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {STATS_PAROISSES_DISTRICT.map((p,i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:500 }}>{p.paroisse}</td>
                    <td><span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600,
                      background: p.niveau==='PAROISSE' ? 'rgba(90,196,114,0.12)' : p.niveau==='STATION' ? `rgba(155,114,207,0.12)` : 'rgba(230,122,46,0.12)',
                      color: p.niveau==='PAROISSE' ? '#5AC472' : p.niveau==='STATION' ? C : '#E67A2E',
                    }}>{p.niveau}</span></td>
                    <td className="mono" style={{textAlign:'right'}}>{p.communiants.toLocaleString('fr')}</td>
                    <td className="mono" style={{textAlign:'right', color:'var(--text-3)'}}>{p.noncomm.toLocaleString('fr')}</td>
                    <td className="mono" style={{textAlign:'right', fontWeight:600}}>{p.total.toLocaleString('fr')}</td>
                    <td className="mono" style={{textAlign:'right'}}>{p.ouvriers}</td>
                    <td style={{width:120}}><CompleteBar pct={p.score}/></td>
                  </tr>
                ))}
                {/* Totaux */}
                <tr style={{ background:`rgba(155,114,207,0.06)`, borderTop:`2px solid rgba(155,114,207,0.25)` }}>
                  <td style={{ fontWeight:700, color:C }}>TOTAL DISTRICT</td>
                  <td></td>
                  <td className="mono" style={{textAlign:'right', fontWeight:700, color:C}}>{totaux.communiants.toLocaleString('fr')}</td>
                  <td className="mono" style={{textAlign:'right', fontWeight:700, color:C}}>{totaux.noncomm.toLocaleString('fr')}</td>
                  <td className="mono" style={{textAlign:'right', fontWeight:700, color:C}}>{totaux.total.toLocaleString('fr')}</td>
                  <td className="mono" style={{textAlign:'right', fontWeight:700, color:C}}>{totaux.ouvriers}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}

      {vue === 'evolution' && (
        <>
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:16 }}>Évolution des fidèles — District Bafoussam Centre (2020–2025)</div>
            <LineChart data={evolData} />
          </div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <table className="data">
              <thead>
                <tr><th>Année</th><th style={{textAlign:'right'}}>Communiants</th><th style={{textAlign:'right'}}>Non-comm.</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Évolution</th><th style={{textAlign:'right'}}>Baptêmes</th><th style={{textAlign:'right'}}>Mariages</th></tr>
              </thead>
              <tbody>
                {evolAvecDelta.map((e,i) => (
                  <tr key={i}>
                    <td className="mono" style={{ fontWeight:600 }}>{e.year}</td>
                    <td className="mono" style={{textAlign:'right'}}>{e.comm.toLocaleString('fr')}</td>
                    <td className="mono" style={{textAlign:'right', color:'var(--text-3)'}}>{e.noncomm.toLocaleString('fr')}</td>
                    <td className="mono" style={{textAlign:'right', fontWeight:600}}>{e.total.toLocaleString('fr')}</td>
                    <td style={{textAlign:'right'}}>
                      {e.delta !== null && (
                        <span style={{ fontSize:11, padding:'2px 6px', borderRadius:4, fontWeight:600,
                          background: e.delta >= 0 ? 'rgba(90,196,114,0.12)' : 'rgba(255,107,107,0.12)',
                          color: e.delta >= 0 ? '#5AC472' : '#FF6B6B' }}>
                          {e.delta >= 0 ? '+' : ''}{e.delta}%
                        </span>
                      )}
                    </td>
                    <td className="mono" style={{textAlign:'right', color:'var(--text-3)'}}>{i === 5 ? MOCK_DISTRICT.baptemes : '—'}</td>
                    <td className="mono" style={{textAlign:'right', color:'var(--text-3)'}}>{i === 5 ? MOCK_DISTRICT.mariages : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <ToastStack toasts={toasts}/>
    </div>
  );
}
