"use client"

import { useState, useEffect, useCallback } from "react"

interface UseStatisticsOptions {
  region?: string
  paroisse?: string
  type?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

// Interface basée exactement sur votre structure backend Django
interface StatisticsData {
  filtres_utilises: {
    region: string | null
    paroisse: string | null
    type_oeuvre: string | null
  }
  oeuvres: {
    total: number
    par_region: Array<{
      region: string
      nombre: number
    }>
    par_type: Array<{
      type: string
      nombre: number
    }>
  }
  paroisses: {
    total: number
    par_region: Array<{
      region_synodale: string
      nombre: number
    }>
    par_niveau: Array<{
      niveau: string
      nombre: number
    }>
    moyenne_communiants: number
    moyenne_non_communiants: number
  }
  ouvriers: {
    total: number
    par_grade: Array<{
      grade: string
      nombre: number
    }>
    par_region: Array<{
      region_synodale: string
      nombre: number
    }>
    top_paroisses: Array<{
      paroisse: string
      nombre: number
    }>
  }
}

interface UseStatisticsReturn {
  data: StatisticsData | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  lastUpdated: Date | null
}

export function useStatistics(options: UseStatisticsOptions = {}): UseStatisticsReturn {
  const [data, setData] = useState<StatisticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)


      const params = new URLSearchParams()
      if (options.paroisse) {
        params.append("paroisse", options.paroisse)
      }
      if (options.type) {
        params.append("type", options.type)
      }

      const queryString = params.toString()
      const url = `${process.env.NEXT_PUBLIC_API_URL}/statistiques/${queryString ? `?${queryString}` : ""}`

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      setData(responseData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      console.error("Erreur lors du chargement des statistiques:", err)
    } finally {
      setLoading(false)
    }
  }, [options.region, options.paroisse, options.type])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(fetchData, options.refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, options.autoRefresh, options.refreshInterval])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    lastUpdated,
  }
}
