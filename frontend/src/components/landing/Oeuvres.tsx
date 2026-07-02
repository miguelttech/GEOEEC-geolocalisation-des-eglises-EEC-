'use client';
import { useState } from 'react';
import Image from 'next/image';

type Tab = 'Tous' | 'Paroisses' | 'Écoles' | 'Centres médicaux' | 'Universités' | 'Terrains';

const TABS: Tab[] = ['Tous', 'Paroisses', 'Écoles', 'Centres médicaux', 'Universités', 'Terrains'];

interface Item {
  nom: string;
  localite: string;
  img: string;
  cat: Exclude<Tab, 'Tous'>;
}

const ALL: Item[] = [
  /* ── PAROISSES ── 6 images toutes différentes ───────────────── */
  { cat: 'Paroisses', nom: 'Paroisse Galilée de DANG',   localite: 'ADAMAOUA',       img: '/landing/church.png' },
  { cat: 'Paroisses', nom: 'EEC ESSOS',                   localite: 'CENTRE',         img: '/landing/EEC-14-1024x768.jpg' },
  { cat: 'Paroisses', nom: 'EEC ETOUG-EBE',              localite: 'CENTRE',         img: '/landing/paroisse1.png' },
  { cat: 'Paroisses', nom: 'Paroisse de Baleveng',        localite: 'MENOUA',         img: '/landing/paroisse_baleveng.jpg' },
  { cat: 'Paroisses', nom: 'EEC BONABÉRI',               localite: 'LITTORAL',       img: '/landing/paroisse_douala.jpg' },
  { cat: 'Paroisses', nom: 'Babouantou Tonko',            localite: 'HAUTS-PLATEAUX', img: '/landing/church1.png' },

  /* ── ÉCOLES ── 6 images toutes différentes ──────────────────── */
  { cat: 'Écoles', nom: 'École primaire bilingue Bon Berger',    localite: 'LITTORAL',       img: '/landing/ecole_primaire.jpg' },
  { cat: 'Écoles', nom: 'École EEC Tonko',                       localite: 'HAUTS-PLATEAUX', img: '/landing/ecole_douala.jpg' },
  { cat: 'Écoles', nom: 'École primaire EEC de Bafang 2',        localite: 'HAUT-NKAM',     img: '/landing/ecole_classe.jpg' },
  { cat: 'Écoles', nom: 'École maternelle de Bandjoun ville',    localite: 'KOUNG KHI',     img: '/landing/ecole_montessori.jpg' },
  { cat: 'Écoles', nom: 'École CEPCA de Penkue',                 localite: 'MENOUA',        img: '/landing/ecole_rurale.jpg' },
  { cat: 'Écoles', nom: 'Collège Évangélique Polyvalent Balena', localite: 'SUD',            img: '/landing/ecole_akonolinga.jpg' },

  /* ── CENTRES MÉDICAUX ── 6 images toutes différentes ────────── */
  { cat: 'Centres médicaux', nom: 'Hôpital Protestant de Mbouo',          localite: 'KOUNG KHI',      img: '/landing/hopital_mbouo_ext.jpg' },
  { cat: 'Centres médicaux', nom: 'Centre de santé Thomas Noutong',       localite: 'HAUT-NKAM',     img: '/landing/centre_sante.jpg' },
  { cat: 'Centres médicaux', nom: 'Hôpital Protestant de Lelem Mangwété', localite: 'LITTORAL',       img: '/landing/hopital_protestant_mbouo.jpg' },
  { cat: 'Centres médicaux', nom: 'Centre Médical Protestant Nlonako',    localite: 'LITTORAL',       img: '/landing/centre_sante2.jpg' },
  { cat: 'Centres médicaux', nom: 'CSI EEC de Babouantou — Bangoua',     localite: 'HAUTS-PLATEAUX', img: '/landing/hopital_lelem.jpg' },
  { cat: 'Centres médicaux', nom: 'Centre de santé de Melong Centre',     localite: 'MOUNGO NORD',    img: '/landing/centre_sante.jpg' },

  /* ── UNIVERSITÉS ── 4 entrées BD, 3 images distinctes ──────── */
  { cat: 'Universités', nom: 'Institut Universitaire Évangélique du Cameroun (IUEC)', localite: 'MBOUO · BANDJOUN', img: '/landing/iuec_campus1.jpg' },
  { cat: 'Universités', nom: 'UTEC — Université de Technologie Évangélique',          localite: 'MBOUO · BANDJOUN', img: '/landing/iuec_campus2.jpg' },
  { cat: 'Universités', nom: 'Institut Universitaire Évangélique de Mbouo',           localite: 'KOUNG KHI',        img: '/landing/univ_iuec_amphi.jpg' },
  { cat: 'Universités', nom: 'IUEC — Faculté des Sciences Agronomes',                localite: 'MBOUO · BANDJOUN', img: '/landing/univ_yaounde_s.jpg' },

  /* ── TERRAINS ── 6 images toutes différentes ────────────────── */
  { cat: 'Terrains', nom: 'Jourdain de Beka Hossere',                 localite: 'ADAMAOUA', img: '/landing/terrain_eec.jpg' },
  { cat: 'Terrains', nom: 'SION GBAKOUNGUE',                          localite: 'ADAMAOUA', img: '/landing/terrain_arachide.jpg' },
  { cat: 'Terrains', nom: 'Terrain construction Complexe Paroissial', localite: 'CENTRE',   img: '/landing/terrain_mais.jpg' },
  { cat: 'Terrains', nom: 'Terrain abritant la paroisse',             localite: 'MENOUA',   img: '/landing/terrain_agri.jpg' },
  { cat: 'Terrains', nom: 'Terrain EEC Bekoko',                       localite: 'LITTORAL', img: '/landing/terrain_cameroun.jpg' },
  { cat: 'Terrains', nom: 'Terrain à Nyom-Edimi',                     localite: 'SUD',      img: '/landing/terrain_champ_mais.jpg' },
];

const TOUS_ITEMS: Item[] = [
  ALL.find(i => i.cat === 'Paroisses')!,
  ALL.find(i => i.cat === 'Centres médicaux')!,
  ALL.find(i => i.cat === 'Écoles')!,
  ALL.find(i => i.cat === 'Universités')!,
  ALL.find(i => i.cat === 'Terrains')!,
];

function Card({ item, cls }: { item: Item; cls: string }) {
  return (
    <div className={`oeuvre-card ${cls}`}>
      <Image
        src={item.img}
        alt={item.nom}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        style={{ objectFit: 'cover' }}
      />
      <div className="overlay" />
      <div className="lbl-wrap">
        <div className="lbl-kind">{item.cat} · {item.localite}</div>
        <div className="lbl-name">{item.nom}</div>
      </div>
    </div>
  );
}

function CatGrid({ items }: { items: Item[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {items.slice(0, 6).map((item, i) => (
        <div key={i} className="oeuvre-card" style={{ height: 260, position: 'relative', borderRadius: 6 }}>
          <Image
            src={item.img}
            alt={item.nom}
            fill
            sizes="33vw"
            style={{ objectFit: 'cover' }}
          />
          <div className="overlay" />
          <div className="lbl-wrap">
            <div className="lbl-kind">{item.cat} · {item.localite}</div>
            <div className="lbl-name" style={{ fontSize: 15 }}>{item.nom}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Oeuvres() {
  const [active, setActive] = useState<Tab>('Tous');
  const filtered = active === 'Tous' ? [] : ALL.filter(i => i.cat === active);

  return (
    <section className="lp-oeuvres" id="oeuvres">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 04 / Nos œuvres</div>
            <h2 className="lp-serif">
              Plus qu&apos;une Église — <em>une présence</em><br />
              au cœur des communautés.
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
              {t !== 'Tous' && (
                <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.65, fontFamily: 'var(--lp-mono)' }}>
                  ({ALL.filter(i => i.cat === t).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {active === 'Tous' ? (
          <div className="oeuvre-grid">
            <Card item={TOUS_ITEMS[0]} cls="span-6" />
            <Card item={TOUS_ITEMS[1]} cls="span-3-tall" />
            <Card item={TOUS_ITEMS[2]} cls="span-3-tall" />
            <div className="span-quote">
              <q>La marche ensemble dans l&apos;Église — c&apos;est savoir où chacun se tient, et avancer d&apos;un même pas.</q>
              <div className="attr">— Devise officielle de l&apos;EEC</div>
            </div>
            <Card item={TOUS_ITEMS[3]} cls="span-3" />
            <Card item={TOUS_ITEMS[4]} cls="span-3" />
          </div>
        ) : (
          <CatGrid items={filtered} />
        )}
      </div>
    </section>
  );
}
