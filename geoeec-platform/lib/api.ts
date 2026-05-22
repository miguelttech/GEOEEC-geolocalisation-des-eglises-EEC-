const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

// Configuration des headers par défaut
const defaultHeaders = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

// Types pour les réponses API
interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Types spécifiques pour votre backend Django
interface CartographieStatistics {
  total_regions: number
  total_districts: number
  total_paroisses: number
  total_stations: number
  total_annexes: number
  total_fideles: number
  total_communiants: number
  total_non_communiants: number
  total_ouvriers_actifs: number
  total_oeuvres_actives: number
  paroisses_geolocalises: number
  oeuvres_geolocalisees: number
  taux_geolocalisation_paroisses: number
  taux_geolocalisation_oeuvres: number
  pourcentage_communiants: number
  derniere_mise_a_jour: string
}

interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: "Point" | "Polygon" | "MultiPolygon" | "LineString"
    coordinates: any
  }
  properties: any
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection"
  features: GeoJSONFeature[]
}

interface CartographieLayers {
  paroisses: GeoJSONFeatureCollection
  oeuvres: GeoJSONFeatureCollection
  ouvriers: GeoJSONFeatureCollection
  regions_synodales: GeoJSONFeatureCollection
  zones_influence: GeoJSONFeatureCollection
  itineraires: GeoJSONFeatureCollection
}

// Types pour la persistance des régions synodales
interface RegionSynodaleData {
  id?: number
  nom: string
  code: string
  geometry: any // GeoJSON geometry
  properties: {
    superficie?: number
    population_estimee?: number
    nombre_districts?: number
    nombre_paroisses?: number
    nombre_oeuvres?: number
    nombre_ouvriers?: number
    couleur?: string
    responsable?: string
    siege?: string
    date_creation?: string
    statut?: string
  }
  version?: number
  date_creation?: string
  date_modification?: string
  actif?: boolean
}

interface RegionSynodaleVersion {
  id: number
  version: number
  nom: string
  description?: string
  date_creation: string
  nombre_regions: number
  taille_fichier?: number
  source_shapefile?: string
  actif: boolean
}

// Fonction utilitaire pour les requêtes API
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  // Ajouter le token JWT si disponible
  const token = localStorage.getItem("access_token")
  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, config)

    // Gestion des erreurs d'authentification
    if (response.status === 401) {
      // Token expiré, essayer de le rafraîchir
      const refreshToken = localStorage.getItem("refresh_token")
      if (refreshToken) {
        try {
          const refreshResponse = await fetch(`${API_BASE_URL}/api/token/refresh/`, {
            method: "POST",
            headers: defaultHeaders,
            body: JSON.stringify({ refresh: refreshToken }),
          })

          if (refreshResponse.ok) {
            const { access } = await refreshResponse.json()
            localStorage.setItem("access_token", access)

            // Retry la requête originale avec le nouveau token
            config.headers = {
              ...config.headers,
              Authorization: `Bearer ${access}`,
            }
            const retryResponse = await fetch(url, config)
            if (!retryResponse.ok) {
              throw new Error(`HTTP error! status: ${retryResponse.status}`)
            }
            return await retryResponse.json()
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem("access_token")
          localStorage.removeItem("refresh_token")
          throw new Error("Session expired")
        }
      }
      throw new Error("Unauthorized")
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

// API pour l'authentification
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    if (USE_MOCK_DATA) {
      // Mock response for development
      return {
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        user: {
          id: 1,
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          first_name: "User",
          last_name: "Test",
        },
      }
    }

    return apiRequest("/api/token/", {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  },

  refresh: async (refreshToken: string) => {
    return apiRequest("/api/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    })
  },

  logout: async () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    return Promise.resolve()
  },
}

// API pour les paroisses
export const paroissesApi = {
  getAll: async (params: { search?: string; region?: string; district?: string; page?: number } = {}) => {
    if (USE_MOCK_DATA) {
      // Mock data for development
      return {
        count: 150,
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          nom: `Paroisse ${i + 1}`,
          niveau: i % 3 === 0 ? "paroisse" : i % 3 === 1 ? "station" : "annexe",
          region_synodale: `Région ${Math.floor(i / 5) + 1}`,
          district: `District ${Math.floor(i / 3) + 1}`,
          quartier: `Quartier ${i + 1}`,
          communiants: Math.floor(Math.random() * 1000) + 100,
          non_communiants: Math.floor(Math.random() * 500) + 50,
          telephone: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          email: `paroisse${i + 1}@geoeec.cd`,
          adresse: `Adresse ${i + 1}`,
          localisation: {
            latitude: -4.3 + (Math.random() - 0.5) * 10,
            longitude: 15.3 + (Math.random() - 0.5) * 10,
          },
          statut: "active",
          date_creation: new Date().toISOString(),
        })),
      }
    }

    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append("search", params.search)
    if (params.region) queryParams.append("region", params.region)
    if (params.district) queryParams.append("district", params.district)
    if (params.page) queryParams.append("page", params.page.toString())

    return apiRequest(`/api/paroisses/?${queryParams.toString()}`)
  },

  getById: async (id: number) => {
    if (USE_MOCK_DATA) {
      return {
        id,
        nom: `Paroisse ${id}`,
        niveau: "paroisse",
        region_synodale: "Région Test",
        district: "District Test",
        quartier: "Quartier Test",
        communiants: 500,
        non_communiants: 200,
        telephone: "+243 123456789",
        email: `paroisse${id}@geoeec.cd`,
        adresse: "Adresse Test",
        localisation: {
          latitude: -4.3,
          longitude: 15.3,
        },
        statut: "active",
        date_creation: new Date().toISOString(),
      }
    }

    return apiRequest(`/api/paroisses/${id}/`)
  },

  create: async (data: any) => {
    return apiRequest("/api/paroisses/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: any) => {
    return apiRequest(`/api/paroisses/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: number) => {
    return apiRequest(`/api/paroisses/${id}/`, {
      method: "DELETE",
    })
  },
}

// API pour les œuvres
export const oeuvresApi = {
  getAll: async (params: { search?: string; type?: string; paroisse?: string; page?: number } = {}) => {
    if (USE_MOCK_DATA) {
      const types = ["scolaire", "sante", "universitaire", "agropastorale", "sociale"]
      return {
        count: 200,
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          nom: `Œuvre ${i + 1}`,
          type: types[i % types.length],
          type_oeuvre: types[i % types.length],
          niveau: i % 3 === 0 ? "paroissial" : i % 3 === 1 ? "district" : "regional",
          paroisse_nom: `Paroisse ${Math.floor(i / 2) + 1}`,
          paroisse_id: Math.floor(i / 2) + 1,
          statut: "active",
          remarques: `Remarques pour l'œuvre ${i + 1}`,
          telephone: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          email: `oeuvre${i + 1}@geoeec.cd`,
          responsable: `Responsable ${i + 1}`,
          localisation: {
            latitude: -4.3 + (Math.random() - 0.5) * 10,
            longitude: 15.3 + (Math.random() - 0.5) * 10,
          },
          date_creation: new Date().toISOString(),
        })),
      }
    }

    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append("search", params.search)
    if (params.type) queryParams.append("type", params.type)
    if (params.paroisse) queryParams.append("paroisse", params.paroisse)
    if (params.page) queryParams.append("page", params.page.toString())

    return apiRequest(`/api/oeuvres/?${queryParams.toString()}`)
  },

  getById: async (id: number) => {
    if (USE_MOCK_DATA) {
      return {
        id,
        nom: `Œuvre ${id}`,
        type: "scolaire",
        type_oeuvre: "scolaire",
        niveau: "paroissial",
        paroisse_nom: "Paroisse Test",
        paroisse_id: 1,
        statut: "active",
        remarques: "Remarques test",
        telephone: "+243 123456789",
        email: `oeuvre${id}@geoeec.cd`,
        responsable: "Responsable Test",
        localisation: {
          latitude: -4.3,
          longitude: 15.3,
        },
        date_creation: new Date().toISOString(),
      }
    }

    return apiRequest(`/api/oeuvres/${id}/`)
  },

  create: async (data: any) => {
    return apiRequest("/api/oeuvres/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: any) => {
    return apiRequest(`/api/oeuvres/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: number) => {
    return apiRequest(`/api/oeuvres/${id}/`, {
      method: "DELETE",
    })
  },
}

// API pour les ouvriers
export const ouvriersApi = {
  getAll: async (params: { search?: string; grade?: string; paroisse?: string; page?: number } = {}) => {
    if (USE_MOCK_DATA) {
      const grades = ["Pasteur", "Évangéliste", "Ancien", "Diacre", "Catéchiste"]
      return {
        count: 300,
        results: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          nom: `Ouvrier ${i + 1}`,
          prenom: `Prénom ${i + 1}`,
          grade: grades[i % grades.length],
          paroisse_nom: `Paroisse ${Math.floor(i / 3) + 1}`,
          paroisse_id: Math.floor(i / 3) + 1,
          district: `District ${Math.floor(i / 5) + 1}`,
          region_synodale: `Région ${Math.floor(i / 7) + 1}`,
          contact: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          telephone: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          email: `ouvrier${i + 1}@geoeec.cd`,
          statut: "actif",
          date_ordination: new Date(
            2020 + Math.floor(Math.random() * 4),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28),
          ).toISOString(),
          localisation: {
            latitude: -4.3 + (Math.random() - 0.5) * 10,
            longitude: 15.3 + (Math.random() - 0.5) * 10,
          },
        })),
      }
    }

    const queryParams = new URLSearchParams()
    if (params.search) queryParams.append("search", params.search)
    if (params.grade) queryParams.append("grade", params.grade)
    if (params.paroisse) queryParams.append("paroisse", params.paroisse)
    if (params.page) queryParams.append("page", params.page.toString())

    return apiRequest(`/api/ouvriers/?${queryParams.toString()}`)
  },

  getById: async (id: number) => {
    if (USE_MOCK_DATA) {
      return {
        id,
        nom: `Ouvrier ${id}`,
        prenom: `Prénom ${id}`,
        grade: "Pasteur",
        paroisse_nom: "Paroisse Test",
        paroisse_id: 1,
        district: "District Test",
        region_synodale: "Région Test",
        contact: "+243 123456789",
        telephone: "+243 123456789",
        email: `ouvrier${id}@geoeec.cd`,
        statut: "actif",
        date_ordination: new Date().toISOString(),
        localisation: {
          latitude: -4.3,
          longitude: 15.3,
        },
      }
    }

    return apiRequest(`/api/ouvriers/${id}/`)
  },

  create: async (data: any) => {
    return apiRequest("/api/ouvriers/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  update: async (id: number, data: any) => {
    return apiRequest(`/api/ouvriers/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  delete: async (id: number) => {
    return apiRequest(`/api/ouvriers/${id}/`, {
      method: "DELETE",
    })
  },
}

// API pour la cartographie (nouvelles endpoints Django)
export const cartographieApi = {
  getStatistics: async (params: { region?: string; district?: string; type?: string } = {}) => {
    if (USE_MOCK_DATA) {
      return {
        total_regions: 12,
        total_districts: 45,
        total_paroisses: 150,
        total_stations: 80,
        total_annexes: 70,
        total_fideles: 125000,
        total_communiants: 75000,
        total_non_communiants: 50000,
        total_ouvriers_actifs: 300,
        total_oeuvres_actives: 200,
        paroisses_geolocalises: 120,
        oeuvres_geolocalisees: 160,
        taux_geolocalisation_paroisses: 80.0,
        taux_geolocalisation_oeuvres: 80.0,
        pourcentage_communiants: 60.0,
        derniere_mise_a_jour: new Date().toISOString(),
      }
    }

    const queryParams = new URLSearchParams()
    if (params.region && params.region !== "all") queryParams.append("region", params.region)
    if (params.district && params.district !== "all") queryParams.append("district", params.district)
    if (params.type && params.type !== "all") queryParams.append("type", params.type)

    return apiRequest(`/api/cartographie/statistics/?${queryParams.toString()}`)
  },

  getLayers: async (params: { region?: string; district?: string; type?: string } = {}) => {
    if (USE_MOCK_DATA) {
      // Mock GeoJSON data avec régions synodales
      const mockRegionsSynodales = [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [15.0, -4.0],
                [16.0, -4.0],
                [16.0, -5.0],
                [15.0, -5.0],
                [15.0, -4.0],
              ],
            ],
          },
          properties: {
            id: 1,
            nom: "Région Synodale de Kinshasa",
            code: "RSK",
            superficie: 9965,
            population_estimee: 15000000,
            nombre_districts: 8,
            nombre_paroisses: 45,
            nombre_oeuvres: 120,
            nombre_ouvriers: 85,
            couleur: "#3B82F6",
            statut: "active",
            date_creation: "1960-06-30",
            responsable: "Révérend Dr. MUKENDI Jean",
            siege: "Kinshasa",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [16.0, -4.0],
                [17.5, -4.0],
                [17.5, -5.5],
                [16.0, -5.5],
                [16.0, -4.0],
              ],
            ],
          },
          properties: {
            id: 2,
            nom: "Région Synodale du Bandundu",
            code: "RSB",
            superficie: 295658,
            population_estimee: 8500000,
            nombre_districts: 6,
            nombre_paroisses: 32,
            nombre_oeuvres: 85,
            nombre_ouvriers: 58,
            couleur: "#10B981",
            statut: "active",
            date_creation: "1965-03-15",
            responsable: "Révérend NTUMBA Pierre",
            siege: "Bandundu",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [14.0, -5.5],
                [16.0, -5.5],
                [16.0, -7.0],
                [14.0, -7.0],
                [14.0, -5.5],
              ],
            ],
          },
          properties: {
            id: 3,
            nom: "Région Synodale du Bas-Congo",
            code: "RSBC",
            superficie: 53920,
            population_estimee: 4200000,
            nombre_districts: 4,
            nombre_paroisses: 28,
            nombre_oeuvres: 65,
            nombre_ouvriers: 42,
            couleur: "#F59E0B",
            statut: "active",
            date_creation: "1962-08-20",
            responsable: "Révérend MFUMU Samuel",
            siege: "Matadi",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [17.5, -2.0],
                [20.0, -2.0],
                [20.0, -4.0],
                [17.5, -4.0],
                [17.5, -2.0],
              ],
            ],
          },
          properties: {
            id: 4,
            nom: "Région Synodale de l'Équateur",
            code: "RSE",
            superficie: 403292,
            population_estimee: 6800000,
            nombre_districts: 5,
            nombre_paroisses: 35,
            nombre_oeuvres: 78,
            nombre_ouvriers: 52,
            couleur: "#8B5CF6",
            statut: "active",
            date_creation: "1968-11-10",
            responsable: "Révérend BOLOKO Marie",
            siege: "Mbandaka",
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [22.0, -5.0],
                [24.5, -5.0],
                [24.5, -7.5],
                [22.0, -7.5],
                [22.0, -5.0],
              ],
            ],
          },
          properties: {
            id: 5,
            nom: "Région Synodale du Kasaï-Oriental",
            code: "RSKO",
            superficie: 170302,
            population_estimee: 7200000,
            nombre_districts: 7,
            nombre_paroisses: 38,
            nombre_oeuvres: 95,
            nombre_ouvriers: 68,
            couleur: "#EF4444",
            statut: "active",
            date_creation: "1970-04-25",
            responsable: "Révérend TSHIABA David",
            siege: "Mbuji-Mayi",
          },
        },
      ]

      const mockParoisses = Array.from({ length: 50 }, (_, i) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [15.3 + (Math.random() - 0.5) * 10, -4.3 + (Math.random() - 0.5) * 10],
        },
        properties: {
          id: i + 1,
          nom: `Paroisse ${i + 1}`,
          niveau: i % 3 === 0 ? "paroisse" : i % 3 === 1 ? "station" : "annexe",
          region_synodale: mockRegionsSynodales[i % mockRegionsSynodales.length].properties.nom,
          region_synodale_id: mockRegionsSynodales[i % mockRegionsSynodales.length].properties.id,
          district: `District ${Math.floor(i / 5) + 1}`,
          quartier: `Quartier ${i + 1}`,
          communiants: Math.floor(Math.random() * 1000) + 100,
          non_communiants: Math.floor(Math.random() * 500) + 50,
          telephone: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          email: `paroisse${i + 1}@geoeec.cd`,
          adresse: `Adresse ${i + 1}`,
          statut: "active",
          oeuvres_count: Math.floor(Math.random() * 5) + 1,
          ouvriers_count: Math.floor(Math.random() * 10) + 2,
        },
      }))

      const mockOeuvres = Array.from({ length: 80 }, (_, i) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [15.3 + (Math.random() - 0.5) * 10, -4.3 + (Math.random() - 0.5) * 10],
        },
        properties: {
          id: i + 1,
          nom: `Œuvre ${i + 1}`,
          type: ["scolaire", "sante", "universitaire", "agropastorale", "sociale"][i % 5],
          type_oeuvre: ["scolaire", "sante", "universitaire", "agropastorale", "sociale"][i % 5],
          niveau: i % 3 === 0 ? "paroissial" : i % 3 === 1 ? "district" : "regional",
          paroisse_nom: `Paroisse ${Math.floor(i / 2) + 1}`,
          paroisse_id: Math.floor(i / 2) + 1,
          region_synodale: mockRegionsSynodales[i % mockRegionsSynodales.length].properties.nom,
          region_synodale_id: mockRegionsSynodales[i % mockRegionsSynodales.length].properties.id,
          statut: "active",
          remarques: `Remarques ${i + 1}`,
          telephone: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          email: `oeuvre${i + 1}@geoeec.cd`,
          responsable: `Responsable ${i + 1}`,
        },
      }))

      const mockOuvriers = Array.from({ length: 120 }, (_, i) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [15.3 + (Math.random() - 0.5) * 10, -4.3 + (Math.random() - 0.5) * 10],
        },
        properties: {
          id: i + 1,
          nom: `Ouvrier ${i + 1}`,
          prenom: `Prénom ${i + 1}`,
          grade: ["Pasteur", "Évangéliste", "Ancien", "Diacre", "Catéchiste"][i % 5],
          paroisse_nom: `Paroisse ${Math.floor(i / 3) + 1}`,
          district: `District ${Math.floor(i / 8) + 1}`,
          region_synodale: mockRegionsSynodales[i % mockRegionsSynodales.length].properties.nom,
          region_synodale_id: mockRegionsSynodales[i % mockRegionsSynodales.length].properties.id,
          contact: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          telephone: `+243 ${Math.floor(Math.random() * 1000000000)}`,
          email: `ouvrier${i + 1}@geoeec.cd`,
          statut: "actif",
          date_ordination: new Date(
            2020 + Math.floor(Math.random() * 4),
            Math.floor(Math.random() * 12),
            Math.floor(Math.random() * 28),
          ).toISOString(),
        },
      }))

      return {
        paroisses: {
          type: "FeatureCollection",
          features: mockParoisses,
        },
        oeuvres: {
          type: "FeatureCollection",
          features: mockOeuvres,
        },
        ouvriers: {
          type: "FeatureCollection",
          features: mockOuvriers,
        },
        regions_synodales: {
          type: "FeatureCollection",
          features: mockRegionsSynodales,
        },
        zones_influence: {
          type: "FeatureCollection",
          features: [],
        },
        itineraires: {
          type: "FeatureCollection",
          features: [],
        },
      }
    }

    const queryParams = new URLSearchParams()
    if (params.region && params.region !== "all") queryParams.append("region", params.region)
    if (params.district && params.district !== "all") queryParams.append("district", params.district)
    if (params.type && params.type !== "all") queryParams.append("type", params.type)

    return apiRequest(`/api/cartographie/layers/?${queryParams.toString()}`)
  },

  // API pour la gestion persistante des régions synodales
  getRegionsSynodales: async (versionId?: number) => {
    if (USE_MOCK_DATA) {
      // Retourner les données mock persistantes
      return {
        version: {
          id: 1,
          version: 1,
          nom: "Version initiale",
          description: "Découpage initial des régions synodales",
          date_creation: new Date().toISOString(),
          nombre_regions: 5,
          taille_fichier: 2048576,
          source_shapefile: "Region_synodale.shp",
          actif: true,
        },
        regions: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [15.0, -4.0],
                    [16.0, -4.0],
                    [16.0, -5.0],
                    [15.0, -5.0],
                    [15.0, -4.0],
                  ],
                ],
              },
              properties: {
                id: 1,
                nom: "Région Synodale de Kinshasa",
                code: "RSK",
                superficie: 9965,
                population_estimee: 15000000,
                nombre_districts: 8,
                nombre_paroisses: 45,
                nombre_oeuvres: 120,
                nombre_ouvriers: 85,
                couleur: "#3B82F6",
                statut: "active",
                date_creation: "1960-06-30",
                responsable: "Révérend Dr. MUKENDI Jean",
                siege: "Kinshasa",
                version_id: 1,
                date_modification: new Date().toISOString(),
              },
            },
          ],
        },
      }
    }

    const endpoint = versionId
      ? `/api/cartographie/regions-synodales/version/${versionId}/`
      : "/api/cartographie/regions-synodales/"

    return apiRequest(endpoint)
  },

  // Obtenir toutes les versions des régions synodales
  getRegionsSynodalesVersions: async () => {
    if (USE_MOCK_DATA) {
      return [
        {
          id: 1,
          version: 1,
          nom: "Version initiale",
          description: "Découpage initial des régions synodales",
          date_creation: new Date(Date.now() - 86400000 * 30).toISOString(),
          nombre_regions: 5,
          taille_fichier: 2048576,
          source_shapefile: "Region_synodale.shp",
          actif: true,
        },
        {
          id: 2,
          version: 2,
          nom: "Mise à jour 2024",
          description: "Ajustements des limites suite aux nouvelles créations",
          date_creation: new Date(Date.now() - 86400000 * 7).toISOString(),
          nombre_regions: 6,
          taille_fichier: 2356789,
          source_shapefile: "Region_synodale_v2.shp",
          actif: false,
        },
      ]
    }

    return apiRequest("/api/cartographie/regions-synodales/versions/")
  },

  // Sauvegarder une nouvelle version des régions synodales
  saveRegionsSynodales: async (data: {
    nom: string
    description?: string
    regions: RegionSynodaleData[]
    source_shapefile?: string
    activer?: boolean
  }) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        version: {
          id: Date.now(),
          version: 3,
          nom: data.nom,
          description: data.description,
          date_creation: new Date().toISOString(),
          nombre_regions: data.regions.length,
          taille_fichier: JSON.stringify(data.regions).length,
          source_shapefile: data.source_shapefile,
          actif: data.activer || false,
        },
        message: "Régions synodales sauvegardées avec succès",
      }
    }

    return apiRequest("/api/cartographie/regions-synodales/save/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Activer une version spécifique
  activateRegionsSynodalesVersion: async (versionId: number) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        message: `Version ${versionId} activée avec succès`,
      }
    }

    return apiRequest(`/api/cartographie/regions-synodales/activate/${versionId}/`, {
      method: "POST",
    })
  },

  // Supprimer une version
  deleteRegionsSynodalesVersion: async (versionId: number) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        message: `Version ${versionId} supprimée avec succès`,
      }
    }

    return apiRequest(`/api/cartographie/regions-synodales/version/${versionId}/`, {
      method: "DELETE",
    })
  },

  // Mettre à jour une région spécifique
  updateRegionSynodale: async (regionId: number, data: Partial<RegionSynodaleData>) => {
    if (USE_MOCK_DATA) {
      return {
        success: true,
        region: { ...data, id: regionId, date_modification: new Date().toISOString() },
        message: "Région mise à jour avec succès",
      }
    }

    return apiRequest(`/api/cartographie/regions-synodales/region/${regionId}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  },

  // Sauvegarder les régions synodales dans le backend
  saveRegionsSynodalesData: async (data: any) => {
    if (USE_MOCK_DATA) {
      // Simuler la sauvegarde en stockant dans localStorage
      localStorage.setItem("regions_synodales_data", JSON.stringify(data))
      return { success: true, message: "Régions synodales sauvegardées avec succès" }
    }

    return apiRequest("/api/cartographie/regions-synodales/save/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  },

  // Fonction pour exporter les régions synodales en GeoJSON
  exportRegionsSynodalesGeoJSON: async () => {
    if (USE_MOCK_DATA) {
      const data = localStorage.getItem("regions_synodales_data")
      return data ? JSON.parse(data) : null
    }

    return apiRequest("/api/cartographie/regions-synodales/export/")
  },

  // Fonction pour vérifier si des régions synodales sont déjà sauvegardées
  checkRegionsSynodalesSaved: async () => {
    if (USE_MOCK_DATA) {
      const data = localStorage.getItem("regions_synodales_data")
      return { exists: !!data }
    }

    return apiRequest("/api/cartographie/regions-synodales/check/")
  },

  // Ancienne API pour compatibilité
  getRegionsSynodalesShapefile: async () => {
    return cartographieApi.getRegionsSynodales()
  },

  uploadShapefile: async (formData: FormData) => {
    return cartographieApi.uploadShapefileWithPersistence(formData, {
      nom: "Import automatique",
      description: "Import via interface utilisateur",
      activer: true,
    })
  },

  uploadShapefileWithPersistence: async (
    formData: FormData,
    options: {
      nom: string
      description?: string
      activer?: boolean
    },
  ) => {
    const token = localStorage.getItem("access_token")

    // Ajouter les options au FormData
    formData.append("nom", options.nom)
    if (options.description) formData.append("description", options.description)
    if (options.activer) formData.append("activer", "true")

    try {
      const response = await fetch(`${API_BASE_URL}/api/cartographie/upload-shapefile-persistent/`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Erreur lors de l'upload du shapefile:", error)
      throw error
    }
  },

  search: async (query: string) => {
    if (USE_MOCK_DATA) {
      const mockResults = [
        {
          id: "paroisse_1",
          nom: "Paroisse Centrale",
          type: "paroisse",
          description: "Centre-ville, District Central",
          region: "Région Kinshasa",
          district: "District Central",
          coordinates: [15.3139, -4.3317],
          details: {
            niveau: "paroisse",
            communiants: 800,
            non_communiants: 300,
            total_fideles: 1100,
          },
        },
        {
          id: "oeuvre_1",
          nom: "École Primaire Saint-Paul",
          type: "oeuvre",
          description: "Œuvre scolaire",
          paroisse: "Paroisse Centrale",
          coordinates: [15.32, -4.33],
          details: {
            type_oeuvre: "scolaire",
            niveau: "paroissial",
            statut: "active",
          },
        },
        {
          id: "region_1",
          nom: "Région Synodale de Kinshasa",
          type: "region_synodale",
          description: "Région administrative principale",
          coordinates: [15.5, -4.5],
          details: {
            code: "RSK",
            superficie: 9965,
            nombre_paroisses: 45,
            nombre_oeuvres: 120,
          },
        },
      ].filter(
        (item) =>
          item.nom.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()),
      )

      return { results: mockResults }
    }

    const queryParams = new URLSearchParams()
    queryParams.append("q", query)

    return apiRequest(`/api/cartographie/search/?${queryParams.toString()}`)
  },

  getRegions: async () => {
    if (USE_MOCK_DATA) {
      return [
        "Région Synodale de Kinshasa",
        "Région Synodale du Bandundu",
        "Région Synodale du Bas-Congo",
        "Région Synodale de l'Équateur",
        "Région Synodale du Kasaï-Oriental",
        "Région Synodale du Kasaï-Occidental",
        "Région Synodale du Katanga",
        "Région Synodale du Maniema",
        "Région Synodale du Nord-Kivu",
        "Région Synodale de l'Orientale",
        "Région Synodale du Sud-Kivu",
      ]
    }

    return apiRequest("/api/cartographie/regions/")
  },

  getDistricts: async () => {
    if (USE_MOCK_DATA) {
      return [
        "District Central",
        "District Est",
        "District Ouest",
        "District Nord",
        "District Sud",
        "District Funa",
        "District Lukunga",
        "District Mont-Amba",
        "District Ngaliema",
        "District Tshangu",
      ]
    }

    return apiRequest("/api/cartographie/districts/")
  },

  getOeuvreTypes: async () => {
    if (USE_MOCK_DATA) {
      return ["scolaire", "sante", "universitaire", "agropastorale", "sociale", "culturelle", "economique"]
    }

    return apiRequest("/api/cartographie/oeuvre-types/")
  },
}

// API pour les statistiques générales
export const statisticsApi = {
  getGlobal: async () => {
    if (USE_MOCK_DATA) {
      return {
        total_paroisses: 150,
        total_oeuvres: 200,
        total_ouvriers: 300,
        total_fideles: 125000,
        total_communiants: 75000,
        total_non_communiants: 50000,
        regions_count: 11,
        districts_count: 45,
        derniere_mise_a_jour: new Date().toISOString(),
      }
    }

    return apiRequest("/api/statistics/global/")
  },

  getByRegion: async (region: string) => {
    if (USE_MOCK_DATA) {
      return {
        region,
        paroisses_count: Math.floor(Math.random() * 20) + 5,
        oeuvres_count: Math.floor(Math.random() * 30) + 10,
        ouvriers_count: Math.floor(Math.random() * 40) + 15,
        fideles_count: Math.floor(Math.random() * 15000) + 5000,
        communiants_count: Math.floor(Math.random() * 10000) + 3000,
        non_communiants_count: Math.floor(Math.random() * 5000) + 2000,
      }
    }

    return apiRequest(`/api/statistics/region/${encodeURIComponent(region)}/`)
  },

  getByDistrict: async (district: string) => {
    if (USE_MOCK_DATA) {
      return {
        district,
        paroisses_count: Math.floor(Math.random() * 10) + 2,
        oeuvres_count: Math.floor(Math.random() * 15) + 5,
        ouvriers_count: Math.floor(Math.random() * 20) + 8,
        fideles_count: Math.floor(Math.random() * 8000) + 2000,
        communiants_count: Math.floor(Math.random() * 5000) + 1500,
        non_communiants_count: Math.floor(Math.random() * 3000) + 500,
      }
    }

    return apiRequest(`/api/statistics/district/${encodeURIComponent(district)}/`)
  },
}

// Export par défaut
export default {
  auth: authApi,
  paroisses: paroissesApi,
  oeuvres: oeuvresApi,
  ouvriers: ouvriersApi,
  cartographie: cartographieApi,
  statistics: statisticsApi,
}
