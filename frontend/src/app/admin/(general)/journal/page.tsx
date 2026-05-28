'use client';
import React from 'react';
import { I } from '@/components/admin/icons';
import { Dropdown, SegButtons } from '@/components/admin/atoms';
import { journalEntries } from '@/components/admin/data';

export default function JournalPage() {
  const [periode, setPeriode] = React.useState('today');
  const [expanded, setExpanded] = React.useState<number>(-1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Période</span>
        <SegButtons
          value={periode}
          options={[
            {label:"Aujourd'hui", value:'today'},
            {label:'7 jours',     value:'7d'},
            {label:'30 jours',    value:'30d'},
            {label:'Personnalisé',value:'custom'},
          ]}
          onChange={setPeriode}
        />
        <span style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)' }}/>
        <Dropdown value="Toutes actions"   options={['Toutes actions','Connexion','Création','Modification','Suppression','Import','Export']} onChange={() => {}} width={170}/>
        <Dropdown value="Tous utilisateurs" options={['Tous utilisateurs','Marie-Claire BIYA','Paul ATEBA','Jean-Paul ESSOMBA']} onChange={() => {}} width={200}/>
        <Dropdown value="Toutes entités"   options={['Toutes entités','Paroisses','Ouvriers','Œuvres','Comptes']} onChange={() => {}} width={160}/>
        <button className="btn btn-outline" style={{ marginLeft: 'auto' }}><I.download size={13}/>Exporter</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Date / Heure</th>
              <th>Utilisateur</th>
              <th>Action</th>
              <th>Entité</th>
              <th>Résumé</th>
              <th>IP</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {journalEntries.map((e, i) => (
              <React.Fragment key={i}>
                <tr style={{ cursor: 'pointer' }} onClick={() => setExpanded(expanded === i ? -1 : i)}>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{e.time}</td>
                  <td>{e.who}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, color: e.color }}>
                      {(() => { const Ic = I[e.icon as keyof typeof I]; return Ic ? <Ic size={13}/> : null; })()}
                      {e.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text)', fontWeight: 500 }}>{e.entity}</td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12 }}>{e.summary}</td>
                  <td className="mono" style={{ color: 'var(--text-3)', fontSize: 11.5 }}>{e.ip}</td>
                  <td>
                    <I.chevD size={14} style={{ transform: expanded === i ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', opacity: 0.5 }} />
                  </td>
                </tr>
                {expanded === i && (
                  <tr className="anim-fade">
                    <td colSpan={7} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.06em', marginBottom: 6 }}>Action</div>
                          <div style={{ fontSize: 13, marginBottom: 12 }}>{e.action} de {e.entity}</div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.06em', marginBottom: 6 }}>Utilisateur</div>
                          <div style={{ fontSize: 13 }}>{e.who} · IP <span className="mono">{e.ip}</span></div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.06em', marginBottom: 6 }}>Champs modifiés</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }} className="mono">
                            <div>Latitude <span style={{ color: 'var(--text-3)' }}>: N/A</span> → <span style={{ color: '#5AC472' }}>5.4740</span></div>
                            <div>Longitude <span style={{ color: 'var(--text-3)' }}>: N/A</span> → <span style={{ color: '#5AC472' }}>10.4180</span></div>
                            <div>Statut <span style={{ color: 'var(--text-3)' }}>: actif</span> → <span style={{ color: '#FFB877' }}>en_attente</span></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
