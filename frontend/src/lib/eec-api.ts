/* =============================================================================
   EEC Géolocalisation — API data loader
   Fetches real data from Django backend and maps to frontend types
   ============================================================================= */

const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api')
  .replace(/\/api\/?$/, '');

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export interface RegionItem {
  id: string; name: string; admin: string; city: string;
  lat: number; lng: number; radius: number; districts: number;
  geometry?: any; // GeoJSON geometry (Polygon/MultiPolygon) depuis PostGIS
}
export interface DistrictItem {
  id: string; regionId: string; regionName: string; name: string;
  lat: number; lng: number; parishCount: number;
}
export interface ParishItem {
  id: string; type: 'paroisse'; regionId: string; regionName: string;
  districtId: string; districtName: string;
  name: string; address: string; niveau: string;
  lat: number; lng: number;
  stats: {
    fideles: number; communiants: number; nonCommuniants: number;
    baptemes: number; mariages: number; deces: number; annee: number;
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
      const r: Response = await fetch(url, { credentials: 'include' });
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
function geoCentroid(geom: { type: string; coordinates: unknown }): [number, number] {
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
    fetch(`${API}/api/geo/regions/`, { credentials: 'include' })
      .then(r => r.json())
      .catch(() => ({ features: [] })),
    fetchAllPages<Record<string, unknown>>('geo/districts/'),
    fetchAllPages<Record<string, unknown>>('geo/paroisses/'),
    fetchAllPages<Record<string, unknown>>('oeuvres/oeuvres/'),
    fetchAllPages<Record<string, unknown>>('ouvriers/ouvriers/'),
    fetchAllPages<Record<string, unknown>>('statistiques/'),
  ]);

  // 1. Regions — from GeoJSON FeatureCollection.
  // Robuste : accepte le FeatureCollection direct { features } OU la forme paginée
  // { results: { features } } au cas où la pagination serait réactivée.
  const rg = regGeoRes as { features?: unknown[]; results?: { features?: unknown[] } };
  const features: unknown[] = rg.features ?? rg.results?.features ?? [];
  const regions: RegionItem[] = (features as any[]).map(f => {
    const [lat, lng] = geoCentroid(f.geometry);
    return {
      id: String(f.properties.id),
      name: f.properties.nom as string,
      admin: f.properties.nom as string,
      city: f.properties.nom as string,
      lat, lng,
      radius: 0.4,
      districts: (f.properties.nb_districts as number) ?? 0,
      geometry: f.geometry,
    };
  });

  const regionById: Record<string, { lat: number; lng: number; name: string }> = {};
  regions.forEach(r => { regionById[r.id] = { lat: r.lat, lng: r.lng, name: r.name }; });

  // 2. Statistics — most recent year per paroisse
  const statsByPar: Record<number, Record<string, unknown>> = {};
  (statsRaw as any[]).forEach(s => {
    const ex = statsByPar[s.paroisse as number];
    if (!ex || (s.annee as number) > (ex.annee as number)) {
      statsByPar[s.paroisse as number] = s;
    }
  });

  // 3. Parishes — only those with GPS coordinates
  const parishes: ParishItem[] = (parRaw as any[])
    .filter(p => p.latitude != null && p.longitude != null)
    .map(p => {
      const st = statsByPar[p.id as number];
      const communiants    = (st?.communiants    as number) ?? 0;
      const nonCommuniants = (st?.non_communiants as number) ?? 0;
      const fideles        = (st?.total_fideles   as number) ?? (communiants + nonCommuniants);
      return {
        id:           String(p.id),
        type:         'paroisse' as const,
        regionId:     String(p.region_id),
        regionName:   (p.region_nom  as string) ?? '',
        districtId:   String(p.district_id),
        districtName: (p.district_nom as string) ?? '',
        name:         (p.nom         as string),
        address:      (p.adresse     as string) ?? '',
        niveau:       (p.niveau      as string) ?? 'PAROISSE',
        lat:          p.latitude  as number,
        lng:          p.longitude as number,
        active:       (p.est_active  as boolean) ?? true,
        stats: {
          fideles,
          communiants:    st ? communiants    : 0,
          nonCommuniants: st ? nonCommuniants : 0,
          baptemes: (st?.baptemes as number) ?? 0,
          mariages: (st?.mariages as number) ?? 0,
          deces:    (st?.deces    as number) ?? 0,
          annee:    (st?.annee    as number) ?? 0,
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
  (parRaw as any[]).forEach(p => {
    const dId = String(p.district_id);
    districtParishCount[dId] = (districtParishCount[dId] ?? 0) + 1;
  });

  // 4. Districts
  const districts: DistrictItem[] = (distRaw as any[]).map(d => {
    const dId = String(d.id);
    const rId = String(d.region_id);
    const dc  = dCent[dId];
    const rc  = regionById[rId] ?? { lat: 5.0, lng: 12.5, name: '' };
    return {
      id:          dId,
      regionId:    rId,
      regionName:  (d.region_nom as string) ?? rc.name,
      name:        d.nom as string,
      lat:         dc ? dc.lat / dc.n : rc.lat,
      lng:         dc ? dc.lng / dc.n : rc.lng,
      parishCount: districtParishCount[dId] ?? (d.nb_paroisses as number) ?? 0,
    };
  });

  // 5. Oeuvres — only those with GPS
  const oeuvres: OeuvreItem[] = (oeuRaw as any[])
    .filter(o => o.latitude != null && o.longitude != null)
    .map(o => ({
      id:         String(o.id),
      type:       oeuvreTypeId(o.type_oeuvre_nom as string),
      typeLabel:  (o.type_oeuvre_nom as string) ?? '',
      regionId:   String(o.region_id ?? ''),
      regionName: (o.region_nom as string) ?? '',
      name:       o.nom as string,
      address:    (o.adresse as string) ?? '',
      lat:        o.latitude  as number,
      lng:        o.longitude as number,
      capacity:   (o.capacite        as number) ?? 0,
      year:       (o.annee_creation  as number) ?? 0,
      active:     (o.est_active      as boolean) ?? true,
    }));

  // 6. Workers
  const workers: WorkerItem[] = (ouvRaw as any[]).map(w => ({
    id:           String(w.id),
    regionId:     String(w.region_id ?? ''),
    regionName:   (w.region_nom   as string) ?? '',
    parishId:     w.paroisse_id != null ? String(w.paroisse_id) : null,
    parishName:   (w.paroisse_nom as string) ?? '',
    districtName: (w.district_nom as string) ?? '',
    grade:        String(w.grade_id ?? ''),
    gradeLabel:   (w.grade_nom    as string) ?? '',
    name:         [w.nom, w.prenom].filter(Boolean).join(' '),
    status: w.statut === 'actif'     ? 'actif'
           : w.statut === 'retraite' ? 'retraite'
           : 'suspendu',
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
      districts: distRaw.length,
      parishes:  parRaw.length,
      oeuvres:   oeuRaw.length,
      workers:   ouvRaw.length,
    },
  };
}
