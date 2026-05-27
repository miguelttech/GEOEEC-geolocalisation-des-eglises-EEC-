'use client';
import React from 'react';
import { REGIONS_22, DISTRICTS_BY_REGION } from '@/components/admin/data';
import { I } from '@/components/admin/icons';
import { Dropdown } from '@/components/admin/atoms';

interface Form {
  nom: string; prenom: string; email: string; tel: string;
  role: string; region: string; district: string; paroisse: string;
  perms: Record<string, boolean>;
  password: string;
}

interface InvitePanelProps {
  onClose: () => void;
  onCreated: (form: Form) => void;
}

export default function InvitePanel({ onClose, onCreated }: InvitePanelProps) {
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState<Form>({
    nom: '', prenom: '', email: '', tel: '',
    role: '', region: '', district: '', paroisse: '',
    perms: {
      'create-paroisses': true, 'edit-paroisses': true, 'delete-paroisses': false,
      'create-oeuvres': true, 'delete-oeuvres': false,
      'create-district': true, 'create-paroisse-admin': true, 'disable-comptes': false,
      'import': true, 'export': true, 'validate-stats': false, 'view-journal': false,
    },
    password: 'EEc@2026!xK9m#rTp',
  });
  const update = (k: keyof Form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const updatePerm = (k: string, v: boolean) => setForm(f => ({ ...f, perms: { ...f.perms, [k]: v } }));

  React.useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="slide-panel">
        <div style={{ background: 'var(--chrome)', padding: '18px 22px', borderBottom: '1px solid rgba(245,197,24,0.10)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="icon-btn" onClick={onClose}><I.x size={16}/></button>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>Inviter un administrateur</div>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Étape {step}/3</span>
        </div>

        <div style={{ padding: '20px 22px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div className={`step-dot ${step > s ? 'done' : step === s ? 'current' : 'future'}`}>
                    {step > s ? <I.check size={12}/> : s}
                  </div>
                  <div style={{ fontSize: 10.5, color: step >= s ? 'var(--text)' : 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {(['Identité','Rôle & portée','Permissions'] as const)[i]}
                  </div>
                </div>
                {i < 2 && <div className={`step-line ${step > s ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          {step === 1 && <StepIdentity form={form} update={update} />}
          {step === 2 && <StepRolePortee form={form} update={update} />}
          {step === 3 && <StepPermissions form={form} updatePerm={updatePerm} update={update} />}
        </div>

        <div style={{ background: 'var(--chrome)', padding: '14px 22px', borderTop: '1px solid rgba(245,197,24,0.10)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {step > 1 && <button className="btn btn-outline" onClick={() => setStep(step - 1)}><I.chevL size={13}/>Retour</button>}
          {step < 3 && (
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
              disabled={
                (step === 1 && (!form.nom || !form.prenom || !form.email)) ||
                (step === 2 && (!form.role || !form.region))
              }
              onClick={() => setStep(step + 1)}
            >
              {step === 1 ? 'Étape suivante : Rôle et portée' : 'Étape suivante : Permissions'}
              <I.chevR size={13}/>
            </button>
          )}
          {step === 3 && (
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onCreated(form)}>
              Créer le compte
              <I.check size={14}/>
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function StepIdentity({ form, update }: { form: Form; update: (k: keyof Form, v: string) => void }) {
  const [emailState, setEmailState] = React.useState<'idle'|'checking'|'ok'|'taken'>('idle');
  React.useEffect(() => {
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) { setEmailState('idle'); return; }
    setEmailState('checking');
    const t = setTimeout(() => {
      setEmailState(form.email.includes('admin@') ? 'taken' : 'ok');
    }, 700);
    return () => clearTimeout(t);
  }, [form.email]);

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Informations de l'administrateur</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
        Ces informations apparaîtront sur le compte et dans le journal d'activité. L'adresse e-mail servira d'identifiant de connexion.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div className="label">Nom de famille<span className="req">*</span></div>
          <input className="input" value={form.nom} onChange={e => update('nom', e.target.value)} placeholder="BIYA" />
        </div>
        <div>
          <div className="label">Prénom<span className="req">*</span></div>
          <input className="input" value={form.prenom} onChange={e => update('prenom', e.target.value)} placeholder="Marie-Claire" />
        </div>
      </div>
      <div>
        <div className="label">Adresse e-mail<span className="req">*</span></div>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="prenom.nom@eec-cameroun.org"
            style={{
              paddingRight: 36,
              borderColor: emailState === 'taken' ? 'rgba(198,40,40,0.50)' : emailState === 'ok' ? 'rgba(46,151,68,0.50)' : undefined,
            }}
          />
          <div style={{ position: 'absolute', right: 12, top: 12 }}>
            {emailState === 'checking' && <div className="spinner" />}
            {emailState === 'ok' && <I.check size={16} style={{ color: '#5AC472' }} />}
            {emailState === 'taken' && <I.x size={16} style={{ color: '#FF6B6B' }} />}
          </div>
        </div>
        {emailState === 'ok' && <div style={{ fontSize: 11, color: '#5AC472', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><I.check size={11}/>Email disponible</div>}
        {emailState === 'taken' && <div style={{ fontSize: 11, color: '#FF6B6B', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><I.x size={11}/>Déjà utilisé par un autre compte</div>}
      </div>
      <div>
        <div className="label">Téléphone <span style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginLeft: 4 }}>optionnel</span></div>
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,197,24,0.15)', borderRight: 0, borderRadius: '6px 0 0 6px', fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center' }}>+237</div>
          <input className="input" style={{ borderRadius: '0 6px 6px 0' }} placeholder="6XX XX XX XX" value={form.tel} onChange={e => update('tel', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function StepRolePortee({ form, update }: { form: Form; update: (k: keyof Form, v: string) => void }) {
  const roles = [
    { id: 'regional', title: 'Admin Régional', sub: 'Gère une région synodale complète (paroisses, districts, œuvres, ouvriers).', icon: 'compass' },
    { id: 'district', title: 'Admin District', sub: 'Gère un district dans une région.', icon: 'network' },
    { id: 'paroisse', title: 'Admin Paroisse', sub: 'Gère une paroisse spécifique.', icon: 'church' },
  ] as const;
  const districts = DISTRICTS_BY_REGION[form.region] || [];

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Rôle et périmètre d'accès</h3>
      <p style={{ fontSize: 12.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
        Choisissez le rôle qui détermine le périmètre des données accessibles.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {roles.map(r => {
          const selected = form.role === r.id;
          const Ic = I[r.icon as keyof typeof I];
          return (
            <div
              key={r.id}
              onClick={() => update('role', r.id)}
              style={{
                padding: 14, borderRadius: 7, cursor: 'pointer',
                background: selected ? 'rgba(46,151,68,0.08)' : 'rgba(255,255,255,0.02)',
                border: selected ? '2px solid #2E9744' : '1px solid rgba(245,197,24,0.13)',
                display: 'flex', alignItems: 'flex-start', gap: 12,
                transition: 'all 200ms ease',
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (selected ? '#2E9744' : 'rgba(255,255,255,0.25)'), flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selected && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2E9744' }} />}
              </div>
              {Ic && <Ic size={20} style={{ color: selected ? '#5AC472' : 'var(--text-2)', flexShrink: 0, marginTop: 1 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{r.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 2, lineHeight: 1.5 }}>{r.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {form.role && (
        <div className="cascade" style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 6 }}>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <Dropdown label="Région synodale*" value={form.region} options={[...REGIONS_22]} onChange={v => { update('region', v); update('district', ''); update('paroisse', ''); }} placeholder="Sélectionner une région" />
          {(form.role === 'district' || form.role === 'paroisse') && form.region && (
            <div className="cascade">
              <Dropdown label="District*" value={form.district} options={districts.length ? districts : DISTRICTS_BY_REGION['MIFI']} onChange={v => { update('district', v); update('paroisse', ''); }} placeholder="Sélectionner un district" />
            </div>
          )}
          {form.role === 'paroisse' && form.district && (
            <div className="cascade">
              <Dropdown label="Paroisse*" value={form.paroisse} options={['Bafoussam-Centre','Bafoussam-Nord','Bafoussam-Sud','Bafoussam-Est']} onChange={v => update('paroisse', v)} placeholder="Sélectionner une paroisse" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepPermissions({ form, updatePerm, update }: { form: Form; updatePerm: (k: string, v: boolean) => void; update: (k: keyof Form, v: string) => void }) {
  const groups = [
    { title: 'Gestion des données', perms: [
      { key: 'create-paroisses', label: 'Peut créer des paroisses dans sa région' },
      { key: 'edit-paroisses', label: 'Peut modifier les paroisses de sa région' },
      { key: 'delete-paroisses', label: 'Peut supprimer des paroisses de sa région' },
      { key: 'create-oeuvres', label: 'Peut créer des œuvres dans sa région' },
      { key: 'delete-oeuvres', label: 'Peut supprimer des œuvres' },
    ]},
    { title: 'Comptes et accès', perms: [
      { key: 'create-district', label: 'Peut créer des comptes Admin District' },
      { key: 'create-paroisse-admin', label: 'Peut créer des comptes Admin Paroisse' },
      { key: 'disable-comptes', label: 'Peut désactiver des comptes' },
    ]},
    { title: 'Données & rapports', perms: [
      { key: 'import', label: 'Peut importer des fichiers Excel' },
      { key: 'export', label: 'Peut exporter les données de sa région' },
      { key: 'validate-stats', label: 'Peut valider les statistiques soumises' },
      { key: 'view-journal', label: "Peut voir le journal d'activité de sa région" },
    ]},
  ];

  const regen = () => update('password', 'EEc@' + Math.floor(Math.random()*9000+1000) + '!' + Math.random().toString(36).slice(2, 8));
  const [copied, setCopied] = React.useState(false);
  const copy = () => { navigator.clipboard.writeText(form.password); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const roleLabel = { regional:'Administrateur Régional', district:'Administrateur District', paroisse:'Administrateur Paroisse' }[form.role] || form.role;
  const portee = form.role === 'regional' ? `Région Synodale ${form.region}` : form.role === 'district' ? `${form.region} → ${form.district}` : `${form.paroisse}`;

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 className="sg" style={{ fontSize: 18, margin: 0 }}>Permissions et accès</h3>
      <div style={{ background: 'rgba(46,151,68,0.08)', border: '1px solid rgba(46,151,68,0.30)', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <I.check size={14} style={{ color: '#5AC472' }} />
        <span style={{ fontSize: 13, color: '#5AC472', fontWeight: 500 }}>{roleLabel} · {portee}</span>
      </div>
      {groups.map((g, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{g.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 6 }}>
            {g.perms.map((p, pi) => (
              <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderTop: pi > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <input type="checkbox" className="checkbox" checked={form.perms[p.key]} onChange={e => updatePerm(p.key, e.target.checked)} />
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{p.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div style={{ background: 'rgba(255,214,0,0.04)', border: '1px solid rgba(255,214,0,0.20)', borderRadius: 8, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <I.key size={14} style={{ color: '#FFD600' }} />
          <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mot de passe temporaire</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="code-chip" style={{ flex: 1, padding: '8px 12px', justifyContent: 'space-between' }}>{form.password}</div>
          <button className="icon-btn" onClick={copy}><I.copy size={14}/></button>
          <button className="icon-btn" onClick={regen}><I.refresh size={14}/></button>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 11, color: '#FFB877' }}>
          <I.alert size={11} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>Affiché une seule fois. L'administrateur devra le changer à sa première connexion.</span>
        </div>
      </div>
    </div>
  );
}
