// Mock data scoped to Région Synodale MIFI

export const MOCK_REGION_MIFI = {
  nom: 'MIFI',
  id: 10,
  nbParoisses: 48,
  nbDistricts: 6,
  nbOuvriers: 82,
  nbOeuvres: 21,
  communiants: 7800,
  nonCommuiants: 4650,
  totalFideles: 12450,
  scorePerf: 91,
  admin: 'Paul ATEBA',
  adminEmail: 'p.ateba@eec.cm',
};

export const DISTRICTS_MIFI = [
  { id:1,  nom:'BAFOUSSAM CENTRE', region:'MIFI', paroisses:11, fideles:3800, ouvriers:22, admin:'—',            adminInitials:null,  modifie:'il y a 6 j',  statut:'actif' as const },
  { id:2,  nom:'BAFOUSSAM NORD',   region:'MIFI', paroisses:14, fideles:4100, ouvriers:28, admin:'Paul ATEBA',   adminInitials:'PA',  modifie:'il y a 2 h',  statut:'actif' as const },
  { id:3,  nom:'BAFOUSSAM SUD',    region:'MIFI', paroisses:9,  fideles:2900, ouvriers:16, admin:'—',            adminInitials:null,  modifie:'il y a 3 j',  statut:'actif' as const },
  { id:4,  nom:'BAHAM',            region:'MIFI', paroisses:12, fideles:3200, ouvriers:18, admin:'—',            adminInitials:null,  modifie:'il y a 8 j',  statut:'en_attente' as const },
  { id:5,  nom:'NKAM',             region:'MIFI', paroisses:7,  fideles:2100, ouvriers:12, admin:'—',            adminInitials:null,  modifie:'il y a 10 j', statut:'actif' as const },
  { id:6,  nom:'KOUNG-KHI',        region:'MIFI', paroisses:8,  fideles:2350, ouvriers:14, admin:'Brice FOKOU',  adminInitials:'BF',  modifie:'il y a 1 j',  statut:'en_attente' as const },
];

export interface ParoisseMifi {
  id: number; nom: string; district: string; categorie: 'C1'|'C2'|'C3';
  fideles: number; ouvriers: number; gps: boolean; complete: number;
  statut: 'actif'|'inactif'|'en_attente'; modifie: string; modPar: string;
}

export const PAROISSES_MIFI: ParoisseMifi[] = [
  { id:1,  nom:'Bafoussam-Centre',     district:'BAFOUSSAM CENTRE', categorie:'C1', fideles:892,  ouvriers:14, gps:true,  complete:88, statut:'en_attente', modifie:'il y a 3h',  modPar:'Paul ATEBA' },
  { id:2,  nom:'Bafoussam-Plateau',    district:'BAFOUSSAM CENTRE', categorie:'C1', fideles:1140, ouvriers:18, gps:true,  complete:92, statut:'actif',      modifie:'il y a 1j',  modPar:'Paul ATEBA' },
  { id:3,  nom:'Bafoussam-Kamkop',     district:'BAFOUSSAM CENTRE', categorie:'C2',  fideles:420,  ouvriers:8,  gps:true,  complete:74, statut:'actif',      modifie:'il y a 2j',  modPar:'Système' },
  { id:4,  nom:'Bafoussam-Nord',       district:'BAFOUSSAM NORD',   categorie:'C1', fideles:765,  ouvriers:12, gps:true,  complete:84, statut:'actif',      modifie:'il y a 4h',  modPar:'Samuel KAMTO' },
  { id:5,  nom:'Bafoussam-Tamdja',     district:'BAFOUSSAM NORD',   categorie:'C2',  fideles:285,  ouvriers:5,  gps:false, complete:45, statut:'actif',      modifie:'il y a 5j',  modPar:'Système' },
  { id:6,  nom:'Bafoussam-Tougang',    district:'BAFOUSSAM NORD',   categorie:'C3',   fideles:138,  ouvriers:3,  gps:true,  complete:60, statut:'actif',      modifie:'il y a 6j',  modPar:'Samuel KAMTO' },
  { id:7,  nom:'Bafoussam-Sud',        district:'BAFOUSSAM SUD',    categorie:'C1', fideles:698,  ouvriers:11, gps:true,  complete:79, statut:'actif',      modifie:'il y a 2j',  modPar:'Paul ATEBA' },
  { id:8,  nom:'Bafoussam-Djemoun',    district:'BAFOUSSAM SUD',    categorie:'C2',  fideles:312,  ouvriers:6,  gps:false, complete:38, statut:'actif',      modifie:'il y a 7j',  modPar:'Système' },
  { id:9,  nom:'Baham-Centre',         district:'BAHAM',            categorie:'C1', fideles:320,  ouvriers:7,  gps:true,  complete:65, statut:'actif',      modifie:'il y a 2j',  modPar:'Paul ATEBA' },
  { id:10, nom:'Baham-Nord',           district:'BAHAM',            categorie:'C2',  fideles:185,  ouvriers:4,  gps:true,  complete:55, statut:'actif',      modifie:'il y a 4j',  modPar:'Système' },
  { id:11, nom:'Baham-Est',            district:'BAHAM',            categorie:'C3',   fideles:142,  ouvriers:2,  gps:false, complete:30, statut:'inactif',    modifie:'il y a 9j',  modPar:'Système' },
  { id:12, nom:'Baham-Forêt',          district:'BAHAM',            categorie:'C3',   fideles:98,   ouvriers:2,  gps:false, complete:25, statut:'actif',      modifie:'il y a 10j', modPar:'Système' },
  { id:13, nom:'Bamendjou',            district:'NKAM',             categorie:'C1', fideles:487,  ouvriers:9,  gps:true,  complete:71, statut:'actif',      modifie:'il y a 3j',  modPar:'Système' },
  { id:14, nom:'Nkouoptamo',           district:'NKAM',             categorie:'C2',  fideles:211,  ouvriers:4,  gps:false, complete:40, statut:'actif',      modifie:'il y a 8j',  modPar:'Système' },
  { id:15, nom:'Koupan-Centre',        district:'KOUNG-KHI',        categorie:'C1', fideles:412,  ouvriers:8,  gps:true,  complete:68, statut:'actif',      modifie:'il y a 1j',  modPar:'Brice FOKOU' },
  { id:16, nom:'Kouoptamo Station',    district:'KOUNG-KHI',        categorie:'C2',  fideles:178,  ouvriers:3,  gps:false, complete:35, statut:'en_attente', modifie:'il y a 2j',  modPar:'Brice FOKOU' },
];

export const OEUVRES_MIFI = [
  { id:1, nom:'Collège EPC Bafoussam',         type:'Scolaire',     district:'BAFOUSSAM CENTRE', paroisse:'Bafoussam-Centre',  annee:1962, beneficiaires:1240, responsable:'M. Jean KAMGA',      statut:'actif' },
  { id:2, nom:'École primaire EPC Baham',       type:'Scolaire',     district:'BAHAM',            paroisse:'Baham-Centre',      annee:1978, beneficiaires:480,  responsable:'Mme Odile TAPEU',     statut:'actif' },
  { id:3, nom:'Centre de santé EEC Bafoussam',  type:'Médical',      district:'BAFOUSSAM NORD',   paroisse:'Bafoussam-Nord',    annee:1991, beneficiaires:3400, responsable:'Dr. Samuel KAMTO',    statut:'actif' },
  { id:4, nom:'Ferme agropastorale Bamendjou',  type:'Agropastoral', district:'NKAM',             paroisse:'Bamendjou',         annee:2002, beneficiaires:95,   responsable:'M. Pierre NKWETE',    statut:'actif' },
  { id:5, nom:'Lycée EPC Bafoussam-Plateau',    type:'Scolaire',     district:'BAFOUSSAM CENTRE', paroisse:'Bafoussam-Plateau', annee:1970, beneficiaires:820,  responsable:'M. Robert TCHINDA',   statut:'actif' },
  { id:6, nom:'Immeuble synodal MIFI',          type:'Immeuble',     district:'BAFOUSSAM CENTRE', paroisse:'Bafoussam-Centre',  annee:2008, beneficiaires:null, responsable:'Service patrimoine',  statut:'actif' },
  { id:7, nom:'École maternelle EPC Baham-Nord',type:'Scolaire',     district:'BAHAM',            paroisse:'Baham-Nord',        annee:1985, beneficiaires:120,  responsable:'Mme Suzanne FOTSO',   statut:'actif' },
  { id:8, nom:'Dispensaire EEC Koupan',         type:'Médical',      district:'KOUNG-KHI',        paroisse:'Koupan-Centre',     annee:1997, beneficiaires:1100, responsable:'Inf. major Berthe F.', statut:'actif' },
];

export const OUVRIERS_MIFI = [
  { id:1,  nom:'KAMTO Samuel',          grade:'Pasteur',          district:'BAFOUSSAM NORD',   paroisse:'Bafoussam-Nord',    tel:'+237 698 22 11 09', priseFonction:'2002-06-15', initials:'SK', statut:'actif' },
  { id:2,  nom:'MBARGA Charles',        grade:'Prédicateur',      district:'BAFOUSSAM NORD',   paroisse:'Bafoussam-Nord',    tel:'+237 698 56 34 12', priseFonction:'2013-08-10', initials:'CM', statut:'actif' },
  { id:3,  nom:'ATEBA Paul',            grade:'Évangéliste',      district:'BAHAM',            paroisse:'Baham-Centre',      tel:'+237 695 11 22 33', priseFonction:'2007-04-18', initials:'PA', statut:'actif' },
  { id:4,  nom:'FOKOU Brice',           grade:'Pasteur',          district:'KOUNG-KHI',        paroisse:'Koupan-Centre',     tel:'+237 699 34 56 78', priseFonction:'2010-01-20', initials:'BF', statut:'actif' },
  { id:5,  nom:'TAPEU Odile',           grade:'Catéchiste',       district:'BAHAM',            paroisse:'Baham-Centre',      tel:'+237 677 89 12 34', priseFonction:'2015-09-05', initials:'OT', statut:'actif' },
  { id:6,  nom:'NKWETE Pierre',         grade:'Évangéliste',      district:'NKAM',             paroisse:'Bamendjou',         tel:'+237 698 67 89 01', priseFonction:'2009-03-12', initials:'PN', statut:'actif' },
  { id:7,  nom:'TCHINDA Robert',        grade:'Pasteur',          district:'BAFOUSSAM CENTRE', paroisse:'Bafoussam-Plateau', tel:'+237 695 23 45 67', priseFonction:'1999-11-18', initials:'RT', statut:'actif' },
  { id:8,  nom:'DJOMO Marc',            grade:'Aide-Évangéliste', district:'BAFOUSSAM CENTRE', paroisse:'Bafoussam-Kamkop',  tel:'+237 677 45 67 88', priseFonction:'2020-11-08', initials:'MD', statut:'actif' },
  { id:9,  nom:'FOTSO Pauline',         grade:'Catéchiste',       district:'BAFOUSSAM NORD',   paroisse:'Bafoussam-Tougang', tel:'+237 698 12 56 87', priseFonction:'2019-03-15', initials:'PF', statut:'inactif' },
  { id:10, nom:'NGUETSA Lionel',        grade:'Aide-Pasteur',     district:'BAFOUSSAM SUD',    paroisse:'Bafoussam-Sud',     tel:'+237 699 78 23 10', priseFonction:'2017-06-22', initials:'LN', statut:'actif' },
  { id:11, nom:'KENGNE Henriette',      grade:'Diacre',           district:'BAHAM',            paroisse:'Baham-Nord',        tel:'+237 695 34 12 56', priseFonction:'2014-02-08', initials:'HK', statut:'actif' },
  { id:12, nom:'TOUZÉ Germain',         grade:'Prédicateur',      district:'NKAM',             paroisse:'Bamendjou',         tel:'+237 677 56 78 90', priseFonction:'2011-07-30', initials:'GT', statut:'actif' },
];

export const COMPTES_REGION_MIFI = [
  { nom:'Paul ATEBA',      email:'p.ateba@eec.cm',    role:'Admin Régional', portee:'MIFI (complète)',         tfa:true,  last:'Il y a 1 h',  statut:'actif', initials:'PA', bg:'rgba(91,155,213,0.22)',  color:'#5B9BD5' },
  { nom:'Samuel KAMTO',    email:'s.kamto@eec.cm',    role:'Admin District', portee:'MIFI / BAFOUSSAM NORD',  tfa:false, last:'Il y a 3 h',  statut:'actif', initials:'SK', bg:'rgba(230,81,0,0.22)',    color:'#E67A2E' },
  { nom:'Brice FOKOU',     email:'b.fokou@eec.cm',    role:'Admin District', portee:'MIFI / KOUNG-KHI',       tfa:true,  last:'Hier 22:14',  statut:'actif', initials:'BF', bg:'rgba(230,81,0,0.22)',    color:'#E67A2E' },
  { nom:'Odile TAPEU',     email:'o.tapeu@eec.cm',    role:'Admin Paroisse', portee:'Baham-Centre',           tfa:false, last:'Il y a 2 j',  statut:'actif', initials:'OT', bg:'rgba(46,151,68,0.22)',   color:'#5AC472' },
  { nom:'Pierre NKWETE',   email:'p.nkwete@eec.cm',   role:'Admin Paroisse', portee:'Bamendjou',              tfa:false, last:'Il y a 4 j',  statut:'actif', initials:'PN', bg:'rgba(46,151,68,0.22)',   color:'#5AC472' },
  { nom:'Robert TCHINDA',  email:'r.tchinda@eec.cm',  role:'Admin Paroisse', portee:'Bafoussam-Plateau',      tfa:true,  last:'Il y a 5 j',  statut:'inactif',initials:'RT', bg:'rgba(148,163,184,0.22)', color:'#94A3B8' },
];

export const STATS_DISTRICTS_MIFI = [
  { district:'BAFOUSSAM CENTRE', communiants:2400, noncomm:1400, total:3800, paroisses:11, ouvriers:22, score:88 },
  { district:'BAFOUSSAM NORD',   communiants:2600, noncomm:1500, total:4100, paroisses:14, ouvriers:28, score:91 },
  { district:'BAFOUSSAM SUD',    communiants:1800, noncomm:1100, total:2900, paroisses:9,  ouvriers:16, score:79 },
  { district:'BAHAM',            communiants:2000, noncomm:1200, total:3200, paroisses:12, ouvriers:18, score:65 },
  { district:'NKAM',             communiants:1300, noncomm:800,  total:2100, paroisses:7,  ouvriers:12, score:71 },
  { district:'KOUNG-KHI',        communiants:1500, noncomm:850,  total:2350, paroisses:8,  ouvriers:14, score:68 },
];

export const JOURNAL_MIFI = [
  { time:'26/05 14:32', who:'Paul ATEBA',      action:'Modification', entity:'Paroisse Bafoussam-Nord',       summary:'GPS ajouté · Statut → En attente validation',  ip:'197.145.43.12', color:'#E65100', icon:'pencil' },
  { time:'26/05 12:10', who:'Samuel KAMTO',    action:'Connexion',    entity:'Session #1821',                 summary:'Authentification réussie',                     ip:'197.149.43.15', color:'#5B9BD5', icon:'shield' },
  { time:'26/05 11:04', who:'Brice FOKOU',     action:'Création',     entity:'Paroisse Kouoptamo Station',    summary:'Nouvelle station · District KOUNG-KHI',        ip:'154.72.45.10',  color:'#5AC472', icon:'plus' },
  { time:'25/05 16:48', who:'Paul ATEBA',      action:'Import',       entity:'paroisses_MIFI_2026.xlsx',      summary:'16 lignes · 15 OK · 1 erreur GPS',            ip:'197.145.43.12', color:'#6A1B9A', icon:'upload' },
  { time:'25/05 09:22', who:'Odile TAPEU',     action:'Modification', entity:'Statistiques 2025 — Baham',     summary:'Communiants 305→320 · Soumis pour validation', ip:'237.110.8.54',  color:'#E65100', icon:'pencil' },
  { time:'24/05 14:55', who:'Paul ATEBA',      action:'Export',       entity:'Rapport PDF — Région MIFI',     summary:'Format PDF · 8 pages · 48 paroisses',         ip:'197.145.43.12', color:'#94A3B8', icon:'download' },
  { time:'24/05 11:30', who:'Robert TCHINDA',  action:'Connexion',    entity:'Session #1802',                 summary:'Authentification réussie',                     ip:'105.235.12.87', color:'#5B9BD5', icon:'shield' },
];

export const FIDELESEVOLUTION_MIFI = [
  { year:2020, comm:6100, noncomm:3700 },
  { year:2021, comm:6400, noncomm:3900 },
  { year:2022, comm:6800, noncomm:4100 },
  { year:2023, comm:7200, noncomm:4300 },
  { year:2024, comm:7500, noncomm:4500 },
  { year:2025, comm:7800, noncomm:4650 },
];
