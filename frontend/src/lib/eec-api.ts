/* =============================================================================
   EEC Géolocalisation — API data loader
   Fetches real data from Django backend and maps to frontend types
   ============================================================================= */

import type { District, Paroisse, Oeuvre, Ouvrier, StatistiqueAnnuelle } from './api';

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

// Géométrie GeoJSON (Polygon/MultiPolygon) — seule la structure lue par
// geoCentroid() nous intéresse ici, pas le détail des types GeoJSON.
export interface GeoGeometry { type: string; coordinates: unknown }

// Forme exacte renvoyée par GET /api/geo/regions/ (voir
// RegionSynodaleViewSet.list() côté backend) — un FeatureCollection GeoJSON
// construit à la main, distinct de l'interface RegionSynodale de lib/api.ts
// (qui correspond elle à l'action /liste/, sans géométrie).
interface RegionFeature {
  type: 'Feature';
  id: number;
  geometry: GeoGeometry | null;
  properties: { id: number; nom: string; code: string | null; nb_districts: number; nb_paroisses: number };
}

export interface RegionItem {
  id: string; name: string; admin: string; city: string;
  lat: number; lng: number; radius: number; districts: number;
  geometry?: GeoGeometry;
}
export interface DistrictItem {
  id: string; regionId: string; regionName: string; name: string;
  lat: number; lng: number; parishCount: number;
}
export interface ParishItem {
  id: string; type: 'paroisse'; regionId: string; regionName: string;
  districtId: string; districtName: string;
  name: string; address: string; categorie: string | null;
  lat: number; lng: number;
  stats: {
    fideles: number; communiants: number; nonCommuniants: number;
    annee: number;
  };
  active: boolean;
}
export interface OeuvreItem {
  id: string; type: string; typeLabel: string;
  regionId: string; regionName: string;
  name: string; address: string;
  lat: number; lng: number;
  capacity: number; year: number; active: boolean;
}
export interface WorkerItem {
  id: string; regionId: string; parishId: string | null; parishName: string;
  districtName: string; regionName: string;
  grade: string; gradeLabel: string; name: string; status: string;
}

export interface MapDataResult {
  regions: RegionItem[];
  districts: DistrictItem[];
  parishes: ParishItem[];
  oeuvres: OeuvreItem[];
  workers: WorkerItem[];
  allItems: (ParishItem | OeuvreItem)[];
  globalStats: { regions: number; districts: number; parishes: number; oeuvres: number; workers: number };
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  // page_size élevé : tout récupérer en 1 seule requête par endpoint
  // (le backend autorise jusqu'à 3000 via StandardPagination).
  const sep = path.includes('?') ? '&' : '?';
  let url: string | null = `${API}/api/${path}${sep}page_size=3000`;
  try {
    while (url) {
      // Pas de `credentials: 'include'` ici : la carte publique doit toujours
      // afficher le jeu de données NATIONAL complet, quel que soit le compte
      // admin éventuellement connecté dans ce navigateur. Ces endpoints
      // appliquent un filtre RBAC par portée géographique (région/district/
      // paroisse) dès qu'une session admin authentifiée est détectée — envoyer
      // les cookies de session ici ferait fuiter ce filtre sur la carte
      // publique (un admin de district ne verrait plus que son propre
      // district au lieu des 693 paroisses nationales).
      const r: Response = await fetch(url);
      if (!r.ok) break;
      const d: { results?: T[]; next?: string | null } | T[] = await r.json();
      if (Array.isArray(d)) { all.push(...d); break; }
      all.push(...(d.results ?? []));
      url = d.next ?? null;
    }
  } catch {
    // Backend not reachable — return whatever was collected
  }
  return all;
}

// Compute centroid from a GeoJSON geometry (Polygon or MultiPolygon)
function geoCentroid(geom: GeoGeometry): [number, number] {
  const pts: number[][] = [];
  function collect(c: unknown): void {
    if (
      Array.isArray(c) &&
      c.length >= 2 &&
      typeof c[0] === 'number' &&
      typeof c[1] === 'number'
    ) {
      pts.push(c as number[]);
    } else if (Array.isArray(c)) {
      c.forEach(collect);
    }
  }
  collect(geom.coordinates);
  if (!pts.length) return [5.0, 12.5];
  const lat = pts.reduce((s, c) => s + c[1], 0) / pts.length;
  const lng = pts.reduce((s, c) => s + c[0], 0) / pts.length;
  return [lat, lng];
}

// Map TypeOeuvre nom → frontend type id
function oeuvreTypeId(nom: string): string {
  const s = (nom ?? '').toLowerCase();
  if (s.includes('scolaire') || s.includes('ecole') || s.includes('école') ||
      s.includes('college') || s.includes('collège') || s.includes('lycee') || s.includes('lycée') ||
      s.includes('ep ') || s.includes('em ') || s.includes('primaire') || s.includes('maternelle') ||
      s.includes('bilingue')) return 'scolaire';
  if (s.includes('medical') || s.includes('médical') || s.includes('santé') ||
      s.includes('sante') || s.includes('hôpital') || s.includes('hopital') ||
      s.includes('dispensaire') || s.includes('clinique') || s.includes('cmp') ||
      s.includes('centre médico') || s.includes('centre medico')) return 'medical';
  if (s.includes('univ') || s.includes('théolog') || s.includes('theolog') ||
      s.includes('faculté') || s.includes('faculte') || s.includes('supérieur') ||
      s.includes('superieur') || s.includes('institut') || s.includes('pastoral')) return 'univ';
  if (s.includes('agro') || s.includes('ferme') || s.includes('plantation') ||
      s.includes('agricol') || s.includes('domaine')) return 'agro';
  if (s.includes('terrain') || s.includes('parcelle') || s.includes('foncier')) return 'terrain';
  return 'immeuble';
}

// ──────────────────────────────────────────────────────────────────────────────
// Main loader
// ──────────────────────────────────────────────────────────────────────────────

export async function loadMapData(): Promise<MapDataResult> {
  const [regGeoRes, distRaw, parRaw, oeuRaw, ouvRaw, statsRaw] = await Promise.all([
    // Sans credentials — voir la note dans fetchAllPages() : la carte
    // publique doit rester non-scopée même pour un navigateur où un admin
    // est connecté.
    fetch(`${API}/api/geo/regions/`)
      .then(r => r.json())
      .catch(() => ({ features: [] })),
    fetchAllPages<District>('geo/districts/'),
    fetchAllPages<Paroisse>('geo/paroisses/'),
    fetchAllPages<Oeuvre>('oeuvres/oeuvres/'),
    fetchAllPages<Ouvrier>('ouvriers/ouvriers/'),
    fetchAllPages<StatistiqueAnnuelle>('statistiques/'),
  ]);

  // 1. Regions — from GeoJSON FeatureCollection.
  // Robuste : accepte le FeatureCollection direct { features } OU la forme paginée
  // { results: { features } } au cas où la pagination serait réactivée.
  const rg = regGeoRes as { features?: RegionFeature[]; results?: { features?: RegionFeature[] } };
  const features: RegionFeature[] = rg.features ?? rg.results?.features ?? [];
  const regions: RegionItem[] = features
    .filter(f => f.geometry != null)
    .map(f => {
      const [lat, lng] = geoCentroid(f.geometry as GeoGeometry);
      return {
        id: String(f.properties.id),
        name: f.properties.nom,
        admin: f.properties.nom,
        city: f.properties.nom,
        lat, lng,
        radius: 0.4,
        districts: f.properties.nb_districts ?? 0,
        geometry: f.geometry as GeoGeometry,
      };
    });

  const regionById: Record<string, { lat: number; lng: number; name: string }> = {};
  regions.forEach(r => { regionById[r.id] = { lat: r.lat, lng: r.lng, name: r.name }; });

  // 2. Statistics — most recent year per paroisse
  const statsByPar: Record<number, StatistiqueAnnuelle> = {};
  statsRaw.forEach(s => {
    const ex = statsByPar[s.paroisse];
    if (!ex || s.annee > ex.annee) {
      statsByPar[s.paroisse] = s;
    }
  });

  // 3. Parishes — only those with GPS coordinates
  const parishes: ParishItem[] = parRaw
    .filter((p): p is Paroisse & { latitude: number; longitude: number } => p.latitude != null && p.longitude != null)
    .map(p => {
      const st = statsByPar[p.id];
      const communiants    = st?.communiants    ?? 0;
      const nonCommuniants = st?.non_communiants ?? 0;
      const fideles        = st?.total_fideles   ?? (communiants + nonCommuniants);
      return {
        id:           String(p.id),
        type:         'paroisse' as const,
        regionId:     String(p.region_id),
        regionName:   p.region_nom ?? '',
        districtId:   String(p.district_id),
        districtName: p.district_nom ?? '',
        name:         p.nom,
        address:      p.adresse ?? '',
        categorie:    p.categorie ?? null,
        lat:          p.latitude,
        lng:          p.longitude,
        // EXIGENCE : le modèle Paroisse a bien un champ est_active, mais
        // ParoisseListSerializer ne l'expose pas dans l'API — donc toujours
        // "true" en pratique. Pas de champ fantôme à faire semblant de lire.
        active:       true,
        stats: {
          fideles,
          communiants:    st ? communiants    : 0,
          nonCommuniants: st ? nonCommuniants : 0,
          annee:    st?.annee ?? 0,
        },
      };
    });

  // Compute district centroids from their parishes
  const dCent: Record<string, { lat: number; lng: number; n: number }> = {};
  parishes.forEach(p => {
    if (!dCent[p.districtId]) dCent[p.districtId] = { lat: 0, lng: 0, n: 0 };
    dCent[p.districtId].lat += p.lat;
    dCent[p.districtId].lng += p.lng;
    dCent[p.districtId].n++;
  });

  // Parish count per district (from all parishes, not just those with GPS)
  const districtParishCount: Record<string, number> = {};
  parRaw.forEach(p => {
    const dId = String(p.district_id);
    districtParishCount[dId] = (districtParishCount[dId] ?? 0) + 1;
  });

  // 4. Districts — les districts techniques « NON PRÉCISÉ » (paroisses
  // officielles en attente de rattachement) sont exclus de la carte et
  // des compteurs : le nombre officiel de districts est fixe (137).
  const distReels = distRaw.filter(d => d.nom !== 'NON PRÉCISÉ');
  const districts: DistrictItem[] = distReels.map(d => {
    const dId = String(d.id);
    const rId = String(d.region_id);
    const dc  = dCent[dId];
    const rc  = regionById[rId] ?? { lat: 5.0, lng: 12.5, name: '' };
    return {
      id:          dId,
      regionId:    rId,
      regionName:  d.region_nom ?? rc.name,
      name:        d.nom,
      lat:         dc ? dc.lat / dc.n : rc.lat,
      lng:         dc ? dc.lng / dc.n : rc.lng,
      parishCount: districtParishCount[dId] ?? d.nb_paroisses ?? 0,
    };
  });

  // 5. Oeuvres — only those with GPS
  const oeuvres: OeuvreItem[] = oeuRaw
    .filter((o): o is Oeuvre & { latitude: number; longitude: number } => o.latitude != null && o.longitude != null)
    .map(o => ({
      id:         String(o.id),
      type:       oeuvreTypeId(o.type_oeuvre_nom),
      typeLabel:  o.type_oeuvre_nom ?? '',
      regionId:   String(o.region_id ?? ''),
      regionName: o.region_nom ?? '',
      name:       o.nom,
      address:    o.adresse ?? '',
      lat:        o.latitude,
      lng:        o.longitude,
      capacity:   o.capacite       ?? 0,
      year:       o.annee_creation ?? 0,
      active:     o.est_active     ?? true,
    }));

  // 6. Workers
  const workers: WorkerItem[] = ouvRaw.map(w => ({
    id:           String(w.id),
    regionId:     String(w.region_id ?? ''),
    regionName:   w.region_nom ?? '',
    parishId:     w.paroisse_id != null ? String(w.paroisse_id) : null,
    parishName:   w.paroisse_nom ?? '',
    districtName: w.district_nom ?? '',
    grade:        String(w.grade_id ?? ''),
    gradeLabel:   w.grade_nom ?? '',
    name:         [w.nom, w.prenom].filter(Boolean).join(' '),
    status: w.statut === 'OCCUPE' ? 'occupe' : 'inoccupe',
  }));

  return {
    regions,
    districts,
    parishes,
    oeuvres,
    workers,
    allItems: [...parishes, ...oeuvres],
    globalStats: {
      regions:   regions.length,
      districts: distReels.length,
      parishes:  parRaw.length,
      oeuvres:   oeuRaw.length,
      workers:   ouvRaw.length,
    },
  };
}
