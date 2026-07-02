// Mock data scoped to Paroisse Bafoussam-Centre — District Bafoussam Centre — Région MIFI

export const MOCK_PAROISSE = {
  id: 201,
  nom: 'Bafoussam-Centre',
  categorie: 'C1' as const,
  district: 'Bafoussam Centre',
  region: 'MIFI',
  communiants: 520,
  nonCommuniants: 210,
  totalFideles: 730,
  baptemes: 24,
  mariages: 9,
  deces: 6,
  lat: 5.475,
  lng: 10.418,
  gps: true,
  complete: 92,
  statut: 'actif' as const,
  pasteur: 'Rév. TSAGUE Emmanuel',
  adresse: 'Avenue de l\'Indépendance, Bafoussam',
  contact: '+237 699 12 34 56',
  description: 'Paroisse mère du district Bafoussam Centre, fondée en 1952.',
  modifie: 'il y a 3 h',
  modPar: 'Nicolas ESSONO',
};

export const OUVRIERS_PAROISSE = [
  { id:1, nom:'TSAGUE Emmanuel', grade:'Pasteur',          tel:'+237 695 23 45 67', email:'e.tsague@eec.cm',   initials:'TE', color:'#5B9BD5', statut:'actif', priseFonction:'2015-03-01' },
  { id:2, nom:'DJOMO Marc',      grade:'Aide-Évangéliste', tel:'+237 677 45 67 88', email:'m.djomo@eec.cm',    initials:'MD', color:'#9B72CF', statut:'actif', priseFonction:'2020-11-08' },
  { id:3, nom:'NGUE Simone',     grade:'Catéchiste',       tel:'+237 699 12 34 56', email:'s.ngue@eec.cm',     initials:'SN', color:'#5AC472', statut:'actif', priseFonction:'2016-04-12' },
  { id:4, nom:'KENFACK Louis',   grade:'Diacre',           tel:'+237 695 67 89 01', email:'l.kenfack@eec.cm',  initials:'LK', color:'#E67A2E', statut:'actif', priseFonction:'2018-07-01' },
];

export const OEUVRES_PAROISSE = [
  { id:1, nom:'Collège EPC Bafoussam',  type:'Scolaire', beneficiaires:1240, annee:1962, responsable:'M. Jean KAMGA',    statut:'actif' },
  { id:2, nom:'Immeuble synodal MIFI',  type:'Immeuble', beneficiaires:null, annee:2008, responsable:'Service patrimoine', statut:'actif' },
  { id:3, nom:'Centre social EEC',      type:'Social',   beneficiaires:580,  annee:2015, responsable:'Service social',    statut:'actif' },
];

export const STATS_ANNUELLES_PAROISSE = [
  { annee:2020, communiants:460, noncomm:185, baptemes:18, mariages:7,  deces:4 },
  { annee:2021, communiants:476, noncomm:190, baptemes:20, mariages:8,  deces:5 },
  { annee:2022, communiants:490, noncomm:198, baptemes:22, mariages:9,  deces:5 },
  { annee:2023, communiants:505, noncomm:204, baptemes:23, mariages:8,  deces:6 },
  { annee:2024, communiants:512, noncomm:207, baptemes:23, mariages:9,  deces:5 },
  { annee:2025, communiants:520, noncomm:210, baptemes:24, mariages:9,  deces:6 },
];

export const HISTORIQUE_IO_PAROISSE = [
  { date:'20/05/2026', type:'Import statistiques', fichier:'stats_2025_Bafoussam_Centre.xlsx', statut:'Validé', who:'Nicolas ESSONO' },
  { date:'10/01/2026', type:'Import statistiques', fichier:'stats_2024_Bafoussam_Centre.xlsx', statut:'Validé', who:'Nicolas ESSONO' },
];

export const CHAMPS_COMPLETION = [
  { label:'Nom officiel',         renseigne: true },
  { label:'Pasteur en charge',    renseigne: true },
  { label:'Coordonnées GPS',      renseigne: true },
  { label:'Adresse physique',     renseigne: true },
  { label:'Contact téléphonique', renseigne: true },
  { label:'Description',          renseigne: true },
  { label:'Statistiques 2025',    renseigne: true },
  { label:'Photo principale',     renseigne: false },
  { label:'Galerie (min. 3)',     renseigne: false },
  { label:'Plan de masse',        renseigne: false },
  { label:'Statut légal',         renseigne: false },
];
