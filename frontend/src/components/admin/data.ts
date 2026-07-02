// EEC Admin platform data

export const REGIONS_22 = [
  'ADAMAOUA','BAMBOUTOS ET NORD OUEST','CENTRE SUD 1','CENTRE SUD 2','EST',
  'HAUT-NKAM','HAUTS-PLATEAUX','KOUNG KHI','MENOUA','MIFI',
  'MOUNGO CENTRE','MOUNGO NORD','MOUNGO SUD ET MEME','NDE & MBAM ET INOUBOU','NKAM',
  'NORD & EXTREME NORD','NOUN NORD','NOUN SUD','SANAGA MARITIME ET OCEAN','WOURI CENTRE',
  'WOURI NORD & SUD-OUEST','WOURI SUD',
] as const;

export const DISTRICTS_BY_REGION: Record<string, string[]> = {
  'MIFI':         ['BAFOUSSAM CENTRE','BAFOUSSAM NORD','BAFOUSSAM SUD','BAHAM','NKAM'],
  'MENOUA':       ['DSCHANG','FOKOUE','FONGO-TONGO','NKONG-ZEM','PENKA-MICHEL'],
  'WOURI CENTRE': ['DEIDO','DOUALA CENTRE','BONABERI','NEW-BELL','BASSA'],
  'CENTRE SUD 1': ['YAOUNDE CENTRE','YAOUNDE NORD','YAOUNDE SUD','MFOU','OBALA'],
  'CENTRE SUD 2': ['EBOLOWA','KRIBI','SANGMELIMA','MEYOMESSALA'],
  'ADAMAOUA':     ['NGAOUNDERE','TIBATI','MEIGANGA','BANYO'],
  'EST':          ['BERTOUA','BATOURI','ABONG-MBANG','YOKADOUMA'],
  'HAUT-NKAM':    ['BAFANG','BANA','BANDJA','KEKEM'],
  'HAUTS-PLATEAUX':['BANGOU','BANGANG','BAHAM','BATIE'],
};

export interface Paroisse {
  id: number; nom: string; region: string; district: string; categorie: 'C1'|'C2'|'C3';
  fideles: number; ouvriers: number; gps: boolean; complete: number;
  statut: 'actif'|'inactif'|'en_attente'; modifie: string; modPar: string;
}

export const sampleParoisses: Paroisse[] = [
  { id:1,  nom:'Yaoundé-Centre',       region:'CENTRE SUD 1',  district:'YAOUNDE CENTRE', categorie:'C1', fideles:1247, ouvriers:18, gps:true,  complete:96, statut:'actif',      modifie:'il y a 2h',  modPar:'Marie-Claire BIYA' },
  { id:2,  nom:'Bafoussam-Nord',        region:'MIFI',          district:'BAFOUSSAM NORD', categorie:'C1', fideles:892,  ouvriers:14, gps:true,  complete:88, statut:'en_attente', modifie:'il y a 3h',  modPar:'Paul ATEBA' },
  { id:3,  nom:'Douala-Akwa',           region:'WOURI CENTRE',  district:'DOUALA CENTRE',  categorie:'C1', fideles:1583, ouvriers:22, gps:true,  complete:92, statut:'actif',      modifie:'il y a 5h',  modPar:'Système' },
  { id:4,  nom:'Dschang Mission',       region:'MENOUA',        district:'DSCHANG',        categorie:'C1', fideles:734,  ouvriers:11, gps:true,  complete:78, statut:'actif',      modifie:'hier',       modPar:'Eric NDJI' },
  { id:5,  nom:'Baham-Centre',          region:'MIFI',          district:'BAHAM',          categorie:'C1', fideles:320,  ouvriers:7,  gps:true,  complete:65, statut:'actif',      modifie:'hier',       modPar:'Paul ATEBA' },
  { id:6,  nom:'Ngaoundéré-Plateau',    region:'ADAMAOUA',      district:'NGAOUNDERE',     categorie:'C1', fideles:445,  ouvriers:9,  gps:false, complete:42, statut:'actif',      modifie:'il y a 2j',  modPar:'Sam KAMTO' },
  { id:7,  nom:'Bafang Annexe Est',     region:'HAUT-NKAM',     district:'BAFANG',         categorie:'C3',   fideles:128,  ouvriers:3,  gps:true,  complete:55, statut:'actif',      modifie:'il y a 2j',  modPar:'Système' },
  { id:8,  nom:'Bertoua Station',       region:'EST',           district:'BERTOUA',        categorie:'C2',  fideles:267,  ouvriers:5,  gps:true,  complete:71, statut:'en_attente', modifie:'il y a 3j',  modPar:'Jean ONANA' },
  { id:9,  nom:'Ebolowa-Mission',       region:'CENTRE SUD 2',  district:'EBOLOWA',        categorie:'C1', fideles:512,  ouvriers:9,  gps:false, complete:38, statut:'actif',      modifie:'il y a 3j',  modPar:'Système' },
  { id:10, nom:'Fokoué Annexe',         region:'MENOUA',        district:'FOKOUE',         categorie:'C3',   fideles:94,   ouvriers:2,  gps:true,  complete:48, statut:'inactif',    modifie:'il y a 5j',  modPar:'Marie BIYA' },
  { id:11, nom:'Bandja Centre',         region:'HAUT-NKAM',     district:'BANDJA',         categorie:'C1', fideles:380,  ouvriers:8,  gps:true,  complete:82, statut:'actif',      modifie:'il y a 5j',  modPar:'Paul ATEBA' },
  { id:12, nom:'Yaoundé-Mvog-Ada',      region:'CENTRE SUD 1',  district:'YAOUNDE SUD',    categorie:'C2',  fideles:621,  ouvriers:11, gps:true,  complete:86, statut:'actif',      modifie:'il y a 6j',  modPar:'Marie-Claire BIYA' },
];

export const topRegions = [
  { name:'CENTRE SUD 1',         fideles:18200, paroisses:95 },
  { name:'WOURI CENTRE',         fideles:16450, paroisses:72 },
  { name:'MIFI',                 fideles:12450, paroisses:48 },
  { name:'MENOUA',               fideles:9820,  paroisses:41 },
  { name:'WOURI SUD',            fideles:9100,  paroisses:38 },
  { name:'NDE & MBAM ET INOUBOU',fideles:8350,  paroisses:35 },
  { name:'MOUNGO CENTRE',        fideles:7920,  paroisses:32 },
  { name:'HAUT-NKAM',            fideles:7200,  paroisses:30 },
  { name:'ADAMAOUA',             fideles:5800,  paroisses:24 },
  { name:'NORD & EXTREME NORD',  fideles:5400,  paroisses:22 },
];

export const oeuvresMix = [
  { type:'Scolaire',      count:124, color:'#1565C0' },
  { type:'Médical',       count:62,  color:'#C62828' },
  { type:'Universitaire', count:18,  color:'#6A1B9A' },
  { type:'Agropastoral',  count:47,  color:'#E65100' },
  { type:'Immeuble',      count:35,  color:'#455A64' },
  { type:'Terrain',       count:18,  color:'#2E9744' },
  { type:'Autre',         count:7,   color:'#5B9BD5' },
];

export const fidelesEvolution = [
  { year:2020, comm:71200, noncomm:47800 },
  { year:2021, comm:74100, noncomm:49500 },
  { year:2022, comm:78400, noncomm:51900 },
  { year:2023, comm:82600, noncomm:54000 },
  { year:2024, comm:86200, noncomm:56500 },
  { year:2025, comm:89450, noncomm:58382 },
  { year:2026, comm:91800, noncomm:59700 },
];

export const categoriesByRegion = [
  { name:'CENTRE SUD 1', paroisse:62, station:21, annexe:12 },
  { name:'WOURI CENTRE', paroisse:48, station:16, annexe:8  },
  { name:'MIFI',         paroisse:31, station:12, annexe:5  },
  { name:'MENOUA',       paroisse:27, station:9,  annexe:5  },
  { name:'WOURI SUD',    paroisse:24, station:10, annexe:4  },
  { name:'MOUNGO CENTRE',paroisse:22, station:7,  annexe:3  },
];

export const activity = [
  { who:'Paul ATEBA',           role:'Admin District MIFI',      action:'Modifié',  entity:'Paroisse Bafoussam-Nord',          icon:'pencil',   color:'#E65100', when:'il y a 2h',  initials:'PA', bg:'rgba(230,81,0,0.20)' },
  { who:'Marie-Claire BIYA',    role:'Admin Régional CSUD1',     action:'Importé',  entity:'12 ouvriers (Excel)',               icon:'upload',   color:'#6A1B9A', when:'il y a 5h',  initials:'MB', bg:'rgba(106,27,154,0.22)' },
  { who:'admin@eec-cameroun.org',role:'Super Admin',             action:'Connexion',entity:'IP 197.149.43.12 — Yaoundé',       icon:'shield',   color:'#5B9BD5', when:'il y a 6h',  initials:'SA', bg:'rgba(91,155,213,0.22)' },
  { who:'Eric NDJI',            role:'Admin District DSCHANG',   action:'Créé',     entity:'Œuvre scolaire EPC Dschang',        icon:'plus',     color:'#5AC472', when:'il y a 9h',  initials:'EN', bg:'rgba(46,151,68,0.22)' },
  { who:'Sam KAMTO',            role:'Admin Paroisse',           action:'Soumis',   entity:'Statistiques 2025 — Ngaoundéré',   icon:'send',     color:'#FFD600', when:'hier',       initials:'SK', bg:'rgba(255,214,0,0.18)' },
  { who:'Marie-Claire BIYA',    role:'Admin Régional',           action:'Exporté',  entity:'Rapport PDF — Région CSUD1',        icon:'download', color:'#94A3B8', when:'hier',       initials:'MB', bg:'rgba(106,27,154,0.22)' },
];

export const accounts = [
  { nom:'Jean-Paul ESSOMBA', email:'jp.essomba@eec.cm', role:'SUPER ADMIN',    portee:'National',                tfa:true,  last:'Il y a 12 min', statut:'actif',   initials:'JE', bg:'rgba(255,214,0,0.18)',   color:'#FFD600' },
  { nom:'Marie-Claire BIYA', email:'mc.biya@eec.cm',    role:'Admin Régional', portee:'CENTRE SUD 1',            tfa:true,  last:'Il y a 1 h',    statut:'actif',   initials:'MB', bg:'rgba(91,155,213,0.22)',  color:'#5B9BD5' },
  { nom:'Paul ATEBA',        email:'p.ateba@eec.cm',    role:'Admin District', portee:'MIFI / BAFOUSSAM NORD',   tfa:false, last:'Il y a 2 h',    statut:'actif',   initials:'PA', bg:'rgba(230,81,0,0.22)',    color:'#E67A2E' },
  { nom:'Eric NDJI',         email:'e.ndji@eec.cm',     role:'Admin District', portee:'MENOUA / DSCHANG',        tfa:true,  last:'Hier 22:14',    statut:'actif',   initials:'EN', bg:'rgba(230,81,0,0.22)',    color:'#E67A2E' },
  { nom:'Sam KAMTO',         email:'s.kamto@eec.cm',    role:'Admin Paroisse', portee:'Ngaoundéré-Plateau',      tfa:false, last:'Il y a 4 j',    statut:'actif',   initials:'SK', bg:'rgba(46,151,68,0.22)',   color:'#5AC472' },
  { nom:'Jean ONANA',        email:'j.onana@eec.cm',    role:'Admin Régional', portee:'EST',                     tfa:true,  last:'Il y a 1 j',    statut:'actif',   initials:'JO', bg:'rgba(91,155,213,0.22)',  color:'#5B9BD5' },
  { nom:'Brigitte NKONO',    email:'b.nkono@eec.cm',    role:'Admin Paroisse', portee:'Yaoundé-Mvog-Ada',        tfa:true,  last:'Il y a 3 j',    statut:'actif',   initials:'BN', bg:'rgba(46,151,68,0.22)',   color:'#5AC472' },
  { nom:'Charles MBARGA',    email:'c.mbarga@eec.cm',   role:'Admin District', portee:'WOURI CENTRE / DEIDO',    tfa:false, last:'Il y a 12 j',   statut:'inactif', initials:'CM', bg:'rgba(230,81,0,0.22)',    color:'#E67A2E' },
];

export const OEUVRE_TYPES = [
  { key:'Scolaire',       color:'#1565C0' },
  { key:'Médical',        color:'#C62828' },
  { key:'Universitaire',  color:'#6A1B9A' },
  { key:'Agropastoral',   color:'#E65100' },
  { key:'Immeuble',       color:'#455A64' },
  { key:'Terrain',        color:'#2E9744' },
  { key:'Autre',          color:'#5B9BD5' },
];

export const sampleOeuvres = [
  { id:1,  nom:'Collège EPC Bafoussam',            type:'Scolaire',      region:'MIFI',                   district:'BAFOUSSAM CENTRE', paroisse:'Bafoussam-Centre',  annee:1962, beneficiaires:1240,  responsable:'M. Jean KAMGA',       statut:'actif' },
  { id:2,  nom:'Hôpital protestant de Ndoungué',   type:'Médical',       region:'MOUNGO CENTRE',          district:'NKONGSAMBA',       paroisse:'Ndoungué',          annee:1958, beneficiaires:8400,  responsable:'Dr. Paul ESSOMBA',    statut:'actif' },
  { id:3,  nom:'École primaire EPC Yaoundé',       type:'Scolaire',      region:'CENTRE SUD 1',           district:'YAOUNDE CENTRE',   paroisse:'Yaoundé-Centre',    annee:1971, beneficiaires:620,   responsable:'Mme Marie BIYA',      statut:'actif' },
  { id:4,  nom:'Centre de santé EEC Bafang',       type:'Médical',       region:'HAUT-NKAM',              district:'BAFANG',           paroisse:'Bafang-Centre',     annee:1985, beneficiaires:3200,  responsable:'Dr. Sam KAMTO',       statut:'actif' },
  { id:5,  nom:'Université Protestante d\'Afrique',type:'Universitaire', region:'CENTRE SUD 1',           district:'YAOUNDE CENTRE',   paroisse:'Yaoundé-Mvog-Ada',  annee:1997, beneficiaires:2100,  responsable:'Prof. Eric NDJI',     statut:'actif' },
  { id:6,  nom:'Ferme agropastorale de Bandja',    type:'Agropastoral',  region:'HAUT-NKAM',              district:'BANDJA',           paroisse:'Bandja Centre',     annee:1989, beneficiaires:180,   responsable:'M. Brice TCHATCHOU',  statut:'actif' },
  { id:7,  nom:'Lycée EPC Dschang',                type:'Scolaire',      region:'MENOUA',                 district:'DSCHANG',          paroisse:'Dschang Mission',   annee:1968, beneficiaires:980,   responsable:'M. Eric NDJI',        statut:'actif' },
  { id:8,  nom:'Immeuble synodal Douala',          type:'Immeuble',      region:'WOURI CENTRE',           district:'DOUALA CENTRE',    paroisse:'Douala-Akwa',       annee:2004, beneficiaires:null,  responsable:'Service patrimoine',  statut:'actif' },
  { id:9,  nom:'Terrain pastoral Bertoua',         type:'Terrain',       region:'EST',                    district:'BERTOUA',          paroisse:'Bertoua Station',   annee:1996, beneficiaires:null,  responsable:'Service patrimoine',  statut:'inactif' },
  { id:10, nom:'Dispensaire EEC Ngaoundéré',       type:'Médical',       region:'ADAMAOUA',               district:'NGAOUNDERE',       paroisse:'Ngaoundéré-Plateau',annee:1992, beneficiaires:1450,  responsable:'Inf. major Aïcha M.', statut:'actif' },
  { id:11, nom:'École maternelle EPC Mokolo',      type:'Scolaire',      region:'CENTRE SUD 1',           district:'YAOUNDE CENTRE',   paroisse:'Yaoundé-Mokolo',    annee:1988, beneficiaires:140,   responsable:'Mme Pauline ATEBA',   statut:'actif' },
  { id:12, nom:'Centre social EEC Bafia',          type:'Autre',         region:'NDE & MBAM ET INOUBOU',  district:'BAFIA',            paroisse:'Bafia-Centre',      annee:2011, beneficiaires:240,   responsable:'M. Jean ONANA',       statut:'actif' },
];

export const OUVRIER_GRADES = [
  { key:'Pasteur',          color:'#5AC472' },
  { key:'Prédicateur',      color:'#5B9BD5' },
  { key:'Évangéliste',      color:'#E67A2E' },
  { key:'Catéchiste',       color:'#B377D9' },
  { key:'Diacre',           color:'#94A3B8' },
  { key:'Aide-Pasteur',     color:'#7BCD8B' },
  { key:'Aide-Évangéliste', color:'#FFB877' },
];

export const sampleOuvriers = [
  { id:1,  nom:'EKANGA Jean-Marie',    grade:'Pasteur',         paroisse:'Yaoundé-Centre',    district:'YAOUNDE CENTRE',  region:'CENTRE SUD 1', tel:'+237 698 12 34 56', priseFonction:'1998-09-12', initials:'JE', statut:'actif' },
  { id:2,  nom:'NTI Paul',             grade:'Évangéliste',     paroisse:'Yaoundé-Centre',    district:'YAOUNDE CENTRE',  region:'CENTRE SUD 1', tel:'+237 677 45 12 30', priseFonction:'2005-03-08', initials:'PN', statut:'actif' },
  { id:3,  nom:'MEKA Marie',           grade:'Catéchiste',      paroisse:'Yaoundé-Centre',    district:'YAOUNDE CENTRE',  region:'CENTRE SUD 1', tel:'+237 695 78 23 01', priseFonction:'2011-10-22', initials:'MM', statut:'actif' },
  { id:4,  nom:'KAMTO Samuel',         grade:'Pasteur',         paroisse:'Bafoussam-Nord',    district:'BAFOUSSAM NORD',  region:'MIFI',         tel:'+237 698 22 11 09', priseFonction:'2002-06-15', initials:'SK', statut:'actif' },
  { id:5,  nom:'BIYA Christophe',      grade:'Pasteur',         paroisse:'Douala-Akwa',       district:'DOUALA CENTRE',   region:'WOURI CENTRE', tel:'+237 699 04 78 23', priseFonction:'1995-11-04', initials:'CB', statut:'actif' },
  { id:6,  nom:'NDJI Eric',            grade:'Pasteur',         paroisse:'Dschang Mission',   district:'DSCHANG',         region:'MENOUA',       tel:'+237 677 90 12 56', priseFonction:'2008-02-20', initials:'EN', statut:'actif' },
  { id:7,  nom:'MBARGA Charles',       grade:'Prédicateur',     paroisse:'Bafoussam-Nord',    district:'BAFOUSSAM NORD',  region:'MIFI',         tel:'+237 698 56 34 12', priseFonction:'2013-08-10', initials:'CM', statut:'actif' },
  { id:8,  nom:'ATEBA Paul',           grade:'Évangéliste',     paroisse:'Baham-Centre',      district:'BAHAM',           region:'MIFI',         tel:'+237 695 11 22 33', priseFonction:'2007-04-18', initials:'PA', statut:'actif' },
  { id:9,  nom:'NKONO Brigitte',       grade:'Diacre',          paroisse:'Yaoundé-Mvog-Ada',  district:'YAOUNDE SUD',     region:'CENTRE SUD 1', tel:'+237 698 33 44 55', priseFonction:'2016-01-30', initials:'BN', statut:'actif' },
  { id:10, nom:'ESSOMBA Christian',    grade:'Pasteur',          paroisse:'Yaoundé-Centre',    district:'YAOUNDE CENTRE',  region:'CENTRE SUD 1', tel:'+237 698 00 11 22', priseFonction:'1988-12-04', initials:'CE', statut:'actif' },
  { id:11, nom:'ONANA Jean',           grade:'Pasteur',         paroisse:'Bertoua Station',   district:'BERTOUA',         region:'EST',          tel:'+237 677 22 99 87', priseFonction:'1999-07-12', initials:'JO', statut:'actif' },
  { id:12, nom:'TCHATCHOU Brice',      grade:'Aide-Pasteur',    paroisse:'Bandja Centre',     district:'BANDJA',          region:'HAUT-NKAM',    tel:'+237 695 88 77 66', priseFonction:'2018-09-01', initials:'BT', statut:'actif' },
  { id:13, nom:'FOTSO Pauline',        grade:'Catéchiste',      paroisse:'Bafang Annexe Est', district:'BAFANG',          region:'HAUT-NKAM',    tel:'+237 698 12 56 87', priseFonction:'2019-03-15', initials:'PF', statut:'inactif' },
  { id:14, nom:'DJOMO Marc',           grade:'Aide-Évangéliste',paroisse:'Fokoué Annexe',     district:'FOKOUE',          region:'MENOUA',       tel:'+237 677 45 67 88', priseFonction:'2020-11-08', initials:'MD', statut:'actif' },
];

export const statsByRegion = REGIONS_22.map((r, i) => {
  const comm = [12450,18200,12450,9820,6420,7200,4800,5100,8200,7800,7920,6800,5400,8350,4900,5400,3800,4100,6800,16450,11200,9100][i] || 4000;
  const nonc = Math.round(comm * 0.62);
  const score = [88,72,91,84,46,68,42,55,76,82,79,71,58,65,49,52,38,44,73,93,86,69][i] || 60;
  return {
    region:r, communiants:comm, noncomm:nonc, total:comm+nonc,
    baptemes: Math.round(comm*0.03), mariages: Math.round(comm*0.012), deces: Math.round(comm*0.008),
    ouvriers: Math.round(comm*0.012), score, paroisses: Math.round(comm/220),
  };
});

export const journalEntries = [
  { time:'26/05 14:32', who:'Paul ATEBA',          action:'Modification', entity:'Paroisse Bafoussam-Nord',         summary:'GPS ajouté · Statut → En attente validation',    ip:'197.145.43.12', color:'#E65100', icon:'pencil' },
  { time:'26/05 14:18', who:'Marie-Claire BIYA',   action:'Import',       entity:'Fichier paroisses_CSUD1.xlsx',    summary:'94 lignes · 91 OK · 3 erreurs',                  ip:'105.235.12.87', color:'#6A1B9A', icon:'upload' },
  { time:'26/05 13:54', who:'Jean-Paul ESSOMBA',   action:'Connexion',    entity:'Session #4421',                   summary:'Authentification + 2FA OK',                      ip:'197.149.43.12', color:'#5B9BD5', icon:'shield' },
  { time:'26/05 12:41', who:'Eric NDJI',           action:'Création',     entity:'Œuvre scolaire EPC Dschang',      summary:'Type: Scolaire · District: DSCHANG',             ip:'154.72.45.10',  color:'#5AC472', icon:'plus' },
  { time:'26/05 11:09', who:'Système',             action:'Suppression',  entity:'Compte test01@eec.cm',            summary:'Suppression automatique compte inactif (90j)',    ip:'—',             color:'#E55B5B', icon:'trash' },
  { time:'26/05 10:22', who:'Marie-Claire BIYA',   action:'Export',       entity:'Rapport PDF — CENTRE SUD 1',      summary:'Format PDF · 12 pages · 95 paroisses',           ip:'105.235.12.87', color:'#94A3B8', icon:'download' },
  { time:'26/05 09:18', who:'Sam KAMTO',           action:'Modification', entity:'Statistiques 2025 — Ngaoundéré', summary:'Communiants 412→445 · Soumis pour validation',   ip:'237.110.8.54',  color:'#E65100', icon:'pencil' },
];

export const REGIONS_FULL = REGIONS_22.map((name, i) => {
  const stat = statsByRegion[i];
  return {
    id: i + 1, name,
    districts: Math.max(2, Math.round(stat.paroisses / 8)),
    paroisses: stat.paroisses,
    fideles: stat.total,
    ouvriers: stat.ouvriers,
    oeuvres: [22,8,18,16,4,14,3,5,12,21,9,7,5,11,4,3,2,3,9,28,18,12][i] || 0,
    score: stat.score,
    admin: ['—','M. Tabe NTANG','Marie-Claire BIYA','—','—','—','—','—','Eric NDJI','Paul ATEBA','—','—','—','—','—','—','—','—','—','Charles MBARGA','—','—'][i],
    adminInitials: ['—','TN','MB','—','—','—','—','—','EN','PA','—','—','—','—','—','—','—','—','—','CM','—','—'][i],
  };
});

export const sampleDistricts = [
  { id:1,  nom:'YAOUNDE CENTRE',   region:'CENTRE SUD 1', paroisses:35, fideles:8400, ouvriers:62, admin:'Marie-Claire BIYA', adminInitials:'MB', modifie:'il y a 1 h' },
  { id:2,  nom:'YAOUNDE NORD',     region:'CENTRE SUD 1', paroisses:28, fideles:4800, ouvriers:41, admin:'—',                  adminInitials:null,  modifie:'il y a 3 j' },
  { id:3,  nom:'YAOUNDE SUD',      region:'CENTRE SUD 1', paroisses:32, fideles:5000, ouvriers:47, admin:'Brigitte NKONO',     adminInitials:'BN', modifie:'hier' },
  { id:4,  nom:'DOUALA CENTRE',    region:'WOURI CENTRE', paroisses:38, fideles:9200, ouvriers:58, admin:'Charles MBARGA',     adminInitials:'CM', modifie:'il y a 2 h' },
  { id:5,  nom:'DEIDO',            region:'WOURI CENTRE', paroisses:18, fideles:4100, ouvriers:26, admin:'—',                  adminInitials:null,  modifie:'il y a 4 j' },
  { id:6,  nom:'BONABERI',         region:'WOURI CENTRE', paroisses:16, fideles:3150, ouvriers:22, admin:'—',                  adminInitials:null,  modifie:'il y a 5 j' },
  { id:7,  nom:'BAFOUSSAM NORD',   region:'MIFI',         paroisses:14, fideles:4100, ouvriers:28, admin:'Paul ATEBA',         adminInitials:'PA', modifie:'il y a 2 h' },
  { id:8,  nom:'BAFOUSSAM CENTRE', region:'MIFI',         paroisses:11, fideles:3800, ouvriers:22, admin:'—',                  adminInitials:null,  modifie:'il y a 6 j' },
  { id:9,  nom:'BAHAM',            region:'MIFI',         paroisses:12, fideles:3200, ouvriers:18, admin:'—',                  adminInitials:null,  modifie:'il y a 8 j' },
  { id:10, nom:'DSCHANG',          region:'MENOUA',       paroisses:18, fideles:4200, ouvriers:31, admin:'Eric NDJI',          adminInitials:'EN', modifie:'hier' },
  { id:11, nom:'FOKOUE',           region:'MENOUA',       paroisses:9,  fideles:1800, ouvriers:12, admin:'—',                  adminInitials:null,  modifie:'il y a 10 j' },
  { id:12, nom:'NGAOUNDERE',       region:'ADAMAOUA',     paroisses:11, fideles:2400, ouvriers:18, admin:'—',                  adminInitials:null,  modifie:'il y a 4 j' },
  { id:13, nom:'BAFANG',           region:'HAUT-NKAM',   paroisses:13, fideles:3100, ouvriers:21, admin:'—',                  adminInitials:null,  modifie:'il y a 6 j' },
  { id:14, nom:'BANDJA',           region:'HAUT-NKAM',   paroisses:8,  fideles:1900, ouvriers:14, admin:'Brice TCHATCHOU',    adminInitials:'BT', modifie:'il y a 5 j' },
  { id:15, nom:'BERTOUA',          region:'EST',          paroisses:10, fideles:2200, ouvriers:16, admin:'Jean ONANA',         adminInitials:'JO', modifie:'il y a 1 j' },
];
