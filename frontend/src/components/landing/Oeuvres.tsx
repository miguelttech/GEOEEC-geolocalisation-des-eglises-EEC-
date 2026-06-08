'use client';
import { useState } from 'react';
import Image from 'next/image';

const TABS = ['Tous', 'Paroisses', 'Écoles', 'Centres médicaux', 'Universités', 'Terrains'];

export default function Oeuvres() {
  const [active, setActive] = useState('Tous');

  return (
    <section className="lp-oeuvres" id="oeuvres">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 04 / Nos œuvres</div>
            <h2 className="lp-serif">
              Plus qu&apos;une Église — <em>une présence</em><br />au cœur des communautés.
            </h2>
          </div>
          <div className="meta">
            Écoles, centres médicaux, universités, œuvres agropastorales :
            l&apos;EEC accompagne le développement humain dans 137 districts.
          </div>
        </div>

        <div className="oeuvre-tabs">
          {TABS.map(t => (
            <button key={t} className={active === t ? 'active' : ''} onClick={() => setActive(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="oeuvre-grid">
          <div className="oeuvre-card span-6">
            <Image src="/landing/church.png" alt="" fill style={{ objectFit: 'cover' }} />
            <div className="overlay" />
            <div className="lbl-wrap">
              <div className="lbl-kind">Paroisse · MIFI</div>
              <div className="lbl-name">Cathédrale EEC de Bafoussam — Bureau Régional</div>
            </div>
          </div>

          <div className="oeuvre-card span-3-tall">
            <Image src="/landing/crucifix.png" alt="" fill style={{ objectFit: 'cover' }} />
            <div className="overlay" />
            <div className="lbl-wrap">
              <div className="lbl-kind">Patrimoine · CENTRE</div>
              <div className="lbl-name">Sanctuaire — Yaoundé Mvog-Ada</div>
            </div>
          </div>

          <div className="oeuvre-card span-3-tall">
            <Image src="/landing/bible.png" alt="" fill style={{ objectFit: 'cover' }} />
            <div className="overlay" />
            <div className="lbl-wrap">
              <div className="lbl-kind">Vie spirituelle</div>
              <div className="lbl-name">Étude biblique · Districts du Sud-Ouest</div>
            </div>
          </div>

          <div className="span-quote">
            <q>La marche ensemble dans l&apos;Église — c&apos;est savoir où chacun se tient, et avancer d&apos;un même pas.</q>
            <div className="attr">— Devise officielle de l&apos;EEC</div>
          </div>

          <div className="oeuvre-card span-3">
            <Image src="/landing/eglise_beau.png" alt="" fill style={{ objectFit: 'cover' }} />
            <div className="overlay" />
            <div className="lbl-wrap">
              <div className="lbl-kind">École · MÉNOUA</div>
              <div className="lbl-name">Collège EEC Dschang</div>
            </div>
          </div>

          <div className="oeuvre-card span-3">
            <Image src="/landing/EEC-14-1024x768.jpg" alt="" fill style={{ objectFit: 'cover' }} />
            <div className="overlay" />
            <div className="lbl-wrap">
              <div className="lbl-kind">Médical · LITTORAL</div>
              <div className="lbl-name">Hôpital Protestant Douala</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
