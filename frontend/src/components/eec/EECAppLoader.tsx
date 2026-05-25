'use client';

import dynamic from 'next/dynamic';

const EECApp = dynamic(() => import('./EECApp'), { ssr: false });

export default function EECAppLoader() {
  return <EECApp />;
}
