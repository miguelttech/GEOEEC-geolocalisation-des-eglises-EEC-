// API spécifique pour votre backend Django
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

// Interface basée exactement sur votre structure backend
export interface StatisticsResponse {
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
    par_type: Array<{
      type: string
      nombre: number
    }>
    par_sexe: Array<{
      sexe: string
      nombre: number
    }>
    top_paroisses: Array<{
      paroisse: string
      nombre: number
    }>
  }
}

class StatisticsAPI {
  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async getStatistics(filters?: {
    region?: string
    paroisse?: string
    type?: string
  }): Promise<StatisticsResponse> {
    return this.request<StatisticsResponse>("/statistiques/", filters)
  }

  async exportStatisticsPDF(filters?: {
    region?: string
    paroisse?: string
    type?: string
  }): Promise<void> {
    const url = new URL(`${API_BASE_URL}/export/statistiques/pdf/`)

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(url.toString(), {
      headers: {
       
      },
    })

    if (!response.ok) {
      throw new Error(`Erreur d'export: ${response.statusText}`)
    }

    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `rapport_statistiques_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  }
}

export const statisticsAPI = new StatisticsAPI()

// Fonctions utilitaires pour votre backend
export const getStatistics = async (filters?: {
  region?: string
  paroisse?: string
  type?: string
}) => {
  return statisticsAPI.getStatistics(filters)
}

export const exportStatisticsPDF = async (filters?: {
  region?: string
  paroisse?: string
  type?: string
}) => {
  return statisticsAPI.exportStatisticsPDF(filters)
}
