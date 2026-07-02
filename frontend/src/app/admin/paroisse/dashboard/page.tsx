'use client';
import dynamic from 'next/dynamic';
import { CompleteBar, LineChart } from '@/components/admin/atoms';
import { MOCK_PAROISSE, OUVRIERS_PAROISSE, OEUVRES_PAROISSE, STATS_ANNUELLES_PAROISSE } from '@/components/admin/dataParoisse';

const C = '#E67A2E';

const MiniLeafletMap = dynamic(() => import('@/components/admin/MiniLeafletMap'), { ssr: false });

function StatCard({ label, value, sub, color = C }: { label:string; value:string|number; sub?:string; color?:string }) {
  return (
    <div className="card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:10 }}>
      <span style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>
      <div className="sg" style={{ fontSize:32, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardParoissePage() {
  const fidEvol = STATS_ANNUELLES_PAROISSE.map(e => ({ year: e.annee, comm: e.communiants, noncomm: e.noncomm }));
  const lastYear = STATS_ANNUELLES_PAROISSE[STATS_ANNUELLES_PAROISSE.length - 1];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Row 1 — 4 KPI */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12 }}>
        <StatCard label="Fidèles"     value={MOCK_PAROISSE.totalFideles.toLocaleString('fr')} sub="total communiants + non-comm." color={C}/>
        <StatCard label="Communiants" value={MOCK_PAROISSE.communiants}  sub={`Non-comm. : ${MOCK_PAROISSE.nonCommuniants}`} color="#5AC472"/>
        <StatCard label="Ouvriers"    value={OUVRIERS_PAROISSE.length}   sub="dans cette paroisse"  color="#9B72CF"/>
        <StatCard label="Œuvres"      value={OEUVRES_PAROISSE.length}    sub="liées à la paroisse"  color="#5B9BD5"/>
      </div>

      {/* Row 2 — Info card + Mini carte */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div className="card" style={{ padding:'18px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Informations générales</div>
          {[
            { label:'Catégorie',   value:MOCK_PAROISSE.categorie },
            { label:'District', value:MOCK_PAROISSE.district },
            { label:'Région',   value:MOCK_PAROISSE.region },
            { label:'Pasteur',  value:MOCK_PAROISSE.pasteur },
            { label:'Adresse',  value:MOCK_PAROISSE.adresse },
            { label:'Contact',  value:MOCK_PAROISSE.contact },
          ].map(r => (
            <div key={r.label} style={{ display:'flex', justifyContent:'space-between', fontSize:13, borderBottom:'1px solid rgba(255,255,255,0.04)', paddingBottom:8 }}>
              <span style={{ color:'var(--text-3)', fontWeight:500 }}>{r.label}</span>
              <span style={{ color:'var(--text)', textAlign:'right', maxWidth:'60%' }}>{r.value}</span>
            </div>
          ))}
          <div>
            <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:6, fontWeight:500 }}>Complétion de fiche — {MOCK_PAROISSE.complete}%</div>
            <CompleteBar pct={MOCK_PAROISSE.complete}/>
          </div>
        </div>
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <MiniLeafletMap height={380}/>
          <div style={{ padding:'8px 14px', fontSize:11, color:'var(--text-3)', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ color:'#5AC472' }}>●</span> GPS actif — {MOCK_PAROISSE.lat.toFixed(4)}, {MOCK_PAROISSE.lng.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Row 3 — Évolution + Statistiques vitales */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
        <div className="card" style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:12 }}>Évolution des fidèles (2020–2025)</div>
          <LineChart data={fidEvol}/>
        </div>
        <div className="card" style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:12, color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Année 2025</div>
          {[
            { label:'Baptêmes',  value:lastYear.baptemes,  color:'#5B9BD5', emoji:'💧' },
            { label:'Mariages',  value:lastYear.mariages,   color:'#5AC472', emoji:'💍' },
            { label:'Décès',     value:lastYear.deces,      color:'#94A3B8', emoji:'✝' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:36, height:36, borderRadius:8, background:s.color+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600 }}>{s.label}</div>
                <div className="sg-md" style={{ fontSize:22, color:s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 4 — Ouvriers */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div className="sg-md" style={{ fontSize:14 }}>Ouvriers de la paroisse</div>
          <a href="/admin/paroisse/ouvriers" style={{ fontSize:12, color:C, textDecoration:'none' }}>Voir tous →</a>
        </div>
        <table className="data">
          <thead>
            <tr><th>Ouvrier</th><th>Grade</th><th>Téléphone</th><th>En poste depuis</th></tr>
          </thead>
          <tbody>
            {OUVRIERS_PAROISSE.map(o => (
              <tr key={o.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:o.color+'22', color:o.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{o.initials}</div>
                    <span style={{ fontWeight:500 }}>{o.nom}</span>
                  </div>
                </td>
                <td><span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600, background:o.color+'18', color:o.color }}>{o.grade}</span></td>
                <td className="mono" style={{ fontSize:11 }}>{o.tel}</td>
                <td style={{ fontSize:12, color:'var(--text-3)' }}>{new Date(o.priseFonction).toLocaleDateString('fr-FR',{year:'numeric',month:'long'})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
