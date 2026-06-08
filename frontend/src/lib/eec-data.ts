/* =============================================================================
   EEC Géolocalisation — Mock data (converti depuis data.jsx de Claude Design)
   22 régions · 137 districts · 576 paroisses · 311 œuvres · 685 ouvriers
   ============================================================================= */

export const REGIONS = [
  { id: 'R01', name: 'ADAMAOUA',                  admin: 'Adamaoua',          city: 'Ngaoundéré',  lat: 7.323,  lng: 13.580, radius: 0.65, districts: 5  },
  { id: 'R02', name: 'BAMBOUTOS ET NORD OUEST',   admin: 'Ouest/Nord-Ouest',  city: 'Mbouda',      lat: 5.625,  lng: 10.252, radius: 0.50, districts: 12 },
  { id: 'R03', name: 'CENTRE SUD 1',              admin: 'Centre',            city: 'Yaoundé',     lat: 3.848,  lng: 11.502, radius: 0.50, districts: 9  },
  { id: 'R04', name: 'CENTRE SUD 2',              admin: 'Sud/Centre',        city: 'Ebolowa',     lat: 2.900,  lng: 11.150, radius: 0.55, districts: 7  },
  { id: 'R05', name: 'EST',                       admin: 'Est',               city: 'Bertoua',     lat: 4.578,  lng: 13.685, radius: 0.65, districts: 5  },
  { id: 'R06', name: 'HAUT-NKAM',                 admin: 'Ouest',             city: 'Bafang',      lat: 5.154,  lng: 10.169, radius: 0.40, districts: 5  },
  { id: 'R07', name: 'HAUTS-PLATEAUX',             admin: 'Ouest',             city: 'Bangangté',   lat: 5.149,  lng: 10.523, radius: 0.35, districts: 5  },
  { id: 'R08', name: 'KOUNG KHI',                 admin: 'Ouest',             city: 'Foumban',     lat: 5.728,  lng: 10.902, radius: 0.42, districts: 5  },
  { id: 'R09', name: 'MENOUA',                    admin: 'Ouest',             city: 'Dschang',     lat: 5.447,  lng: 10.058, radius: 0.35, districts: 6  },
  { id: 'R10', name: 'MIFI',                      admin: 'Ouest',             city: 'Bafoussam',   lat: 5.475,  lng: 10.418, radius: 0.40, districts: 5  },
  { id: 'R11', name: 'MOUNGO CENTRE',             admin: 'Littoral',          city: 'Nkongsamba',  lat: 4.952,  lng: 9.937,  radius: 0.40, districts: 6  },
  { id: 'R12', name: 'MOUNGO NORD',               admin: 'Littoral',          city: 'Loum',        lat: 4.700,  lng: 9.730,  radius: 0.35, districts: 5  },
  { id: 'R13', name: 'MOUNGO SUD ET MEME',        admin: 'Littoral/Sud-Ouest',city: 'Kumba',       lat: 4.638,  lng: 9.447,  radius: 0.42, districts: 6  },
  { id: 'R14', name: 'NDE & MBAM ET INOUBOU',     admin: 'Centre',            city: 'Bafia',       lat: 4.748,  lng: 11.230, radius: 0.45, districts: 7  },
  { id: 'R15', name: 'NKAM',                      admin: 'Littoral',          city: 'Nkam',        lat: 4.800,  lng: 10.050, radius: 0.32, districts: 4  },
  { id: 'R16', name: 'NORD & EXTREME NORD',       admin: 'Nord/Extrême-Nord', city: 'Garoua',      lat: 9.900,  lng: 13.900, radius: 0.80, districts: 7  },
  { id: 'R17', name: 'NOUN NORD',                 admin: 'Ouest',             city: 'Foumban',     lat: 5.900,  lng: 10.900, radius: 0.38, districts: 5  },
  { id: 'R18', name: 'NOUN SUD',                  admin: 'Ouest',             city: 'Foumbot',     lat: 5.500,  lng: 10.660, radius: 0.35, districts: 5  },
  { id: 'R19', name: 'SANAGA MARITIME ET OCEAN',  admin: 'Littoral/Sud',      city: 'Edéa',        lat: 3.400,  lng: 10.100, radius: 0.45, districts: 6  },
  { id: 'R20', name: 'WOURI CENTRE',              admin: 'Littoral',          city: 'Douala',      lat: 4.050,  lng: 9.710,  radius: 0.40, districts: 8  },
  { id: 'R21', name: 'WOURI NORD & SUD-OUEST',    admin: 'Sud-Ouest',         city: 'Buea',        lat: 4.150,  lng: 9.300,  radius: 0.45, districts: 8  },
  { id: 'R22', name: 'WOURI SUD',                 admin: 'Littoral/Sud-Ouest',city: 'Limbe',       lat: 3.950,  lng: 9.800,  radius: 0.35, districts: 6  },
];

export const GRADES = [
  { id: 'eveque',       label: 'Évêque',           short: 'Évêque',   weight: 0.5 },
  { id: 'pasteur',      label: 'Pasteur',          short: 'Pasteur',  weight: 30 },
  { id: 'predicateur',  label: 'Prédicateur',      short: 'Préd.',    weight: 18 },
  { id: 'evangeliste',  label: 'Évangéliste',      short: 'Évang.',   weight: 16 },
  { id: 'catechiste',   label: 'Catéchiste',       short: 'Catéch.',  weight: 12 },
  { id: 'diacre',       label: 'Diacre',           short: 'Diacre',   weight: 14 },
  { id: 'aide-pasteur', label: 'Aide-Pasteur',     short: 'Aide-P.',  weight: 5 },
  { id: 'aide-evang',   label: 'Aide-Évangéliste', short: 'Aide-É.',  weight: 3 },
];

export const ENTITY_TYPES = [
  { id: 'paroisse', label: 'Paroisses',                    singular: 'Paroisse',             color: '#2E9744', target: 576 },
  { id: 'scolaire', label: 'Œuvres scolaires',             singular: 'École',                color: '#1565C0', target: 48  },
  { id: 'medical',  label: 'Structures médicales',         singular: 'Structure médicale',   color: '#B71C1C', target: 31  },
  { id: 'univ',     label: 'Universités / Inst. supér.',   singular: 'Université',           color: '#4A148C', target: 12  },
  { id: 'agro',     label: 'Domaines agropastoraux',       singular: 'Domaine agropastoral', color: '#E65100', target: 28  },
  { id: 'immeuble', label: 'Immeubles EEC',                singular: 'Immeuble',             color: '#455A64', target: 89  },
  { id: 'terrain',  label: 'Terrains EEC',                 singular: 'Terrain',              color: '#5D4037', target: 103 },
];

const DISTRICT_SUFFIXES = ['Centre','Nord','Sud','Est','Ouest','Akwa','Bonabéri','Bonapriso','Mfoundi','Mvog-Mbi','Ngoa-Ekellé','Nlongkak','Bastos','Marché','Plateau','Tongo','Banengo','Tsinga','Briqueterie','Mokolo','Mendong','Deido','New Bell','Bépanda','Logbessou','Up Station','Down Town','Mile 17','Buea Town','Molyko','Banja','Bafou','Bandjoun','Baham','Bayangam'];
const NAMES_M = ['Jean-Marie','Paul','Emmanuel','Joseph','Daniel','Pierre','Samuel','Étienne','François','Jacques','Martin','Benoît','Joël','André','Théodore','Léon','Henri','Robert','Charles','Bernard'];
const NAMES_F = ['Marie-Claire','Hortense','Jeanne','Esther','Solange','Bernadette','Cécile','Pauline','Yvonne','Madeleine','Élisabeth','Rebecca','Ruth','Lydie','Agnès','Suzanne'];
const SURNAMES = ['Ekanga','Ateba','Biya','Mvondo','Eyenga','Owona','Mballa','Essomba','Ndongo','Nkomo','Tchoumi','Kamdem','Nguefack','Fotso','Tchaptchet','Sop','Wouassi','Tsafack','Djamou','Mbarga','Etoundi','Ndoumbé','Nyobe','Bahoken','Ngongang','Kemajou','Ndi','Tabi','Bongmba'];
const SCHOOL_NAMES = ['École Primaire EEC','Collège Évangélique','Lycée Évangélique EEC','École Maternelle EEC','Collège Bilingue EEC'];
const MEDIC_NAMES  = ['Dispensaire EEC','Hôpital Protestant','Centre de Santé EEC','Clinique EEC','Centre médico-social EEC'];
const UNIV_NAMES   = ["Université Protestante d'Afrique Centrale",'Faculté de Théologie Protestante','Institut Supérieur de Théologie','École Pastorale EEC'];
const AGRO_NAMES   = ['Domaine agropastoral EEC','Ferme expérimentale EEC','Plantation EEC','Exploitation agricole EEC'];
const BLDG_NAMES   = ['Immeuble du Synode','Maison Pastorale','Centre Administratif EEC','Presbytère','Foyer Évangélique','Salle paroissiale'];
const LAND_NAMES   = ['Terrain EEC','Parcelle synodale','Domaine foncier EEC'];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260525);
const pick = (arr: string[]) => arr[Math.floor(rand() * arr.length)];
const pickWeighted = (arr: typeof GRADES) => {
  const sum = arr.reduce((s, x) => s + x.weight, 0);
  let r = rand() * sum;
  for (const x of arr) { r -= x.weight; if (r <= 0) return x; }
  return arr[arr.length - 1];
};
const jitter = (m: number, amp: number) => m + (rand() - 0.5) * 2 * amp;

function buildDistricts() {
  const districts: { id: string; regionId: string; name: string; lat: number; lng: number }[] = [];
  let dId = 1;
  REGIONS.forEach(r => {
    const used = new Set<string>();
    for (let i = 0; i < r.districts; i++) {
      let suffix: string;
      do { suffix = pick(DISTRICT_SUFFIXES); } while (used.has(suffix));
      used.add(suffix);
      districts.push({
        id: 'D' + String(dId++).padStart(3, '0'),
        regionId: r.id,
        name: `District de ${r.city}-${suffix}`,
        lat: jitter(r.lat, r.radius * 0.55),
        lng: jitter(r.lng, r.radius * 0.55),
      });
    }
  });
  return districts;
}

function parishName(idx: number, city: string) {
  const tags = ['Centre','Nord','Sud','Est','Ouest','Trinité','Jérusalem','Bethléem','Emmanuel','Béthel','Salem','Béthesda','Galaad','Élim','Carmel'];
  return `Paroisse de ${city}-${tags[(idx * 7) % tags.length]}`;
}

function buildParishes(districts: ReturnType<typeof buildDistricts>) {
  const out: { id: string; type: string; regionId: string; districtId: string; name: string; lat: number; lng: number; stats: { fideles: number; communiants: number; nonCommuniants: number; baptemes: number; mariages: number; deces: number }; photo: boolean }[] = [];
  const TARGET = 576;
  const perDistrict = Math.max(2, Math.floor(TARGET / districts.length));
  let pId = 1;
  districts.forEach(d => {
    const region = REGIONS.find(r => r.id === d.regionId)!;
    const n = perDistrict + Math.floor(rand() * 3);
    for (let i = 0; i < n && pId <= TARGET; i++) {
      const fid = Math.floor(80 + rand() * 480);
      const commun = Math.floor(fid * (0.55 + rand() * 0.20));
      out.push({
        id: 'P' + String(pId).padStart(4, '0'),
        type: 'paroisse',
        regionId: d.regionId,
        districtId: d.id,
        name: parishName(pId, region.city),
        lat: jitter(d.lat, 0.08),
        lng: jitter(d.lng, 0.08),
        stats: { fideles: fid, communiants: commun, nonCommuniants: fid - commun, baptemes: Math.floor(8 + rand() * 30), mariages: Math.floor(2 + rand() * 12), deces: Math.floor(rand() * 6) },
        photo: pId % 7 === 0,
      });
      pId++;
    }
  });
  return out.slice(0, TARGET);
}

function buildOeuvres() {
  const out: { id: string; type: string; regionId: string; name: string; lat: number; lng: number; capacity: number; year: number }[] = [];
  let id = 1;
  ENTITY_TYPES.filter(t => t.id !== 'paroisse').forEach(type => {
    for (let i = 0; i < type.target; i++) {
      const r = REGIONS[Math.floor(rand() * REGIONS.length)];
      let name = '';
      switch (type.id) {
        case 'scolaire': name = `${pick(SCHOOL_NAMES)} de ${r.city}`; break;
        case 'medical':  name = `${pick(MEDIC_NAMES)} de ${r.city}`; break;
        case 'univ':     name = `${pick(UNIV_NAMES)} — ${r.city}`; break;
        case 'agro':     name = `${pick(AGRO_NAMES)} de ${r.city}`; break;
        case 'immeuble': name = `${pick(BLDG_NAMES)} — ${r.city}`; break;
        case 'terrain':  name = `${pick(LAND_NAMES)} de ${r.city} (Lot ${i + 1})`; break;
        default: name = `${type.singular} ${i + 1}`;
      }
      out.push({ id: 'O' + String(id++).padStart(4, '0'), type: type.id, regionId: r.id, name, lat: jitter(r.lat, r.radius * 0.6), lng: jitter(r.lng, r.radius * 0.6), capacity: Math.floor(40 + rand() * 600), year: 1950 + Math.floor(rand() * 73) });
    }
  });
  return out;
}

function buildWorkers(parishes: ReturnType<typeof buildParishes>) {
  const out: { id: string; regionId: string; parishId: string | null; grade: string; gradeLabel: string; name: string; status: string }[] = [];
  let id = 1;
  REGIONS.forEach(r => {
    out.push({ id: 'W' + String(id++).padStart(4, '0'), regionId: r.id, parishId: null, grade: 'eveque', gradeLabel: 'Évêque', name: `${pick(NAMES_M)} ${pick(SURNAMES)}`, status: 'actif' });
  });
  let pIdx = 0;
  while (id <= 685 && parishes.length > 0) {
    const parish = parishes[pIdx % parishes.length];
    const grade = pickWeighted(GRADES.filter(g => g.id !== 'eveque'));
    const isF = rand() < 0.2 && (grade.id === 'diacre' || grade.id === 'catechiste');
    const first = isF ? pick(NAMES_F) : pick(NAMES_M);
    const status = rand() < 0.86 ? 'actif' : (rand() < 0.85 ? 'retraite' : 'suspendu');
    out.push({ id: 'W' + String(id++).padStart(4, '0'), regionId: parish.regionId, parishId: parish.id, grade: grade.id, gradeLabel: grade.label, name: `${first} ${pick(SURNAMES)}`, status });
    pIdx++;
  }
  return out;
}

export const DISTRICTS = buildDistricts();
export const PARISHES  = buildParishes(DISTRICTS);
export const OEUVRES   = buildOeuvres();
export const WORKERS   = buildWorkers(PARISHES);

export const ENTITY_COUNTS = ENTITY_TYPES.reduce((acc, t) => {
  acc[t.id] = t.id === 'paroisse' ? PARISHES.length : OEUVRES.filter(o => o.type === t.id).length;
  return acc;
}, {} as Record<string, number>);

export const ALL_ITEMS = [...PARISHES, ...OEUVRES];

export const EEC_DATA = { REGIONS, DISTRICTS, PARISHES, OEUVRES, WORKERS, ENTITY_TYPES, ENTITY_COUNTS, GRADES, ALL_ITEMS };
export type EECItem = typeof ALL_ITEMS[number];
export type Region  = typeof REGIONS[number];
export type District = typeof DISTRICTS[number];
