// Mock data scoped to District Bafoussam Centre — Région MIFI

export const MOCK_DISTRICT = {
  id: 101,
  nom: 'Bafoussam Centre',
  region: 'MIFI',
  nbParoisses: 8,
  nbOuvriers: 14,
  nbOeuvres: 5,
  communiants: 2520,
  nonCommuniants: 1310,
  totalFideles: 3830,
  baptemes: 68,
  mariages: 27,
  deces: 14,
  scorePerf: 84,
  admin: 'Daniel AWONO',
  adminEmail: 'd.awono@eec.cm',
};

export interface ParoisseDistrict {
  id: number; nom: string; categorie: 'C1'|'C2'|'C3';
  fideles: number; ouvriers: number; gps: boolean; complete: number;
  statut: 'actif'|'inactif'|'en_attente'; modifie: string; modPar: string;
}

export const PAROISSES_DISTRICT: ParoisseDistrict[] = [
  { id:1, nom:'Bafoussam-Centre',   categorie:'C1', fideles:892,  ouvriers:4, gps:true,  complete:92, statut:'en_attente', modifie:'il y a 3h',  modPar:'Daniel AWONO' },
  { id:2, nom:'Bafoussam-Plateau',  categorie:'C1', fideles:1140, ouvriers:3, gps:true,  complete:88, statut:'actif',      modifie:'il y a 1j',  modPar:'Daniel AWONO' },
  { id:3, nom:'Bafoussam-Kamkop',   categorie:'C2',  fideles:420,  ouvriers:2, gps:true,  complete:74, statut:'actif',      modifie:'il y a 2j',  modPar:'Système' },
  { id:4, nom:'Bafoussam-Ndongo',   categorie:'C1', fideles:620,  ouvriers:2, gps:true,  complete:68, statut:'actif',      modifie:'il y a 4j',  modPar:'Daniel AWONO' },
  { id:5, nom:'Bafoussam-Tougang',  categorie:'C2',  fideles:285,  ouvriers:1, gps:false, complete:45, statut:'actif',      modifie:'il y a 5j',  modPar:'Système' },
  { id:6, nom:'Bafoussam-Cité',     categorie:'C3',   fideles:178,  ouvriers:1, gps:false, complete:33, statut:'actif',      modifie:'il y a 6j',  modPar:'Système' },
  { id:7, nom:'Bafoussam-Famla',    categorie:'C2',  fideles:152,  ouvriers:1, gps:true,  complete:58, statut:'actif',      modifie:'il y a 8j',  modPar:'Système' },
  { id:8, nom:'Bafoussam-Djeleng',  categorie:'C3',   fideles:143,  ouvriers:0, gps:false, complete:20, statut:'en_attente', modifie:'il y a 10j', modPar:'Système' },
];

export const OUVRIERS_DISTRICT = [
  { id:1,  nom:'TCHINDA Robert',   grade:'Pasteur',         paroisse:'Bafoussam-Centre',   tel:'+237 695 23 45 67', email:'r.tchinda@eec.cm',   initials:'RT', color:'#5B9BD5', statut:'actif', priseFonction:'1999-11-18' },
  { id:2,  nom:'DJOMO Marc',       grade:'Aide-Évangéliste',paroisse:'Bafoussam-Centre',   tel:'+237 677 45 67 88', email:'m.djomo@eec.cm',      initials:'MD', color:'#9B72CF', statut:'actif', priseFonction:'2020-11-08' },
  { id:3,  nom:'NGUE Simone',      grade:'Catéchiste',      paroisse:'Bafoussam-Centre',   tel:'+237 699 12 34 56', email:'s.ngue@eec.cm',       initials:'SN', color:'#5AC472', statut:'actif', priseFonction:'2016-04-12' },
  { id:4,  nom:'KENFACK Louis',    grade:'Prédicateur',     paroisse:'Bafoussam-Plateau',  tel:'+237 695 67 89 01', email:'l.kenfack@eec.cm',    initials:'LK', color:'#E67A2E', statut:'actif', priseFonction:'2018-07-01' },
  { id:5,  nom:'MENDO Claire',     grade:'Diacre',          paroisse:'Bafoussam-Plateau',  tel:'+237 677 23 45 67', email:'c.mendo@eec.cm',      initials:'CM', color:'#FFD600', statut:'actif', priseFonction:'2012-03-20' },
  { id:6,  nom:'ESSONO Pierre',    grade:'Évangéliste',     paroisse:'Bafoussam-Plateau',  tel:'+237 698 34 56 78', email:'p.essono@eec.cm',     initials:'PE', color:'#5B9BD5', statut:'actif', priseFonction:'2008-09-14' },
  { id:7,  nom:'NKOA Jean',        grade:'Aide-Pasteur',    paroisse:'Bafoussam-Kamkop',   tel:'+237 699 45 67 89', email:'j.nkoa@eec.cm',       initials:'JN', color:'#9B72CF', statut:'actif', priseFonction:'2019-01-07' },
  { id:8,  nom:'BIWOLE Rose',      grade:'Catéchiste',      paroisse:'Bafoussam-Kamkop',   tel:'+237 677 56 78 90', email:'r.biwole@eec.cm',     initials:'BR', color:'#5AC472', statut:'actif', priseFonction:'2021-06-15' },
  { id:9,  nom:'FOPA Ernest',      grade:'Prédicateur',     paroisse:'Bafoussam-Ndongo',   tel:'+237 695 78 90 12', email:'e.fopa@eec.cm',       initials:'EF', color:'#E67A2E', statut:'actif', priseFonction:'2015-02-18' },
  { id:10, nom:'ABENG Patricia',   grade:'Aide-Évangéliste',paroisse:'Bafoussam-Ndongo',   tel:'+237 698 90 12 34', email:'p.abeng@eec.cm',      initials:'AP', color:'#FFD600', statut:'actif', priseFonction:'2022-08-10' },
  { id:11, nom:'NJOYA Samuel',     grade:'Diacre',          paroisse:'Bafoussam-Famla',    tel:'+237 677 12 34 56', email:'s.njoya@eec.cm',      initials:'SJ', color:'#5B9BD5', statut:'actif', priseFonction:'2017-12-01' },
  { id:12, nom:'TSAGUE Berthe',    grade:'Catéchiste',      paroisse:'Bafoussam-Tougang',  tel:'+237 699 23 45 67', email:'b.tsague@eec.cm',     initials:'BT', color:'#9B72CF', statut:'inactif',priseFonction:'2010-05-25' },
  { id:13, nom:'KENMOE Alain',     grade:'Évangéliste',     paroisse:'Bafoussam-Cité',     tel:'+237 695 45 67 89', email:'a.kenmoe@eec.cm',     initials:'AK', color:'#5AC472', statut:'actif', priseFonction:'2013-10-08' },
  { id:14, nom:'WEMBE Sylvie',     grade:'Aide-Pasteur',    paroisse:'Bafoussam-Djeleng',  tel:'+237 677 67 89 01', email:'s.wembe@eec.cm',      initials:'SW', color:'#E67A2E', statut:'actif', priseFonction:'2020-03-22' },
];

export const OEUVRES_DISTRICT = [
  { id:1, nom:'Collège EPC Bafoussam',         type:'Scolaire',     paroisse:'Bafoussam-Centre',  beneficiaires:1240, annee:1962, responsable:'M. Jean KAMGA',     statut:'actif' },
  { id:2, nom:'Lycée EPC Bafoussam-Plateau',   type:'Scolaire',     paroisse:'Bafoussam-Plateau', beneficiaires:820,  annee:1970, responsable:'M. Robert TCHINDA',  statut:'actif' },
  { id:3, nom:'Immeuble synodal MIFI',         type:'Immeuble',     paroisse:'Bafoussam-Centre',  beneficiaires:null, annee:2008, responsable:'Service patrimoine', statut:'actif' },
  { id:4, nom:'École maternelle EPC Ndongo',   type:'Scolaire',     paroisse:'Bafoussam-Ndongo',  beneficiaires:210,  annee:1994, responsable:'Mme Claire MENDO',   statut:'actif' },
  { id:5, nom:'Centre social EEC Bafoussam',   type:'Social',       paroisse:'Bafoussam-Centre',  beneficiaires:580,  annee:2015, responsable:'Service social',     statut:'actif' },
];

export const COMPTES_DISTRICT = [
  { nom:'Daniel AWONO',   email:'d.awono@eec.cm',    role:'Admin District', portee:'Bafoussam Centre (complet)', tfa:true,  last:'Il y a 1 h',  statut:'actif',   initials:'DA', bg:'rgba(155,114,207,0.22)', color:'#9B72CF', readonly:true },
  { nom:'Robert TCHINDA', email:'r.tchinda@eec.cm',  role:'Admin Paroisse', portee:'Bafoussam-Plateau',          tfa:true,  last:'Il y a 2 j',  statut:'actif',   initials:'RT', bg:'rgba(230,122,46,0.22)',  color:'#E67A2E', readonly:false },
  { nom:'Nicolas ESSONO', email:'n.essono@eec.cm',   role:'Admin Paroisse', portee:'Bafoussam-Centre',            tfa:false, last:'Il y a 4 j',  statut:'actif',   initials:'NE', bg:'rgba(230,122,46,0.22)',  color:'#E67A2E', readonly:false },
  { nom:'Béatrice FONG',  email:'b.fong@eec.cm',     role:'Admin Paroisse', portee:'Bafoussam-Kamkop',            tfa:false, last:'Il y a 9 j',  statut:'inactif', initials:'BF', bg:'rgba(148,163,184,0.22)', color:'#94A3B8', readonly:false },
];

export const STATS_PAROISSES_DISTRICT = [
  { paroisse:'Bafoussam-Centre',  categorie: 'C1' as const, communiants:560, noncomm:332, total:892,  ouvriers:4, score:92 },
  { paroisse:'Bafoussam-Plateau', categorie: 'C1' as const, communiants:710, noncomm:430, total:1140, ouvriers:3, score:88 },
  { paroisse:'Bafoussam-Kamkop',  categorie:'C2'  as const, communiants:265, noncomm:155, total:420,  ouvriers:2, score:74 },
  { paroisse:'Bafoussam-Ndongo',  categorie: 'C1' as const, communiants:390, noncomm:230, total:620,  ouvriers:2, score:68 },
  { paroisse:'Bafoussam-Tougang', categorie:'C2'  as const, communiants:175, noncomm:110, total:285,  ouvriers:1, score:45 },
  { paroisse:'Bafoussam-Cité',    categorie:'C3'   as const, communiants:112, noncomm:66,  total:178,  ouvriers:1, score:33 },
  { paroisse:'Bafoussam-Famla',   categorie:'C2'  as const, communiants:95,  noncomm:57,  total:152,  ouvriers:1, score:58 },
  { paroisse:'Bafoussam-Djeleng', categorie:'C3'   as const, communiants:88,  noncomm:55,  total:143,  ouvriers:0, score:20 },
];

export const JOURNAL_DISTRICT = [
  { time:'27/05 11:20', who:'Daniel AWONO',   action:'Modification', entity:'Paroisse Bafoussam-Centre',  summary:'Statistiques 2025 mises à jour · En attente validation', ip:'197.145.43.12', color:'#E65100' },
  { time:'27/05 09:14', who:'Daniel AWONO',   action:'Connexion',    entity:'Session #2041',              summary:'Authentification réussie',                                ip:'197.145.43.12', color:'#9B72CF' },
  { time:'26/05 16:30', who:'Nicolas ESSONO', action:'Modification', entity:'Paroisse Bafoussam-Centre',  summary:'Contact mis à jour · Proposition soumise au district',    ip:'105.242.16.8',  color:'#E65100' },
  { time:'26/05 14:05', who:'Daniel AWONO',   action:'Création',     entity:'Paroisse Bafoussam-Djeleng', summary:'Nouvelle annexe créée · En cours de validation',          ip:'197.145.43.12', color:'#5AC472' },
  { time:'25/05 10:48', who:'Robert TCHINDA', action:'Connexion',    entity:'Session #2030',              summary:'Authentification réussie',                                ip:'105.235.12.87', color:'#9B72CF' },
  { time:'25/05 09:22', who:'Daniel AWONO',   action:'Import',       entity:'ouvriers_BFS_Centre.xlsx',   summary:'14 ouvriers · 14 OK · 0 erreur',                          ip:'197.145.43.12', color:'#6A1B9A' },
];

export const FIDELES_EVOLUTION_DISTRICT = [
  { year:2020, comm:1980, noncomm:1040 },
  { year:2021, comm:2100, noncomm:1100 },
  { year:2022, comm:2220, noncomm:1165 },
  { year:2023, comm:2350, noncomm:1230 },
  { year:2024, comm:2450, noncomm:1275 },
  { year:2025, comm:2520, noncomm:1310 },
];
