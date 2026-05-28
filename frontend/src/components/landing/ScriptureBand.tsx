'use client';
import { useRef, useEffect } from 'react';
import Image from 'next/image';

export default function ScriptureBand() {
  const ref = useRef<HTMLElement>(null);

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
        <Image src="/landing/bible.png" alt="" fill style={{ objectFit: 'cover' }} />
      </div>
      <div className="scripture-inner wrap">
        <div className="section-num" style={{ textAlign: 'center', display: 'block', marginBottom: '20px' }}>
          — Lumière sur nos pas
        </div>
        <q className="lp-serif">
          Ta parole est une lampe à mes pieds,<br />
          <em>et une lumière sur mon sentier.</em>
        </q>
        <div className="scripture-attr">PSAUME 119 : 105</div>
      </div>
    </section>
  );
}
