'use client';
import { Fragment, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useBibleVerse } from '@/lib/bible-verses';

export default function ScriptureBand() {
  const ref = useRef<HTMLElement>(null);
  const { verse, visible } = useBibleVerse(9000);
  const lines = verse.pre.split('\n');

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const rect     = ref.current.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      const y        = (progress - 0.5) * 120;
      ref.current.style.setProperty('--parallax-y', `${y}px`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="scripture" ref={ref}>
      <div className="scripture-bg">
        <Image
          src="/landing/temple_eec_wide.jpg"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: 'contain', objectPosition: 'center' }}
        />
      </div>
      <div className="scripture-inner wrap">
        <div className="section-num" style={{ textAlign: 'center', display: 'block', marginBottom: '20px' }}>
          — Lumière sur nos pas
        </div>
        <q className={`lp-serif verse-fade ${visible ? 'verse-in' : 'verse-out'}`}>
          {lines.map((line, i) => (
            <Fragment key={i}>
              {line}<br />
            </Fragment>
          ))}
          <em>{verse.emphasis}</em>
        </q>
        <div className="scripture-attr">{verse.ref.toUpperCase()}</div>
      </div>
    </section>
  );
}
