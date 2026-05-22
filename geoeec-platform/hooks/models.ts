// Types correspondant aux modèles Django
export interface Paroisse {
  id: number
  nom: string
  quartier?: string
  niveau: string
  region_synodale: string
  district: string
  communiants: number
  non_communiants: number
  ouvriers: number
  localisation?: {
    latitude: number
    longitude: number
  }
  // Champs calculés
  total_fideles: number
  oeuvres_count: number
  ouvriers_details?: Ouvrier[]
  oeuvres_details?: Oeuvre[]
}

export interface Oeuvre {
  id: number
  nom: string
  type: "scolaire" | "universitaire" | "medicale" | "agropastorale" | "immeuble" | "terrain" | "autre"
  niveau: "paroissial" | "district" | "regional"
  paroisse_id?: number
  paroisse_nom?: string
  localisation?: {
    latitude: number
    longitude: number
  }
  remarques?: string
}

export interface Ouvrier {
  id: number
  nom: string
  grade: string
  contact?: string
  paroisse_nom?: string
  district?: string
  region_synodale?: string
}

export interface StatisticsResponse {
  overview: {
    total_paroisses: number
    total_ouvriers: number
    total_oeuvres: number
    total_communiants: number
    total_non_communiants: number
    total_fideles: number
    croissance_paroisses: number
    croissance_ouvriers: number
    croissance_oeuvres: number
    croissance_fideles: number
  }
  paroisses: {
    data: Paroisse[]
    par_region: Array<{
      region_synodale: string
      count: number
      communiants: number
      non_communiants: number
      total_fideles: number
      ouvriers: number
      oeuvres: number
    }>
    par_district: Array<{
      district: string
      region_synodale: string
      count: number
      communiants: number
      non_communiants: number
      total_fideles: number
    }>
    par_niveau: Array<{
      niveau: string
      count: number
      pourcentage: number
    }>
  }
  oeuvres: {
    data: Oeuvre[]
    par_type: Array<{
      type: string
      count: number
      pourcentage: number
    }>
    par_niveau: Array<{
      niveau: string
      count: number
      pourcentage: number
    }>
    par_region: Array<{
      region_synodale: string
      count: number
      types: Record<string, number>
    }>
  }
  ouvriers: {
    data: Ouvrier[]
    par_grade: Array<{
      grade: string
      count: number
      pourcentage: number
    }>
    par_region: Array<{
      region_synodale: string
      count: number
      grades: Record<string, number>
    }>
    par_district: Array<{
      district: string
      count: number
    }>
  }
  analyses: {
    top_paroisses_fideles: Paroisse[]
    top_paroisses_oeuvres: Paroisse[]
    regions_performance: Array<{
      region_synodale: string
      score_global: number
      efficacite_evangelisation: number
      densite_oeuvres: number
      ratio_ouvriers: number
    }>
    correlations: {
      oeuvres_fideles: number
      ouvriers_fideles: number
      niveau_performance: Record<string, number>
    }
  }
  filters: {
    regions: string[]
    districts: string[]
    niveaux: string[]
    types_oeuvres: string[]
    grades: string[]
  }
}

// Types correspondant aux modèles Django existants
export interface Paroisse {
  id: number
  nom: string
  quartier?: string
  niveau: string
  region_synodale: string
  district: string
  communiants: number
  non_communiants: number
  ouvriers: number
  total_fideles: number
  coordonnees?: {
    latitude: number
    longitude: number
  }
  oeuvres_count: number
}

export interface Ouvrier {
  id: number
  nom: string
  grade: string
  contact?: string
  paroisse_nom?: string
  district?: string
  region_synodale?: string
}

export interface CartographyResponse {
  overview: {
    total_paroisses: number
    total_oeuvres: number
    total_ouvriers: number
    total_ouvriers_paroisses: number
    total_fideles: number
    total_communiants: number
    total_non_communiants: number
    taux_communion: number
    derniere_mise_a_jour: string
  }
  paroisses: {
    data: Paroisse[]
    par_region: Array<{
      region_synodale: string
      count: number
      communiants: number
      non_communiants: number
      total_fideles: number
      ouvriers: number
      oeuvres: number
    }>
    par_district: Array<{
      district: string
      region_synodale: string
      count: number
      communiants: number
      non_communiants: number
      total_fideles: number
    }>
    par_niveau: Array<{
      niveau: string
      count: number
      pourcentage: number
    }>
  }
  oeuvres: {
    data: Oeuvre[]
    par_type: Array<{
      type: string
      count: number
      pourcentage: number
    }>
    par_niveau: Array<{
      niveau: string
      count: number
      pourcentage: number
    }>
    par_region: Array<{
      paroisse__region_synodale: string
      count: number
    }>
  }
  ouvriers: {
    data: Ouvrier[]
    par_grade: Array<{
      grade: string
      count: number
      pourcentage: number
    }>
    par_region: Array<{
      region_synodale: string
      count: number
    }>
    par_district: Array<{
      district: string
      count: number
    }>
  }
  analyses: {
    top_paroisses_fideles: Array<{
      nom: string
      total_fideles: number
      region_synodale: string
      district: string
    }>
    top_paroisses_oeuvres: Array<{
      nom: string
      oeuvres_count: number
      region_synodale: string
      district: string
    }>
    regions_performance: Array<{
      region_synodale: string
      paroisses_count: number
      total_fideles: number
      total_ouvriers: number
      total_oeuvres: number
      score_global: number
      efficacite_evangelisation: number
      densite_oeuvres: number
      ratio_ouvriers: number
    }>
  }
  filters: {
    regions: string[]
    districts: string[]
    niveaux: string[]
    types_oeuvres: string[]
    niveaux_oeuvres: string[]
    grades: string[]
  }
}
