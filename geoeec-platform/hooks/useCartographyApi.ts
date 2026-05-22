"use client"

import { useState, useEffect } from "react"

export interface CartographyData {
  total_regions?: number
  total_districts?: number
  total_paroisses?: number
  total_stations?: number
  total_annexes?: number
  total_fideles?: number
  total_communiants?: number
  total_non_communiants?: number
  total_ouvriers_actifs?: number
  total_oeuvres_actives?: number
  paroisses_geolocalises?: number
  oeuvres_geolocalisees?: number
  taux_geolocalisation_paroisses?: number
  taux_geolocalisation_oeuvres?: number
  pourcentage_communiants?: number
  derniere_mise_a_jour?: string
}

export interface LayersData {
  paroisses?: {
    type: string
    features: any[]
  }
  oeuvres?: {
    type: string
    features: any[]
  }
  ouvriers?: {
    type: string
    features: any[]
  }
  zones_influence?: {
    type: string
    features: any[]
  }
  itineraires?: {
    type: string
    features: any[]
  }
}

export const useCartographyApi = () => {
  const [data, setData] = useState<CartographyData | null>(null)
  const [layers, setLayers] = useState<LayersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const API_BASE_URL = "http://localhost:8000/api/cartographie"

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Chargement des données depuis l'API Django...")

      // 1. Récupérer les statistiques générales
      console.log("📊 Récupération des statistiques...")
      const statisticsResponse = await fetch(`${API_BASE_URL}/statistics/`, {
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
      setData(statisticsData)

      // 2. Récupérer les données des couches (layers)
      console.log("🗺️ Récupération des couches cartographiques...")
      const layersResponse = await fetch(`${API_BASE_URL}/layers/`, {
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

      setLayers(layersData)

      console.log("✅ Toutes les données cartographiques chargées avec succès")
    } catch (err) {
      console.error("❌ Erreur lors du chargement des données:", err)
      setError(err instanceof Error ? err.message : "Erreur inconnue")

      // En cas d'erreur, ne pas utiliser de données de fallback
      // L'utilisateur doit voir qu'il y a un problème de connexion
      console.log("⚠️ Aucune donnée de fallback - l'utilisateur doit corriger la connexion API")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return {
    data,
    layers,
    loading,
    error,
    refetch: fetchData,
  }
}
