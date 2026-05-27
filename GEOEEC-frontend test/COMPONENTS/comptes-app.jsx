// EEC GEO — Comptes & rôles page
const { useState, useEffect } = React;
const { Sidebar, Topbar, Logo, I } = window.DashboardCore;

const ROLES = {
  synode: { label: "Synode Général", desc: "Accès complet · pilotage national", color: "#F5C518" },
  region: { label: "Bureau Régional", desc: "Gestion d'une région synodale", color: "#2D9E55" },
  district: { label: "Bureau de District", desc: "Gestion d'un district paroissial", color: "#7FCB95" },
  paroisse: { label: "Paroissial", desc: "Mise à jour d'une paroisse", color: "#9CA89E" },
};

const COMPTES = [
  { id:1, ini:"JA", color:"#F5C518", name:"Pasteur ATABA Joël", titre:"Président du Synode Général", role:"synode", region:"Yaoundé", email:"j.ataba@eec.cm", last:"Il y a 2 min", status:"online" },
  { id:2, ini:"MA", color:"#2D9E55", name:"Pasteur MBOUNA André", titre:"Vice-Président", role:"synode", region:"Douala", email:"a.mbouna@eec.cm", last:"Il y a 18 min", status:"online" },
  { id:3, ini:"NE", color:"#3FB36A", name:"Pasteur Dr. NGAH Émile", titre:"Secrétaire Général", role:"synode", region:"Bafoussam", email:"e.ngah@eec.cm", last:"Il y a 1 h", status:"away" },
  { id:4, ini:"KE", color:"#E0A914", name:"Mme. KAMENI Esther", titre:"Trésorière Générale", role:"synode", region:"Dschang", email:"e.kameni@eec.cm", last:"Il y a 3 h", status:"online" },
  { id:5, ini:"TF", color:"#6FCB95", name:"Pasteur TIENTCHEU Félix", titre:"Bureau régional MIFI", role:"region", region:"Bafoussam", email:"f.tientcheu@eec.cm", last:"Il y a 4 h", status:"online" },
  { id:6, ini:"NM", color:"#54B97D", name:"Pasteur NJOYA Marc", titre:"Bureau régional MÉNOUA", role:"region", region:"Dschang", email:"m.njoya@eec.cm", last:"Hier, 19:14", status:"offline" },
  { id:7, ini:"FB", color:"#1F8A5B", name:"Mme. FOUDA Bernadette", titre:"Bureau régional CENTRE", role:"region", region:"Yaoundé", email:"b.fouda@eec.cm", last:"Hier, 17:02", status:"offline" },
  { id:8, ini:"DK", color:"#3FB36A", name:"Pasteur DJOUMESSI Kévin", titre:"Bureau régional LITTORAL", role:"region", region:"Douala", email:"k.djoumessi@eec.cm", last:"Hier, 14:30", status:"away" },
  { id:9, ini:"WS", color:"#7FCB95", name:"Pasteur WAMBA Samuel", titre:"District de Bafang Centre", role:"district", region:"Bafang", email:"s.wamba@eec.cm", last:"Hier, 11:18", status:"offline" },
  { id:10,ini:"KP", color:"#A8D4B8", name:"Mme. KENGNE Pauline", titre:"District de Mbouda", role:"district", region:"Mbouda", email:"p.kengne@eec.cm", last:"3 jours", status:"offline" },
  { id:11,ini:"OE", color:"#9CA89E", name:"Diacre OUMAROU Étienne", titre:"Paroisse de Bandjoun", role:"paroisse", region:"Bandjoun", email:"e.oumarou@eec.cm", last:"Il y a 6 h", status:"online" },
  { id:12,ini:"PD", color:"#9CA89E", name:"Mme. POUH David", titre:"Paroisse Foréké-Dschang", role:"paroisse", region:"Dschang", email:"d.pouh@eec.cm", last:"5 jours", status:"offline" },
];

function Drawer({ open, onClose }) {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('region');
  const [perms, setPerms] = useState({ edit:true, audit:true, export:true, delete:false, invite:true, finances:false });
  const steps = ["Identité", "Rôle & affectation", "Permissions"];
  return (
    <>
      <div className={`drawer-backdrop ${open?'open':''}`} onClick={onClose}/>
      <aside className={`drawer ${open?'open':''}`}>
        <div className="drawer-head">
          <div>
            <div className="meta">— NOUVEAU COMPTE</div>
            <h2>Inviter un <em>administrateur.</em></h2>
          </div>
          <button className="close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M6 18 18 6"/></svg>
          </button>
        </div>
        <div className="drawer-body">
          <div className="steps">
            {steps.map((s,i)=>(
              <div key={i} className={`step ${i===step?'active':i<step?'done':''}`} onClick={()=>setStep(i)}>
                <span className="num">0{i+1}</span>{s}
              </div>
            ))}
          </div>

          {step===0 && <>
            <div className="field-group">
              <div className="field"><label>Prénom <span className="req">*</span></label><input placeholder="Joël"/></div>
              <div className="field"><label>Nom <span className="req">*</span></label><input placeholder="ATABA"/></div>
            </div>
            <div className="field-group">
              <div className="field"><label>Titre / fonction</label><input placeholder="Pasteur, Diacre, Mme..."/></div>
              <div className="field"><label>Genre</label><select><option>Masculin</option><option>Féminin</option></select></div>
            </div>
            <div className="field-group full">
              <div className="field"><label>Email <span className="req">*</span></label><input type="email" placeholder="j.ataba@eec.cm"/><div className="hint">Une invitation lui sera envoyée à cette adresse.</div></div>
            </div>
            <div className="field-group">
              <div className="field"><label>Téléphone</label><input placeholder="+237 6 ..."/></div>
              <div className="field"><label>Date de naissance</label><input type="date"/></div>
            </div>
          </>}

          {step===1 && <>
            <div className="field-group full">
              <div className="field"><label>Niveau hiérarchique <span className="req">*</span></label></div>
            </div>
            <div className="role-picker">
              {Object.entries(ROLES).map(([k,r])=>(
                <div key={k} className={`role-tile ${role===k?'selected':''}`} onClick={()=>setRole(k)}>
                  <div className="check"/>
                  <div><h5 style={{color: r.color}}>{r.label}</h5><p>{r.desc}</p></div>
                </div>
              ))}
            </div>
            <div className="field-divider" data-label="Affectation"></div>
            {role==='region' && (
              <div className="field-group full">
                <div className="field"><label>Région synodale <span className="req">*</span></label>
                  <select><option>— Choisir une région —</option>{window.EEC_DATA.regions.map(r=><option key={r.code}>{r.name}</option>)}</select>
                </div>
              </div>
            )}
            {role==='district' && <div className="field-group"><div className="field"><label>Région</label><select>{window.EEC_DATA.regions.slice(0,8).map(r=><option key={r.code}>{r.name}</option>)}</select></div><div className="field"><label>District</label><select><option>Bafang Centre</option><option>Bandjoun</option><option>Mbouda</option></select></div></div>}
            {role==='paroisse' && <div className="field-group full"><div className="field"><label>Paroisse <span className="req">*</span></label><input placeholder="Rechercher par nom ou ID..."/></div></div>}
            {role==='synode' && <div className="field-group full"><div className="field"><label>Mandat</label><select><option>2023–2028</option><option>2028–2033</option></select></div></div>}
            <div className="field-group">
              <div className="field"><label>Date de prise de poste</label><input type="date"/></div>
              <div className="field"><label>Mandat (années)</label><input placeholder="5"/></div>
            </div>
          </>}

          {step===2 && <>
            <div className="field-group full"><div className="field"><label>Permissions accordées</label><div className="hint">Définissez les actions autorisées pour ce compte. Vous pourrez les modifier ultérieurement.</div></div></div>
            {Object.entries({
              edit:["Modifier les fiches paroisses","Coordonnées GPS, photos, statistiques."],
              audit:["Consulter le journal d'audit","Visualiser l'historique des modifications."],
              export:["Exporter des rapports","PDF, CSV, données synodales."],
              delete:["Supprimer des entités","Action irréversible — réservée."],
              invite:["Inviter des sous-administrateurs","Créer des comptes au niveau inférieur."],
              finances:["Accès aux données financières","Cotisations, dîmes, comptes paroissiaux."],
            }).map(([k,[t,d]])=>(
              <div key={k} className="perm-row">
                <div className="info"><b>{t}</b><small>{d}</small></div>
                <div className={`toggle ${perms[k]?'on':''}`} onClick={()=>setPerms({...perms,[k]:!perms[k]})}/>
              </div>
            ))}
          </>}
        </div>
        <div className="drawer-foot">
          <div className="left">ÉTAPE {step+1} / 3 · BROUILLON ENREGISTRÉ</div>
          <div className="actions">
            {step>0 && <button className="btn btn-ghost" onClick={()=>setStep(step-1)}>← Précédent</button>}
            {step<2 ? <button className="btn btn-gold" onClick={()=>setStep(step+1)}>Continuer →</button>
                   : <button className="btn btn-gold" onClick={onClose}>✓ Envoyer l'invitation</button>}
          </div>
        </div>
      </aside>
    </>
  );
}

function ComptesApp() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState('all');
  const counts = { all: COMPTES.length, synode:4, region:4, district:2, paroisse:2 };
  const filtered = role==='all' ? COMPTES : COMPTES.filter(c=>c.role===role);
  return (
    <div className="app-shell">
      <Sidebar/>
      <main className="main">
        <Topbar/>
        <div className="content">
          <div className="page-head">
            <div>
              <div style={{fontFamily:'var(--mono)', fontSize:'11px', letterSpacing:'0.2em', color:'var(--eec-gold)'}}>— ADMINISTRATION / COMPTES & RÔLES</div>
              <h1>Annuaire des <em>administrateurs.</em></h1>
              <div className="sub">12 comptes actifs sur 4 niveaux hiérarchiques. Gérez les invitations, permissions et affectations régionales.</div>
            </div>
            <div className="actions">
              <a href="dashboard.html" className="btn btn-ghost">← Tableau de bord</a>
              <button className="btn btn-gold" onClick={()=>setOpen(true)}>+ Inviter un administrateur</button>
            </div>
          </div>

          <div className="comptes-toolbar">
            <div className="search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>
              <input placeholder="Rechercher par nom, email, région..."/>
            </div>
            {[
              {k:'all',l:'Tous'},{k:'synode',l:'Synode'},{k:'region',l:'Régional'},{k:'district',l:'District'},{k:'paroisse',l:'Paroissial'},
            ].map(t=>(
              <button key={t.k} className={`filter-chip ${role===t.k?'active':''}`} onClick={()=>setRole(t.k)}>
                {t.l}<span className="count">{counts[t.k]}</span>
              </button>
            ))}
          </div>

          <div className="card">
            <div className="table-wrap">
              <table className="tbl">
                <thead><tr><th>Administrateur</th><th>Rôle</th><th>Affectation</th><th>Email</th><th>Dernière activité</th><th></th></tr></thead>
                <tbody>
                  {filtered.map(c=>(
                    <tr key={c.id}>
                      <td>
                        <div className="cell-name">
                          <div className="user-avatar" style={{background: `linear-gradient(135deg, ${c.color}, ${ROLES[c.role].color})`}}>{c.ini}</div>
                          <div><b>{c.name}</b><small>{c.titre}</small></div>
                        </div>
                      </td>
                      <td><span className={`role-pill ${c.role}`}>{ROLES[c.role].label}</span></td>
                      <td><span style={{fontFamily:'var(--mono)', fontSize:'12px', color:'var(--eec-text-mute)', letterSpacing:'0.1em'}}>{c.region.toUpperCase()}</span></td>
                      <td><span style={{color:'var(--eec-text-mute)', fontSize:'12.5px'}}>{c.email}</span></td>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                          <span style={{width:'7px', height:'7px', borderRadius:'50%', background: c.status==='online'?'#6FCB95':c.status==='away'?'#F5C518':'#555', boxShadow: c.status==='online'?'0 0 8px #6FCB95':'none'}}></span>
                          <span style={{fontSize:'12px', color: c.status==='online'?'#6FCB95':'var(--eec-text-mute)'}}>{c.last}</span>
                        </div>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button title="Voir"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg></button>
                          <button title="Modifier"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 4l6 6L8 22H2v-6z"/></svg></button>
                          <button title="Plus"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Drawer open={open} onClose={()=>setOpen(false)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ComptesApp/>);
