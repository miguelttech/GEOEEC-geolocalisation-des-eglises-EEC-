'use client';
import { useEffect } from 'react';
import '@/app/landing.css';

import Navbar       from './Navbar';
import Hero         from './Hero';
import Stats        from './Stats';
import MapSection   from './MapSection';
import ScriptureBand from './ScriptureBand';
import About        from './About';
import Oeuvres      from './Oeuvres';
import Direction    from './Direction';
import CTABand      from './CTABand';
import Footer       from './Footer';

export default function LandingPage() {
  useEffect(() => {
    document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('is-visible');
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.eec-lp .reveal').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="eec-lp">
      <Navbar />
      <Hero />
      <div className="reveal"><Stats /></div>
      <div className="reveal"><MapSection /></div>
      <ScriptureBand />
      <div className="reveal"><About /></div>
      <div className="reveal"><Oeuvres /></div>
      <div className="reveal"><Direction /></div>
      <div className="reveal"><CTABand /></div>
      <Footer />
    </div>
  );
}
