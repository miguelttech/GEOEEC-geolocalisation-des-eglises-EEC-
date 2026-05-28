'use client';
import { useState, useEffect, useRef } from 'react';

export default function Counter({ to, duration = 1600 }: { to: number; duration?: number }) {
  const [val, setVal]   = useState(0);
  const ref             = useRef<HTMLSpanElement>(null);
  const started         = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (t: number) => {
          const k     = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - k, 3);
          setVal(Math.floor(eased * to));
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);

  return <span ref={ref}>{val.toLocaleString('fr-FR')}</span>;
}
