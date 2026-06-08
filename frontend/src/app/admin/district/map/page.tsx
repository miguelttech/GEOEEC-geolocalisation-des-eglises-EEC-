'use client';
import dynamic from 'next/dynamic';

const EECMapApp = dynamic(() => import('@/components/eec/EECMapApp'), { ssr: false });

export default function MapPage() {
  return (
    <div style={{ margin: '-28px -32px', height: 'calc(100vh - 60px)' }}>
      <EECMapApp embedded mode="visitor" user={null} />
    </div>
  );
}
