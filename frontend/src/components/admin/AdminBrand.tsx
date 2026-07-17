'use client';
import React from 'react';

/**
 * Identité graphique commune à tous les espaces admin (général, régional,
 * district, paroisse) — logo officiel EEC + titre, identiques à ceux de la
 * carte publique et des pages d'authentification.
 */
export default function AdminBrand({ spaceLabel }: { spaceLabel: string }) {
  return (
    <div style={{ height: 72, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <img src="/logo-eec.png" alt="EEC" width={36} height={36} style={{ objectFit: 'contain', borderRadius: 6, padding: 3, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <span className="fr" style={{ fontSize: 12.5, lineHeight: 1.25, color: '#fff', letterSpacing: '0.005em' }}>
          Géolocalisation des Églises Évangéliques du Cameroun
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: 500 }}>{spaceLabel}</span>
      </div>
    </div>
  );
}
