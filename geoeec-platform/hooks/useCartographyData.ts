"use client"

import { useState, useEffect } from "react"

export interface CartographyStatistics {
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

export interface GeoJSONFeature {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: [number, number] // [longitude, latitude]
  }
  properties: Record<string, any>
}

export interface LayersData {
  paroisses: {
    type: "FeatureCollection"
    features: GeoJSONFeature[]
  }
  oeuvres: {
    type: "FeatureCollection"
    features: GeoJSONFeature[]
  }
  ouvriers: {
    type: "FeatureCollection"
    features: GeoJSONFeature[]
  }
  zones_influence: {
    type: "FeatureCollection"
    features: GeoJSONFeature[]
  }
  itineraires: {
    type: "FeatureCollection"
    features: GeoJSONFeature[]
  }
}

export interface SearchResult {
  id: string
  nom: string
  type: "paroisse" | "oeuvre"
  description: string
  coordinates: [number, number]
  details: Record<string, any>
}

export const useCartographyData = () => {
  const [statistics, setStatistics] = useState<CartographyStatistics | null>(null)
  const [layers, setLayers] = useState<LayersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const fetchData = async (filters?: {
    region?: string
    district?: string
    type?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Chargement des données cartographiques...")

      // Construction des paramètres de requête
      const params = new URLSearchParams()
      if (filters?.region && filters.region !== "all") {
        params.append("region", filters.region)
      }
      if (filters?.district && filters.district !== "all") {
        params.append("district", filters.district)
      }
      if (filters?.type && filters.type !== "all") {
        params.append("type", filters.type)
      }

      const queryString = params.toString()
      const baseQuery = queryString ? `?${queryString}` : ""

      // 1. Récupérer les statistiques
      console.log("📊 Récupération des statistiques...")
      const statisticsResponse = await fetch(`${API_BASE_URL}/api/cartographie/statistics/${baseQuery}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!statisticsResponse.ok) {
        throw new Error(`Erreur API statistics: ${statisticsResponse.status} ${statisticsResponse.statusText}`)
      }

      const statisticsData = await statisticsResponse.json()
      console.log("✅ Statistiques récupérées:", statisticsData)
      setStatistics(statisticsData)

      // 2. Récupérer les couches
      console.log("🗺️ Récupération des couches...")
      const layersResponse = await fetch(`${API_BASE_URL}/api/cartographie/layers/${baseQuery}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!layersResponse.ok) {
        throw new Error(`Erreur API layers: ${layersResponse.status} ${layersResponse.statusText}`)
      }

      const layersData = await layersResponse.json()
      console.log("✅ Couches récupérées:", layersData)
      console.log("📍 Paroisses:", layersData.paroisses?.features?.length || 0)
      console.log("🏫 Œuvres:", layersData.oeuvres?.features?.length || 0)
      console.log("👥 Ouvriers:", layersData.ouvriers?.features?.length || 0)

      // Validation des données GeoJSON
      const validatedLayers: LayersData = {
        paroisses: {
          type: "FeatureCollection",
          features: (layersData.paroisses?.features || []).filter((feature: any) => {
            const hasValidCoords =
              feature.geometry?.coordinates &&
              Array.isArray(feature.geometry.coordinates) &&
              feature.geometry.coordinates.length === 2 &&
              typeof feature.geometry.coordinates[0] === "number" &&
              typeof feature.geometry.coordinates[1] === "number"

            if (!hasValidCoords) {
              console.warn("⚠️ Feature paroisse avec coordonnées invalides:", feature.properties?.nom)
            }

            return hasValidCoords
          }),
        },
        oeuvres: {
          type: "FeatureCollection",
          features: (layersData.oeuvres?.features || []).filter((feature: any) => {
            const hasValidCoords =
              feature.geometry?.coordinates &&
              Array.isArray(feature.geometry.coordinates) &&
              feature.geometry.coordinates.length === 2 &&
              typeof feature.geometry.coordinates[0] === "number" &&
              typeof feature.geometry.coordinates[1] === "number"

            if (!hasValidCoords) {
              console.warn("⚠️ Feature œuvre avec coordonnées invalides:", feature.properties?.nom)
            }

            return hasValidCoords
          }),
        },
        ouvriers: {
          type: "FeatureCollection",
          features: (layersData.ouvriers?.features || []).filter((feature: any) => {
            const hasValidCoords =
              feature.geometry?.coordinates &&
              Array.isArray(feature.geometry.coordinates) &&
              feature.geometry.coordinates.length === 2 &&
              typeof feature.geometry.coordinates[0] === "number" &&
              typeof feature.geometry.coordinates[1] === "number"

            if (!hasValidCoords) {
              console.warn("⚠️ Feature ouvrier avec coordonnées invalides:", feature.properties?.nom)
            }

            return hasValidCoords
          }),
        },
        zones_influence: layersData.zones_influence || { type: "FeatureCollection", features: [] },
        itineraires: layersData.itineraires || { type: "FeatureCollection", features: [] },
      }

      setLayers(validatedLayers)

      console.log("✅ Données cartographiques chargées et validées avec succès")
      console.log(`📊 Statistiques finales:
        - ${validatedLayers.paroisses.features.length} paroisses géolocalisées
        - ${validatedLayers.oeuvres.features.length} œuvres géolocalisées
        - ${validatedLayers.ouvriers.features.length} ouvriers géolocalisés`)
    } catch (err) {
      console.error("❌ Erreur lors du chargement des données cartographiques:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  // Fonction de recherche
  const searchItems = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return []

    try {
      console.log("🔍 Recherche:", query)
      const response = await fetch(`${API_BASE_URL}/api/cartographie/search/?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.results || []
      } else {
        console.error("❌ Erreur lors de la recherche:", response.statusText)
        return []
      }
    } catch (error) {
      console.error("❌ Erreur lors de la recherche:", error)
      return []
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    statistics,
    layers,
    loading,
    error,
    refetch: fetchData,
    searchItems,
  }
}
