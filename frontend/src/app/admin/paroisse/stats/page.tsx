'use client';
import React from 'react';
import { LineChart } from '@/components/admin/atoms';
import { STATS_ANNUELLES_PAROISSE } from '@/components/admin/dataParoisse';

const C = '#E67A2E';

const VIEWS = ['Tableau annuel', 'Graphiques'] as const;
type View = typeof VIEWS[number];

function delta(curr: number, prev: number) {
  if (!prev) return null;
  const d = Math.round((curr - prev) / prev * 100);
  return d;
}

function DeltaBadge({ d }: { d: number | null }) {
  if (d === null) return <span style={{ color:'var(--text-3)', fontSize:11 }}>—</span>;
  const up = d >= 0;
  return <span style={{ fontSize:11, fontWeight:600, color: up ? '#5AC472' : '#FF8A7A' }}>{up ? '+' : ''}{d}%</span>;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max ? Math.round(value / max * 100) : 0;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,0.07)' }}>
        <div style={{ width:`${pct}%`, height:'100%', borderRadius:2, background:color }}/>
      </div>
      <span className="mono" style={{ fontSize:12, minWidth:30, textAlign:'right' }}>{value}</span>
    </div>
  );
}

export default function StatsParoissePage() {
  const [view, setView] = React.useState<View>('Tableau annuel');
  const data = STATS_ANNUELLES_PAROISSE;

  const maxComm    = Math.max(...data.map(d => d.communiants));
  const maxBapteme = Math.max(...data.map(d => d.baptemes));
  const maxMariage = Math.max(...data.map(d => d.mariages));
  const maxDeces   = Math.max(...data.map(d => d.deces));

  const lineData = data.map(d => ({ year: d.annee, comm: d.communiants, noncomm: d.noncomm }));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4 }}>
        {VIEWS.map(v => (
          <button key={v} className={`btn${view===v?'':' btn-ghost'}`}
            style={view===v ? { background:C, color:'#fff', border:`1px solid ${C}` } : {}}
            onClick={()=>setView(v)}>{v}</button>
        ))}
      </div>

      {view === 'Tableau annuel' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>
            Statistiques annuelles — Bafoussam-Centre
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Année</th>
                <th style={{textAlign:'right'}}>Communiants</th>
                <th></th>
                <th style={{textAlign:'right'}}>Non-comm.</th>
                <th></th>
                <th style={{textAlign:'right'}}>Baptêmes</th>
                <th style={{textAlign:'right'}}>Mariages</th>
                <th style={{textAlign:'right'}}>Décès</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => {
                const prev = data[i - 1];
                return (
                  <tr key={row.annee} style={i === data.length - 1 ? { background:'rgba(230,122,46,0.06)' } : {}}>
                    <td><span className="mono" style={{ fontWeight: i===data.length-1?700:400, color:i===data.length-1?C:'var(--text)' }}>{row.annee}</span></td>
                    <td className="mono" style={{ textAlign:'right', fontWeight:600 }}>{row.communiants.toLocaleString('fr')}</td>
                    <td><DeltaBadge d={delta(row.communiants, prev?.communiants)}/></td>
                    <td className="mono" style={{ textAlign:'right', color:'var(--text-2)' }}>{row.noncomm.toLocaleString('fr')}</td>
                    <td><DeltaBadge d={delta(row.noncomm, prev?.noncomm)}/></td>
                    <td className="mono" style={{ textAlign:'right', color:'#5B9BD5' }}>{row.baptemes}</td>
                    <td className="mono" style={{ textAlign:'right', color:'#5AC472' }}>{row.mariages}</td>
                    <td className="mono" style={{ textAlign:'right', color:'#94A3B8' }}>{row.deces}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {view === 'Graphiques' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* LineChart évolution fidèles */}
          <div className="card" style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>
              Évolution des fidèles (2020–2025)
            </div>
            <LineChart data={lineData}/>
          </div>

          {/* Bars actes */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
            {[
              { label:'Baptêmes', max:maxBapteme, color:'#5B9BD5', key:'baptemes' as const },
              { label:'Mariages', max:maxMariage, color:'#5AC472', key:'mariages' as const },
              { label:'Décès',    max:maxDeces,   color:'#94A3B8', key:'deces'    as const },
            ].map(({ label, max, color, key }) => (
              <div key={key} className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</div>
                {data.map(row => (
                  <div key={row.annee}>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:4 }}>{row.annee}</div>
                    <MiniBar value={row[key]} max={max} color={color}/>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Communiants bar */}
          <div className="card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Communiants par année</div>
            {data.map(row => (
              <div key={row.annee} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                <div style={{ width:36, fontSize:11, color:'var(--text-3)', flexShrink:0 }}>{row.annee}</div>
                <div style={{ flex:1, height:8, borderRadius:4, background:'rgba(255,255,255,0.06)' }}>
                  <div style={{ width:`${Math.round(row.communiants/maxComm*100)}%`, height:'100%', borderRadius:4, background:C }}/>
                </div>
                <span className="mono" style={{ fontSize:12, minWidth:40, textAlign:'right', color:C, fontWeight:600 }}>{row.communiants}</span>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
