export const EEC_STATS = {
  paroisses: 553,
  ouvriers:  685,
  regions:    22,
  districts: 137,
};

export interface Region {
  code:  string;
  name:  string;
  count: number;
  x:     number;
  y:     number;
  color: string;
}

export const EEC_REGIONS: Region[] = [
  { code: 'EXN', name: 'EXTRÊME-NORD', count:  9, x: 62, y:  9, color: '#E0A914' },
  { code: 'NRD', name: 'NORD',         count: 12, x: 60, y: 22, color: '#C99A0E' },
  { code: 'ADM', name: 'ADAMAOUA',     count: 17, x: 60, y: 38, color: '#F5C518' },
  { code: 'EST', name: 'EST',          count: 19, x: 73, y: 58, color: '#7FCB95' },
  { code: 'CTR', name: 'CENTRE',       count: 41, x: 56, y: 66, color: '#3FB36A' },
  { code: 'YAO', name: 'YAOUNDÉ',      count: 26, x: 53, y: 70, color: '#1B6B35' },
  { code: 'SUD', name: 'SUD',          count: 24, x: 48, y: 82, color: '#54B97D' },
  { code: 'LIT', name: 'LITTORAL',     count: 38, x: 36, y: 68, color: '#3FB36A' },
  { code: 'DLA', name: 'DOUALA',       count: 23, x: 32, y: 66, color: '#2D9E55' },
  { code: 'WRI', name: 'WOURI-MUNGO',  count: 13, x: 30, y: 70, color: '#1B6B35' },
  { code: 'NKM', name: 'NKAM',         count: 11, x: 34, y: 62, color: '#7FCB95' },
  { code: 'SWO', name: 'SUD-OUEST',    count: 29, x: 26, y: 70, color: '#54B97D' },
  { code: 'NWO', name: 'NORD-OUEST',   count: 33, x: 32, y: 50, color: '#1B6B35' },
  { code: 'OUE', name: 'OUEST',        count: 44, x: 40, y: 56, color: '#2D9E55' },
  { code: 'BAM', name: 'BAMBOUTOS',    count: 31, x: 36, y: 53, color: '#3FB36A' },
  { code: 'MIF', name: 'MIFI',         count: 52, x: 42, y: 58, color: '#2D9E55' },
  { code: 'BFS', name: 'BAFOUSSAM',    count: 16, x: 44, y: 60, color: '#54B97D' },
  { code: 'MEN', name: 'MÉNOUA',       count: 48, x: 38, y: 60, color: '#1B6B35' },
  { code: 'HKM', name: 'HAUT-NKAM',   count: 36, x: 40, y: 62, color: '#3FB36A' },
  { code: 'KOU', name: 'KOUNG-KHI',    count: 22, x: 43, y: 63, color: '#7FCB95' },
  { code: 'BFG', name: 'BAFANG',       count: 14, x: 38, y: 64, color: '#3FB36A' },
  { code: 'NDE', name: 'NDÉ',          count: 28, x: 46, y: 60, color: '#54B97D' },
];

export const EEC_DIRECTION = [
  { name: 'Rév. Pasteur Dr. ATABA Joël', titre: 'Président du Synode Général',  region: 'Yaoundé'   },
  { name: 'Rév. Pasteur MBOUNA André',   titre: 'Vice-Président',               region: 'Douala'    },
  { name: 'Rév. Pasteur Dr. NGAH Émile', titre: 'Secrétaire Général',           region: 'Bafoussam' },
  { name: 'Mme. KAMENI Esther',          titre: 'Trésorière Générale',          region: 'Dschang'   },
];
