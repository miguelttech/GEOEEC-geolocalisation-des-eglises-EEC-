'use client';

import { useState, useEffect } from 'react';

interface NewsImage {
  id: number;
  image_url: string;
}

interface NewsItem {
  id: number;
  titre: string;
  contenu: string;
  images: NewsImage[];
  created_at: string;
}

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

function excerpt(text: string, max = 180): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/news/?page_size=6`)
      .then(r => r.json())
      .then((data: { results?: NewsItem[] } | NewsItem[]) => {
        setItems(Array.isArray(data) ? data : data.results ?? []);
      })
      .catch(() => {/* backend non disponible → section masquée */})
      .finally(() => setLoading(false));
  }, []);

  // Rien à publier (ou backend injoignable) : la section ne s'affiche pas —
  // pas de cadre vide sur la landing page.
  if (!loading && items.length === 0) return null;
  if (loading) return null;

  return (
    <section className="news" id="news">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="section-num">— 06 / Actualités</div>
            <h2 className="lp-serif"><em>Actualités</em> de l&apos;EEC.</h2>
          </div>
          <div className="meta">
            Les dernières informations et annonces de l&apos;Église Évangélique du Cameroun.
          </div>
        </div>

        <div className="news-grid">
          {items.map(n => (
            <div className="news-card" key={n.id}>
              {n.images.length === 1 && (
                <div className="news-cover" onClick={() => setZoomedImage(n.images[0].image_url)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.images[0].image_url} alt={n.titre} />
                </div>
              )}
              {n.images.length > 1 && (
                <div className="news-images">
                  {n.images.map(img => (
                    <div className="news-thumb" key={img.id} onClick={() => setZoomedImage(img.image_url)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image_url} alt={n.titre} />
                    </div>
                  ))}
                </div>
              )}
              <div className="news-date">
                {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <h4>{n.titre}</h4>
              {n.contenu && <p className="news-text">{excerpt(n.contenu)}</p>}
            </div>
          ))}
        </div>
      </div>

      {zoomedImage && (
        <div className="news-lightbox" onClick={() => setZoomedImage(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoomedImage} alt="" />
        </div>
      )}
    </section>
  );
}
