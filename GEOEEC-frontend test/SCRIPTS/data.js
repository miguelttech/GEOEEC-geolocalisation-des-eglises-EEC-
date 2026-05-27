// Fictional but credible EEC parishes data, anchored on real Cameroon regions
window.EEC_DATA = {
  stats: {
    paroisses: 546,
    ouvriers: 708,
    regions: 22,
    districts: 133,
  },
  // 22 régions synodales (sample of real EEC nomenclature)
  // Coordinates are positioned over the SVG Cameroon outline (viewBox 100x95)
  regions: [
    { code: 'EXN', name: 'EXTRÊME-NORD',  count: 9,  x: 62, y: 9,  color: '#E0A914' },
    { code: 'NRD', name: 'NORD',          count: 12, x: 60, y: 22, color: '#C99A0E' },
    { code: 'ADM', name: 'ADAMAOUA',      count: 17, x: 60, y: 38, color: '#F5C518' },
    { code: 'EST', name: 'EST',           count: 19, x: 73, y: 58, color: '#7FCB95' },
    { code: 'CTR', name: 'CENTRE',        count: 41, x: 56, y: 66, color: '#3FB36A' },
    { code: 'YAO', name: 'YAOUNDÉ',       count: 26, x: 53, y: 70, color: '#1B6B35' },
    { code: 'SUD', name: 'SUD',           count: 24, x: 48, y: 82, color: '#54B97D' },
    { code: 'LIT', name: 'LITTORAL',      count: 38, x: 36, y: 68, color: '#3FB36A' },
    { code: 'DLA', name: 'DOUALA',        count: 23, x: 32, y: 66, color: '#2D9E55' },
    { code: 'WRI', name: 'WOURI-MUNGO',   count: 13, x: 30, y: 70, color: '#1B6B35' },
    { code: 'NKM', name: 'NKAM',          count: 11, x: 34, y: 62, color: '#7FCB95' },
    { code: 'SWO', name: 'SUD-OUEST',     count: 29, x: 26, y: 70, color: '#54B97D' },
    { code: 'NWO', name: 'NORD-OUEST',    count: 33, x: 32, y: 50, color: '#1B6B35' },
    { code: 'OUE', name: 'OUEST',         count: 44, x: 40, y: 56, color: '#2D9E55' },
    { code: 'BAM', name: 'BAMBOUTOS',     count: 31, x: 36, y: 53, color: '#3FB36A' },
    { code: 'MIF', name: 'MIFI',          count: 52, x: 42, y: 58, color: '#2D9E55' },
    { code: 'BFS', name: 'BAFOUSSAM',     count: 16, x: 44, y: 60, color: '#54B97D' },
    { code: 'MEN', name: 'MÉNOUA',        count: 48, x: 38, y: 60, color: '#1B6B35' },
    { code: 'HKM', name: 'HAUT-NKAM',     count: 36, x: 40, y: 62, color: '#3FB36A' },
    { code: 'KOU', name: 'KOUNG-KHI',     count: 22, x: 43, y: 63, color: '#7FCB95' },
    { code: 'BFG', name: 'BAFANG',        count: 14, x: 38, y: 64, color: '#3FB36A' },
    { code: 'NDE', name: 'NDÉ',           count: 28, x: 46, y: 60, color: '#54B97D' },
  ],

  // Featured parishes for cards / map highlights
  featured: [
    { id: 'p1', name: 'Paroisse de Bafang Centre', region: 'BAFANG', district: 'Bafang Centre', fideles: 1240, ouvriers: 14, niveau: 'Bureau Régional', oeuvres: ['École', 'Centre médical'], x: 36, y: 58 },
    { id: 'p2', name: 'Paroisse de Douala Akwa', region: 'LITTORAL', district: 'Douala I', fideles: 2180, ouvriers: 22, niveau: 'Bureau Régional', oeuvres: ['École', 'Université', 'Immeuble'], x: 30, y: 70 },
    { id: 'p3', name: 'Paroisse de Yaoundé Mvog-Ada', region: 'CENTRE', district: 'Yaoundé III', fideles: 1860, ouvriers: 19, niveau: 'Bureau Régional', oeuvres: ['École', 'Centre médical'], x: 52, y: 68 },
    { id: 'p4', name: 'Paroisse de Bafoussam Marché B', region: 'MIFI', district: 'Bafoussam I', fideles: 1420, ouvriers: 16, niveau: 'Bureau de District', oeuvres: ['École'], x: 41, y: 57 },
    { id: 'p5', name: 'Paroisse de Dschang Foréké', region: 'MÉNOUA', district: 'Dschang', fideles: 980, ouvriers: 11, niveau: 'Bureau Paroissial', oeuvres: ['Œuvre agropastorale', 'Terrain'], x: 38, y: 58 },
    { id: 'p6', name: 'Paroisse de Bandjoun', region: 'KOUNG-KHI', district: 'Bandjoun', fideles: 1110, ouvriers: 13, niveau: 'Bureau de District', oeuvres: ['École', 'Centre médical'], x: 40, y: 60 },
    { id: 'p7', name: 'Paroisse de Mbouda Centre', region: 'BAMBOUTOS', district: 'Mbouda', fideles: 870, ouvriers: 10, niveau: 'Bureau de District', oeuvres: ['Terrain'], x: 36, y: 51 },
    { id: 'p8', name: 'Paroisse de Bangangté', region: 'NDÉ', district: 'Bangangté', fideles: 1340, ouvriers: 15, niveau: 'Bureau de District', oeuvres: ['École', 'Université'], x: 44, y: 54 },
  ],

  oeuvres: [
    { name: 'Écoles', count: 187, icon: 'school' },
    { name: 'Centres médicaux', count: 42, icon: 'medical' },
    { name: 'Universités', count: 3, icon: 'university' },
    { name: 'Œuvres agropastorales', count: 24, icon: 'agro' },
    { name: 'Immeubles', count: 78, icon: 'building' },
    { name: 'Terrains', count: 312, icon: 'land' },
  ],

  direction: [
    { name: 'Rév. Pasteur Dr. ATABA Joël', titre: 'Président du Synode Général', region: 'Yaoundé' },
    { name: 'Rév. Pasteur MBOUNA André', titre: 'Vice-Président', region: 'Douala' },
    { name: 'Rév. Pasteur Dr. NGAH Émile', titre: 'Secrétaire Général', region: 'Bafoussam' },
    { name: 'Mme. KAMENI Esther', titre: 'Trésorière Générale', region: 'Dschang' },
  ],
};
