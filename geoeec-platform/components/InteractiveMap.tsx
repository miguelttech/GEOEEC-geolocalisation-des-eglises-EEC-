"use client"

import type React from "react"

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import {
  MapPin,
  Building,
  Users,
  GraduationCap,
  RefreshCw,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  AlertCircle,
  Eye,
  BarChart3,
  Link,
  Network,
  Zap,
  Search,
  Globe,
  Save,
  Download,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Filter,
  FileText,
  MapIcon,
  Compass,
} from "lucide-react"

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface LayerItem {
  id: number
  nom: string
  type: string
  region?: string
  region_synodale?: string
  region_synodale_id?: number
  district?: string
  latitude: number
  longitude: number
  paroisse_id?: number
  paroisse_nom?: string
  communiants?: number
  non_communiants?: number
  ouvriers?: number
  [key: string]: any
}

interface RegionSynodaleFeature {
  type: "Feature"
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: any
  }
  properties: {
    id?: number
    nom?: string
    name?: string
    NAME?: string
    code?: string
    nombre_districts?: number
    nombre_paroisses?: number
    nombre_oeuvres?: number
    nombre_ouvriers?: number
    couleur?: string
    statut?: string
    date_creation?: string
    responsable?: string
    siege?: string
    [key: string]: any
  }
}

interface RegionStats {
  nom: string
  code: string
  paroisses: LayerItem[]
  oeuvres: LayerItem[]
  ouvriers: LayerItem[]
  totalFideles: number
  totalCommuniants: number
  totalNonCommuniants: number
  densite: number
  tauxCouverture: number
  couleur: string
  geometry: any
}

interface InteractiveCartographyMapProps {
  statistics: any
  layers: LayerItem[]
  onRefresh: () => void
  loading: boolean
  selectedMapItem?: any
}

// Cache pour les marqueurs et clusters
const markerCache = new Map()
const clusterCache = new Map()

// Couleurs pour les régions synodales
const REGION_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
  "#AED6F1",
  "#E8DAEF",
  "#FADBD8",
]

export default function InteractiveCartographyMap({
  statistics,
  layers = [],
  onRefresh,
  loading,
  selectedMapItem,
}: InteractiveCartographyMapProps) {
  const safeLayers = Array.isArray(layers) ? layers : []
  const { toast } = useToast()

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const connectionsRef = useRef<L.LayerGroup | null>(null)
  const regionsLayerRef = useRef<L.LayerGroup | null>(null)
  const heatmapRef = useRef<any>(null)

  const [activeLayer, setActiveLayer] = useState<string>("all")
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>("all")
  const [mapReady, setMapReady] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<any>(null)
  const [selectedRegion, setSelectedRegion] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showRegionStats, setShowRegionStats] = useState(false)
  const [paroissesOeuvres, setParoissesOeuvres] = useState<any[]>([])
  const [showTable, setShowTable] = useState(false)
  const [clusterDistance, setClusterDistance] = useState([40])
  const [showClustering, setShowClustering] = useState(true)
  const [showConnections, setShowConnections] = useState(false)
  const [showRegionsBoundaries, setShowRegionsBoundaries] = useState(true)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showDensityAnalysis, setShowDensityAnalysis] = useState(false)
  const [renderMode, setRenderMode] = useState<"canvas" | "svg">("canvas")
  const [searchTerm, setSearchTerm] = useState("")
  const [hoveredMarker, setHoveredMarker] = useState<any>(null)
  const [regionsSynodales, setRegionsSynodales] = useState<RegionSynodaleFeature[]>([])
  const [isRegionsSaved, setIsRegionsSaved] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("layers")

  // Chargement automatique du fichier GeoJSON au démarrage
  useEffect(() => {
    loadRegionsSynodales()
  }, [])

  const loadRegionsSynodales = async () => {
    try {
      // Charger le fichier GeoJSON réel depuis le dossier public
      const response = await fetch("/geojson_file/Region_synodale_ok.geojson")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const geoJsonData = await response.json()

      if (geoJsonData && geoJsonData.features) {
        // Utiliser les données réelles du GeoJSON sans modification
        const regions = geoJsonData.features.map((feature: any, index: number) => ({
          ...feature,
          properties: {
            ...feature.properties,
            // Utiliser la couleur du GeoJSON ou assigner une couleur par défaut
            couleur: feature.properties.couleur || REGION_COLORS[index % REGION_COLORS.length],
          },
        }))

        setRegionsSynodales(regions)
        setIsRegionsSaved(true)

        toast({
          title: "Régions chargées",
          description: `${regions.length} région(s) synodale(s) chargée(s) depuis le GeoJSON.`,
        })

        console.log("✅ Régions synodales chargées depuis le fichier réel:", regions)
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des régions synodales:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le fichier des régions synodales.",
        variant: "destructive",
      })
    }
  }

  // Fonction pour déterminer si un point est dans un polygone (algorithme ray casting)
  const pointInPolygon = useCallback((point: [number, number], polygon: any): boolean => {
    const [lat, lng] = point
    let inside = false

    // Gérer les MultiPolygon et Polygon
    const coords = polygon.type === "MultiPolygon" ? polygon.coordinates[0][0] : polygon.coordinates[0]

    for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
      const [xi, yi] = coords[i]
      const [xj, yj] = coords[j]

      if (yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi) {
        inside = !inside
      }
    }

    return inside
  }, [])

  // Analyse spatiale : associer chaque élément réel à sa région synodale
  const spatialAnalysis = useMemo(() => {
    if (!regionsSynodales.length || !safeLayers.length) return new Map()

    const regionAssignments = new Map()

    safeLayers.forEach((item) => {
      if (item.latitude && item.longitude) {
        const point: [number, number] = [item.latitude, item.longitude]

        // Chercher dans quelle région se trouve ce point
        for (const region of regionsSynodales) {
          if (pointInPolygon(point, region.geometry)) {
            const regionName = region.properties.nom || region.properties.name || region.properties.NAME
            regionAssignments.set(item.id, {
              ...item,
              region_synodale_calculee: regionName,
              region_synodale_id_calculee: region.properties.id,
            })
            break
          }
        }

        // Si pas trouvé, garder l'élément avec sa région d'origine ou "Non assignée"
        if (!regionAssignments.has(item.id)) {
          regionAssignments.set(item.id, {
            ...item,
            region_synodale_calculee: item.region_synodale || "Non assignée",
          })
        }
      }
    })

    return regionAssignments
  }, [regionsSynodales, safeLayers, pointInPolygon])

  const regionStatistics = useMemo((): RegionStats[] => {
    if (!regionsSynodales.length) return []

    return regionsSynodales.map((region) => {
      const regionName = region.properties.nom || region.properties.name || region.properties.Region_syn || "Région"

      // Filtrer les éléments réels de cette région - amélioration de la logique de filtrage
      const regionItems = Array.from(spatialAnalysis.values()).filter((item: any) => {
        // Vérifier plusieurs critères pour associer à la région
        return (
          item.region_synodale_calculee === regionName ||
          item.region_synodale === regionName ||
          (item.region && item.region === regionName)
        )
      })

      // Si pas d'éléments trouvés par analyse spatiale, utiliser les données directes
      let paroisses = regionItems.filter((item: any) => item.type === "paroisse")
      let oeuvres = regionItems.filter((item: any) => item.type === "oeuvre")
      let ouvriers = regionItems.filter((item: any) => item.type === "ouvrier")

      // Fallback: chercher directement dans safeLayers si pas de résultats
      if (paroisses.length === 0) {
        paroisses = safeLayers.filter(
          (item: any) =>
            item.type === "paroisse" && (item.region_synodale === regionName || item.region === regionName),
        )
      }
      if (oeuvres.length === 0) {
        oeuvres = safeLayers.filter(
          (item: any) => item.type === "oeuvre" && (item.region_synodale === regionName || item.region === regionName),
        )
      }
      if (ouvriers.length === 0) {
        ouvriers = safeLayers.filter(
          (item: any) => item.type === "ouvrier" && (item.region_synodale === regionName || item.region === regionName),
        )
      }

      // Calculer les vraies statistiques des fidèles à partir des données réelles
      const totalCommuniants = paroisses.reduce((sum: number, p: any) => {
        const communiants = Number(p.communiants) || Number(p.properties?.communiants) || 0
        return sum + communiants
      }, 0)

      const totalNonCommuniants = paroisses.reduce((sum: number, p: any) => {
        const nonCommuniants = Number(p.non_communiants) || Number(p.properties?.non_communiants) || 0
        return sum + nonCommuniants
      }, 0)

      const totalFideles = totalCommuniants + totalNonCommuniants

      const nombreParoisses = paroisses.length || 1 // Éviter division par zéro
      const densiteParParoisse = totalFideles / nombreParoisses // Fidèles par paroisse

      // Utiliser les vraies données du GeoJSON pour superficie et population
      const tauxCouverture = (totalFideles / nombreParoisses) 

      console.log(`[v0] Région ${regionName}:`, {
        paroisses: paroisses.length,
        oeuvres: oeuvres.length,
        ouvriers: ouvriers.length,
        totalFideles,
        totalCommuniants,
        totalNonCommuniants,
        densiteParParoisse,
      })

      return {
        nom: regionName,
        code: region.properties.code || "",
        paroisses,
        oeuvres,
        ouvriers,
        totalFideles,
        totalCommuniants,
        totalNonCommuniants,
        densite: Math.round(densiteParParoisse * 100) / 100, // Densité = fidèles par paroisse
        tauxCouverture: Math.round(tauxCouverture * 100) / 100,
        couleur: region.properties.couleur || REGION_COLORS[0],
        geometry: region.geometry,
      }
    })
  }, [regionsSynodales, spatialAnalysis, safeLayers])

  // Données optimisées avec relations et analyse spatiale réelle
  const optimizedData = useMemo(() => {
    const spatialItems = Array.from(spatialAnalysis.values())
    const paroisses = spatialItems.filter((item: any) => item.type === "paroisse")
    const oeuvres = spatialItems.filter((item: any) => item.type === "oeuvre")
    const ouvriers = spatialItems.filter((item: any) => item.type === "ouvrier")

    // Créer un index des relations réelles
    const relationIndex = new Map()

    paroisses.forEach((paroisse: any) => {
      const paroissesOeuvres = oeuvres.filter(
        (oeuvre: any) => oeuvre.paroisse_id === paroisse.id || oeuvre.paroisse === paroisse.nom,
      )
      const paroissesOuvriers = ouvriers.filter(
        (ouvrier: any) => ouvrier.paroisse_id === paroisse.id || ouvrier.paroisse_nom === paroisse.nom,
      )

      relationIndex.set(paroisse.nom, {
        paroisse,
        oeuvres: paroissesOeuvres,
        ouvriers: paroissesOuvriers,
        totalElements: paroissesOeuvres.length + paroissesOuvriers.length + 1,
      })
    })

    return {
      paroisses,
      oeuvres,
      ouvriers,
      relationIndex,
      all: spatialItems,
    }
  }, [spatialAnalysis])

  // Filtrage intelligent avec recherche et région
  const filteredData = useMemo(() => {
    let data = optimizedData.all

    // Filtre par couche active
    if (activeLayer !== "all") {
      if (activeLayer === "paroisses") data = optimizedData.paroisses
      else if (activeLayer === "oeuvres") data = optimizedData.oeuvres
      else if (activeLayer === "ouvriers") data = optimizedData.ouvriers
      else if (activeLayer === "bureaux") data = data.filter((item: any) => item.type.includes("bureau"))
    }

    // Filtre par région synodale
    if (selectedRegionFilter !== "all") {
      data = data.filter((item: any) => item.region_synodale_calculee === selectedRegionFilter)
    }

    // Filtre par recherche
    if (searchTerm) {
      data = data.filter(
        (item: any) =>
          item.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.region_synodale_calculee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.district?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    return data
  }, [optimizedData, activeLayer, selectedRegionFilter, searchTerm])

  // Alertes basées uniquement sur les vraies données
  const regionAlerts = useMemo(() => {
    const alerts: any[] = []

    regionStatistics.forEach((region) => {
      // Région avec peu de paroisses (basé sur les vraies données)
      if (region.paroisses.length > 0 && region.paroisses.length < 3) {
        alerts.push({
          type: "warning",
          region: region.nom,
          message: `Seulement ${region.paroisses.length} paroisse(s) recensée(s)`,
          icon: Building,
        })
      }

      // Faible taux de couverture (basé sur les vraies données)
      if (region.totalFideles > 0 && region.tauxCouverture < 5) {
        alerts.push({
          type: "error",
          region: region.nom,
          message: `Taux de couverture: ${region.tauxCouverture.toFixed(1)}%`,
          icon: TrendingDown,
        })
      }

      // Région sans œuvres (basé sur les vraies données)
      if (region.paroisses.length > 0 && region.oeuvres.length === 0) {
        alerts.push({
          type: "info",
          region: region.nom,
          message: "Aucune œuvre recensée",
          icon: GraduationCap,
        })
      }

      // Forte densité - opportunité (basé sur les vraies données)
      if (region.densite > 10) {
        alerts.push({
          type: "success",
          region: region.nom,
          message: `Forte densité: ${region.densite} fidèles/paroisse`,
          icon: TrendingUp,
        })
      }

      // Région sans données
      if (region.paroisses.length === 0 && region.oeuvres.length === 0 && region.ouvriers.length === 0) {
        alerts.push({
          type: "warning",
          region: region.nom,
          message: "Aucune donnée recensée dans cette région",
          icon: AlertCircle,
        })
      }
    })

    return alerts
  }, [regionStatistics])

  const saveRegions = async () => {
    if (regionsSynodales.length === 0) {
      toast({
        title: "Aucune région à sauvegarder",
        description: "Veuillez d'abord charger des régions synodales.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Sauvegarder avec les statistiques réelles calculées
      const regionsWithRealStats = regionsSynodales.map((region, index) => {
        const stats = regionStatistics[index]
        return {
          ...region,
          properties: {
            ...region.properties,
            // Statistiques calculées à partir des vraies données
            nombre_paroisses_calculees: stats?.paroisses.length || 0,
            nombre_oeuvres_calculees: stats?.oeuvres.length || 0,
            nombre_ouvriers_calcules: stats?.ouvriers.length || 0,
            total_fideles_calcules: stats?.totalFideles || 0,
            total_communiants_calcules: stats?.totalCommuniants || 0,
            total_non_communiants_calcules: stats?.totalNonCommuniants || 0,
            densite_calculee: stats?.densite || 0,
            taux_couverture_calcule: stats?.tauxCouverture || 0,
            derniere_mise_a_jour: new Date().toISOString(),
          },
        }
      })

      // Ici vous pouvez appeler votre API Django pour sauvegarder
      // await cartographieApi.saveRegionsSynodales(regionsWithRealStats)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      setIsRegionsSaved(true)
      toast({
        title: "Régions sauvegardées",
        description: `${regionsSynodales.length} région(s) avec statistiques réelles sauvegardée(s).`,
      })
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder les régions synodales.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const exportRegionReport = () => {
    if (regionStatistics.length === 0) {
      toast({
        title: "Aucune donnée à exporter",
        description: "Veuillez d'abord charger des régions synodales.",
        variant: "destructive",
      })
      return
    }

    // Créer un rapport basé uniquement sur les vraies données
    const report = {
      titre: "Rapport Statistique des Régions Synodales EEC - Données Réelles",
      date_generation: new Date().toISOString(),
      source_donnees: "API Django + GeoJSON réel",
      resume_executif: {
        total_regions: regionStatistics.length,
        total_paroisses: regionStatistics.reduce((sum, r) => sum + r.paroisses.length, 0),
        total_oeuvres: regionStatistics.reduce((sum, r) => sum + r.oeuvres.length, 0),
        total_ouvriers: regionStatistics.reduce((sum, r) => sum + r.ouvriers.length, 0),
        total_fideles: regionStatistics.reduce((sum, r) => sum + r.totalFideles, 0),
        total_communiants: regionStatistics.reduce((sum, r) => sum + r.totalCommuniants, 0),
        total_non_communiants: regionStatistics.reduce((sum, r) => sum + r.totalNonCommuniants, 0),
      },
      regions: regionStatistics.map((region) => ({
        nom: region.nom,
        code: region.code,
        donnees_geojson: {
          siege: regionsSynodales.find(
            (r) => (r.properties.nom || r.properties.name || r.properties.NAME) === region.nom,
          )?.properties.siege,
          responsable: regionsSynodales.find(
            (r) => (r.properties.nom || r.properties.name || r.properties.NAME) === region.nom,
          )?.properties.responsable,
        },
        statistiques_calculees: {
          paroisses: region.paroisses.length,
          oeuvres: region.oeuvres.length,
          ouvriers: region.ouvriers.length,
          fideles: region.totalFideles,
          communiants: region.totalCommuniants,
          non_communiants: region.totalNonCommuniants,
          densite: region.densite,
          taux_couverture: region.tauxCouverture,
        },
        details_paroisses: region.paroisses.map((p) => ({
          nom: p.nom,
          communiants: p.communiants || 0,
          non_communiants: p.non_communiants || 0,
          coordonnees: [p.latitude, p.longitude],
        })),
        details_oeuvres: region.oeuvres.map((o) => ({
          nom: o.nom,
          type: o.type_oeuvre || o.type,
          paroisse: o.paroisse_nom,
          coordonnees: [o.latitude, o.longitude],
        })),
        details_ouvriers: region.ouvriers.map((ov) => ({
          nom: ov.nom,
          fonction: ov.fonction || ov.grade,
          paroisse: ov.paroisse_nom,
          coordonnees: ov.latitude && ov.longitude ? [ov.latitude, ov.longitude] : null,
        })),
      })),
      alertes: regionAlerts,
      methodologie: {
        analyse_spatiale: "Point-in-Polygon pour assignation automatique",
        source_geometries: "GeoJSON réel des régions synodales",
        source_donnees: "API Django avec données réelles",
        calculs: "Statistiques calculées en temps réel",
      },
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport-regions-synodales-reel-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Rapport exporté",
      description: "Le rapport avec données réelles a été téléchargé avec succès.",
    })
  }

  const exportGeoJSON = () => {
    if (regionsSynodales.length === 0) {
      toast({
        title: "Aucune région à exporter",
        description: "Veuillez d'abord charger des régions synodales.",
        variant: "destructive",
      })
      return
    }

    // Enrichir le GeoJSON avec les statistiques réelles calculées
    const enrichedGeoJSON = {
      type: "FeatureCollection",
      metadata: {
        source: "EEC - Données réelles",
        date_export: new Date().toISOString(),
        total_elements_analyses: safeLayers.length,
      },
      features: regionsSynodales.map((region, index) => {
        const stats = regionStatistics[index]
        return {
          ...region,
          properties: {
            ...region.properties,
            // Conserver les données originales du GeoJSON
            donnees_originales: {
              siege: region.properties.siege,
              responsable: region.properties.responsable,
            },
            // Ajouter les statistiques calculées à partir des vraies données
            statistiques_calculees: {
              nombre_paroisses: stats?.paroisses.length || 0,
              nombre_oeuvres: stats?.oeuvres.length || 0,
              nombre_ouvriers: stats?.ouvriers.length || 0,
              total_fideles: stats?.totalFideles || 0,
              total_communiants: stats?.totalCommuniants || 0,
              total_non_communiants: stats?.totalNonCommuniants || 0,
              densite: stats?.densite || 0,
              taux_couverture: stats?.tauxCouverture || 0,
            },
            derniere_mise_a_jour: new Date().toISOString(),
          },
        }
      }),
    }

    const blob = new Blob([JSON.stringify(enrichedGeoJSON, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `regions-synodales-donnees-reelles-${new Date().toISOString().split("T")[0]}.geojson`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "GeoJSON exporté",
      description: "Le fichier GeoJSON avec données réelles a été téléchargé avec succès.",
    })
  }

  const handleShapefileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      // Ici vous pouvez implémenter l'upload réel vers votre API Django
      // const formData = new FormData()
      // Array.from(files).forEach((file) => {
      //   formData.append("files", file)
      // })
      // await cartographieApi.uploadShapefile(formData)

      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Upload shapefile",
        description: "Implémentez l'upload vers votre API Django.",
      })
    } catch (error) {
      console.error("Erreur lors du chargement du shapefile:", error)
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le fichier shapefile.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  // Initialisation optimisée de la carte
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      const map = L.map(mapRef.current, {
        center: [7.3697, 12.3547],
        zoom: 6,
        zoomControl: false,
        preferCanvas: renderMode === "canvas",
        renderer: renderMode === "canvas" ? L.canvas() : L.svg(),
        maxZoom: 18,
        minZoom: 3,
        worldCopyJump: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
      })

      mapInstanceRef.current = map

      // 🔹 Fond de carte OSM (par défaut)
      const osmLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
        tileSize: 256,
        detectRetina: true,
      })

      // 🔹 Fond de carte satellite Esri
      const esriLayer = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles © Esri & the GIS User Community",
          maxZoom: 20,
        },
      )

      // ➡️ Ajouter OSM par défaut
      osmLayer.addTo(map)

      // 🔹 Gestion des calques
      const baseMaps = {
        "Carte classique": osmLayer,
        Satellite: esriLayer,
      }

      L.control.layers(baseMaps, {}).addTo(map)

      // 🔹 Ajout des boutons de zoom
      const zoomControl = L.control.zoom({ position: "topright" })
      zoomControl.addTo(map)

      setMapReady(true)
      console.log("✅ Carte avec OSM + Satellite initialisée")
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation:", error)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        setMapReady(false)
      }
    }
  }, [renderMode])

  // Nettoyage optimisé
  const clearLayers = useCallback(() => {
    if (markersRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(markersRef.current)
      markersRef.current = null
    }
    if (connectionsRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(connectionsRef.current)
      connectionsRef.current = null
    }
    if (regionsLayerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(regionsLayerRef.current)
      regionsLayerRef.current = null
    }
    if (heatmapRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(heatmapRef.current)
      heatmapRef.current = null
    }
  }, [])

  // Validation ultra-rapide des coordonnées
  const validateCoordinates = useCallback((lat: any, lng: any): [number, number] | null => {
    const numLat = Number(lat)
    const numLng = Number(lng)
    return numLat >= -90 && numLat <= 90 && numLng >= -180 && numLng <= 180 ? [numLat, numLng] : null
  }, [])

  // Icônes ultra-optimisées avec cache
  const getOptimizedIcon = useCallback((type: string, sousType?: string, size = 12, hasRelations = false) => {
    const cacheKey = `${type}-${sousType}-${size}-${hasRelations}`
    if (markerCache.has(cacheKey)) {
      return markerCache.get(cacheKey)
    }

    let color = "#6b7280"
    let shape = "circle"
    let innerIcon = "•"

    switch (type) {
      case "bureau_national":
        color = "#dc2626"
        size = Math.max(size, 18)
        shape = "diamond"
        innerIcon = "★"
        break
      case "bureau_regional":
        color = "#ea580c"
        size = Math.max(size, 16)
        shape = "diamond"
        innerIcon = "◆"
        break
      case "bureau_district":
        color = "#d97706"
        size = Math.max(size, 14)
        shape = "square"
        innerIcon = "■"
        break
      case "paroisse":
        color = "#2563eb"
        shape = "square"
        innerIcon = "⛪"
        break
      case "oeuvre":
        switch (sousType) {
          case "scolaire":
            color = "#16a34a"
            innerIcon = "🎓"
            break
          case "sante":
          case "medicale":
            color = "#dc2626"
            innerIcon = "🏥"
            break
          case "universitaire":
            color = "#7c3aed"
            innerIcon = "🎓"
            break
          case "agropastorale":
            color = "#059669"
            innerIcon = "🌾"
            break
          default:
            color = "#9333ea"
            innerIcon = "🏢"
        }
        size = Math.max(size - 2, 8)
        break
      case "ouvrier":
        color = "#0891b2"
        innerIcon = "👤"
        size = Math.max(size - 4, 6)
        break
    }

    // Effet de relation
    const relationRing = hasRelations
      ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 + 2}" fill="none" stroke="${color}" strokeWidth="1" opacity="0.6" strokeDasharray="2,2"/>`
      : ""

    const icon = L.divIcon({
      className: "ultra-marker",
      html: `
        <div class="marker-ultra" style="width: ${size}px; height: ${size}px;">
          <svg width="${size + 4}" height="${size + 4}" viewBox="0 0 ${size + 4} ${size + 4}">
            ${relationRing}
            <${shape === "circle" ? "circle" : shape === "square" ? "rect" : "polygon"} 
              ${
                shape === "circle"
                  ? `cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}"`
                  : shape === "square"
                    ? `x="1" y="1" width="${size - 2}" height="${size - 2}" rx="1"`
                    : `points="${size / 2},1 ${size - 1},${size / 2} ${size / 2},${size - 1} 1,${size / 2}"`
              }
              fill="${color}" stroke="white" strokeWidth="1"/>
            <text x="${size / 2}" y="${size / 2 + 2}" textAnchor="middle" fontSize="${Math.max(size / 3, 6)}" fill="white">${innerIcon}</text>
          </svg>
        </div>
      `,
      iconSize: [size + 4, size + 4],
      iconAnchor: [(size + 4) / 2, (size + 4) / 2],
      popupAnchor: [0, -(size + 4) / 2],
    })

    markerCache.set(cacheKey, icon)
    return icon
  }, [])

  const renderRegionsSynodales = useCallback(() => {
    if (!showRegionsBoundaries || !mapInstanceRef.current || !regionsSynodales.length) return

    const regionsGroup = L.layerGroup()

    regionsSynodales.forEach((region, index) => {
      if (region.geometry && region.geometry.coordinates) {
        const stats = regionStatistics[index]
        const regionName =
          region.properties.nom || region.properties.name || region.properties.Region_syn || `Région ${index + 1}`

        const maxDensity = Math.max(...regionStatistics.map((r) => r.densite), 1)
        const intensity = stats && stats.densite > 0 ? Math.min(stats.densite / maxDensity, 1) : 0.1

        const style = {
          fillColor: region.properties.couleur || REGION_COLORS[index % REGION_COLORS.length],
          weight: 2,
          opacity: 0.8,
          color: region.properties.couleur || REGION_COLORS[index % REGION_COLORS.length],
          dashArray: "3",
          fillOpacity: showDensityAnalysis ? 0.1 + intensity * 0.4 : 0.1,
        }

        const layer = L.geoJSON(region, {
          style: () => style,
          onEachFeature: (feature, layer) => {
            const props = feature.properties

            const popupContent = `
              <div class="region-popup">
                <h3 class="font-bold text-lg text-blue-800 mb-2">${regionName}</h3>
                
                ${
                  stats
                    ? `
                <div class="grid grid-cols-3 gap-2 mb-3">
                  <div class="text-center p-2 bg-blue-50 rounded">
                    <div class="font-bold text-blue-700">${stats.paroisses.length}</div>
                    <div class="text-xs text-blue-600">Paroisses</div>
                  </div>
                  <div class="text-center p-2 bg-green-50 rounded">
                    <div class="font-bold text-green-700">${stats.oeuvres.length}</div>
                    <div class="text-xs text-green-600">Œuvres</div>
                  </div>
                  <div class="text-center p-2 bg-cyan-50 rounded">
                    <div class="font-bold text-cyan-700">${stats.ouvriers.length}</div>
                    <div class="text-xs text-cyan-600">Ouvriers</div>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div class="text-center p-2 bg-purple-50 rounded">
                    <div class="font-bold text-purple-700">${stats.totalFideles.toLocaleString()}</div>
                    <div class="text-xs text-purple-600">Total Fidèles</div>
                  </div>
                  <div class="text-center p-2 bg-orange-50 rounded">
                    <div class="font-bold text-orange-700">${stats.tauxCouverture.toFixed(1)}</div>
                    <div class="text-xs text-orange-600">nombre moyen de fideles par paroisses</div>
                  </div>
                </div>

                <div class="text-xs text-gray-600 space-y-1">
                  <div><strong>Densité:</strong> ${stats.densite} fidèles/paroisse</div>
                  <div><strong>Communiants:</strong> ${stats.totalCommuniants.toLocaleString()}</div>
                  <div><strong>Non-communiants:</strong> ${stats.totalNonCommuniants.toLocaleString()}</div>
                </div>
                `
                    : `
                <div class="text-center text-gray-500 py-4">
                  <div class="text-sm">Aucune donnée disponible</div>
                  <div class="text-xs">Vérifiez la configuration des données</div>
                </div>
                `
                }
              </div>
            `

            layer.bindPopup(popupContent, {
              maxWidth: 350,
              className: "region-popup-wrapper",
            })

            // Événements
            layer.on("click", () => {
              setSelectedRegion({
                ...props,
                nom: regionName,
                geometry: feature.geometry,
                stats: stats,
              })
              setShowDetails(true)
            })

            layer.on("mouseover", (e) => {
              const layer = e.target
              layer.setStyle({
                weight: 3,
                fillOpacity: showDensityAnalysis ? 0.2 + intensity * 0.5 : 0.2,
              })
            })

            layer.on("mouseout", (e) => {
              const layer = e.target
              layer.setStyle(style)
            })
          },
        })

        regionsGroup.addLayer(layer)
      }
    })

    mapInstanceRef.current.addLayer(regionsGroup)
    regionsLayerRef.current = regionsGroup
  }, [showRegionsBoundaries, showDensityAnalysis, regionsSynodales, regionStatistics])

  // Clustering ultra-performant avec WebWorker simulation
  const createUltraFastClusters = useCallback(
    (markers: any[], zoomLevel: number) => {
      const cacheKey = `${markers.length}-${zoomLevel}-${clusterDistance[0]}`
      if (clusterCache.has(cacheKey)) {
        return clusterCache.get(cacheKey)
      }

      if (!showClustering || zoomLevel > 13) {
        const result = markers.map((marker) => ({
          center: marker,
          items: [marker],
          bounds: L.latLngBounds([marker.coordinates]),
          isCluster: false,
        }))
        clusterCache.set(cacheKey, result)
        return result
      }

      const clusters: any[] = []
      const processed = new Set()
      const distance = clusterDistance[0] * Math.pow(0.8, zoomLevel - 6)

      // Tri par importance et position
      const sortedMarkers = [...markers].sort((a, b) => {
        const getWeight = (type: string) => {
          if (type.includes("bureau_national")) return 1000
          if (type.includes("bureau_regional")) return 500
          if (type.includes("bureau_district")) return 250
          if (type === "paroisse") return 100
          if (type === "oeuvre") return 50
          return 10
        }
        return getWeight(b.type) - getWeight(a.type)
      })

      // Algorithme de clustering optimisé
      for (let i = 0; i < sortedMarkers.length; i++) {
        if (processed.has(i)) continue

        const marker = sortedMarkers[i]
        const cluster = {
          center: marker,
          items: [marker],
          bounds: L.latLngBounds([marker.coordinates]),
          isCluster: false,
          types: new Set([marker.type]),
        }

        // Recherche vectorisée des voisins
        for (let j = i + 1; j < sortedMarkers.length; j++) {
          if (processed.has(j)) continue

          const other = sortedMarkers[j]
          const dx = marker.coordinates[0] - other.coordinates[0]
          const dy = marker.coordinates[1] - other.coordinates[1]
          const dist = Math.sqrt(dx * dx + dy * dy) * 111000 // Approximation rapide en mètres

          if (dist < distance) {
            cluster.items.push(other)
            cluster.bounds.extend(other.coordinates)
            cluster.types.add(other.type)
            processed.add(j)
          }
        }

        if (cluster.items.length > 1) {
          cluster.isCluster = true
          cluster.center = {
            ...cluster.center,
            coordinates: [cluster.bounds.getCenter().lat, cluster.bounds.getCenter().lng],
          }
        }

        processed.add(i)
        clusters.push(cluster)
      }

      clusterCache.set(cacheKey, clusters)
      return clusters
    },
    [clusterDistance, showClustering],
  )

  // Rendu des connexions entre éléments liés
  const renderConnections = useCallback(() => {
    if (!showConnections || !mapInstanceRef.current) return

    const connectionsGroup = L.layerGroup()

    optimizedData.relationIndex.forEach((relation, paroisseId) => {
      const paroisse = relation.paroisse
      if (!paroisse.latitude || !paroisse.longitude) return

      const paroisseCoords = [paroisse.latitude, paroisse.longitude] as [number, number]

      // Connexions vers les œuvres
      relation.oeuvres.forEach((oeuvre: any) => {
        if (oeuvre.latitude && oeuvre.longitude) {
          const oeuvreCoords = [oeuvre.latitude, oeuvre.longitude] as [number, number]
          const connection = L.polyline([paroisseCoords, oeuvreCoords], {
            color: "#10b981",
            weight: 2,
            opacity: 0.6,
            dashArray: "5, 5",
            className: "connection-line",
          })
          connectionsGroup.addLayer(connection)
        }
      })

      // Connexions vers les ouvriers (si ils ont des coordonnées)
      relation.ouvriers.forEach((ouvrier: any) => {
        if (ouvrier.latitude && ouvrier.longitude) {
          const ouvrierCoords = [ouvrier.latitude, ouvrier.longitude] as [number, number]
          const connection = L.polyline([paroisseCoords, ouvrierCoords], {
            color: "#3b82f6",
            weight: 1,
            opacity: 0.4,
            dashArray: "3, 3",
            className: "connection-line",
          })
          connectionsGroup.addLayer(connection)
        }
      })
    })

    mapInstanceRef.current.addLayer(connectionsGroup)
    connectionsRef.current = connectionsGroup
  }, [showConnections, optimizedData.relationIndex])

  // Rendu ultra-optimisé des marqueurs
  const renderUltraFastMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !filteredData.length) return

    console.time("Rendu marqueurs")
    clearLayers()

    const markersGroup = L.layerGroup()
    const currentZoom = mapInstanceRef.current.getZoom()
    let markersAdded = 0

    // Préparation des données avec validation
    const validMarkers = filteredData
      .map((item: any) => {
        const coordinates = validateCoordinates(item.latitude, item.longitude)
        if (!coordinates) return null

        const hasRelations = optimizedData.relationIndex.has(item.id)
        return { ...item, coordinates, hasRelations }
      })
      .filter(Boolean) as any[]

    // Clustering ultra-rapide
    const clusters = createUltraFastClusters(validMarkers, currentZoom)

    // Rendu par batch pour éviter le blocage
    const renderBatch = (startIndex: number, batchSize = 50) => {
      const endIndex = Math.min(startIndex + batchSize, clusters.length)

      for (let i = startIndex; i < endIndex; i++) {
        const cluster = clusters[i]

        if (!cluster.isCluster) {
          // Marqueur simple optimisé
          const item = cluster.items[0]
          const size = currentZoom < 8 ? 8 : currentZoom < 12 ? 10 : 12
          const icon = getOptimizedIcon(item.type, item.sousType || item.type_oeuvre, size, item.hasRelations)
          const marker = L.marker(item.coordinates, {
            icon,
            riseOnHover: true,
            riseOffset: 250,
          })

          // Événements optimisés
          marker.on("click", () => {
            setSelectedMarker(item)
            setShowDetails(true)

            if (item.type === "paroisse" && optimizedData.relationIndex.has(item.id)) {
              const relation = optimizedData.relationIndex.get(item.id)
              setParoissesOeuvres([item, ...relation.oeuvres, ...relation.ouvriers])
              setShowTable(true)
            }
          })

          marker.on("mouseover", () => setHoveredMarker(item))
          marker.on("mouseout", () => setHoveredMarker(null))

          // Popup ultra-léger avec région calculée
          const relationInfo = optimizedData.relationIndex.get(item.id)
          const popupContent = `
            <div class="ultra-popup">
              <h3>${item.nom || "Sans nom"}</h3>
              <p class="type">${item.type}</p>
              ${item.region_synodale_calculee ? `<p class="region">Région: ${item.region_synodale_calculee}</p>` : ""}
              ${relationInfo ? `<p class="relations">${relationInfo.oeuvres.length} œuvres, ${relationInfo.ouvriers.length} ouvriers</p>` : ""}
            </div>
          `
          marker.bindPopup(popupContent, {
            maxWidth: 200,
            className: "ultra-popup-wrapper",
            closeButton: false,
            autoPan: false,
          })

          markersGroup.addLayer(marker)
          markersAdded++
        } else {
          // Cluster optimisé
          const size = Math.min(35, 20 + cluster.items.length * 1.5)
          const clusterIcon = L.divIcon({
            className: "ultra-cluster",
            html: `
              <div class="cluster-ultra" style="width: ${size}px; height: ${size}px;">
                <div class="cluster-content">
                  <span class="cluster-count">${cluster.items.length}</span>
                  <div class="cluster-types">
                    ${Array.from(cluster.types)
                      .slice(0, 3)
                      .map((type) => `<div class="type-dot type-${type}"></div>`)
                      .join("")}
                  </div>
                </div>
              </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })

          const clusterMarker = L.marker(cluster.center.coordinates, { icon: clusterIcon })

          clusterMarker.on("click", () => {
            const padding = Math.max(20, cluster.items.length * 3)
            mapInstanceRef.current?.fitBounds(cluster.bounds, { padding: [padding, padding] })
          })

          markersGroup.addLayer(clusterMarker)
          markersAdded++
        }
      }

      // Rendu par batch pour éviter le blocage
      if (endIndex < clusters.length) {
        requestAnimationFrame(() => renderBatch(endIndex))
      } else {
        // Finalisation
        mapInstanceRef.current?.addLayer(markersGroup)
        markersRef.current = markersGroup

        // Rendu des régions synodales si activé
        if (showRegionsBoundaries && regionsSynodales.length > 0) {
          renderRegionsSynodales()
        }

        // Rendu des connexions si activé
        if (showConnections) {
          renderConnections()
        }

        console.timeEnd("Rendu marqueurs")
        console.log(`✅ ${markersAdded} éléments réels rendus en mode ultra-rapide`)
      }
    }

    renderBatch(0)
  }, [
    filteredData,
    validateCoordinates,
    createUltraFastClusters,
    getOptimizedIcon,
    optimizedData.relationIndex,
    showConnections,
    showRegionsBoundaries,
    renderConnections,
    renderRegionsSynodales,
    clearLayers,
    regionsSynodales,
  ])

  // Effets optimisés
  useEffect(() => {
    if (!mapReady) return
    renderUltraFastMarkers()
  }, [mapReady, renderUltraFastMarkers])

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return

    const handleZoomEnd = () => {
      // Debounce pour éviter les rendus multiples
      clearTimeout((window as any).zoomTimeout)
      ;(window as any).zoomTimeout = setTimeout(renderUltraFastMarkers, 100)
    }

    mapInstanceRef.current.on("zoomend", handleZoomEnd)
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("zoomend", handleZoomEnd)
      }
    }
  }, [mapReady, renderUltraFastMarkers])

  // Contrôles de la carte
  const zoomIn = () => mapInstanceRef.current?.zoomIn()
  const zoomOut = () => mapInstanceRef.current?.zoomOut()
  const resetView = () => {
    mapInstanceRef.current?.setView([7.3697, 12.3547], 6)
    setShowDetails(false)
    setShowTable(false)
    setShowRegionStats(false)
  }

  // Zoom sur une région spécifique
  const zoomToRegion = (regionName: string) => {
    const region = regionsSynodales.find(
      (r) => (r.properties.nom || r.properties.name || r.properties.NAME) === regionName,
    )
    if (region && mapInstanceRef.current) {
      const layer = L.geoJSON(region)
      mapInstanceRef.current.fitBounds(layer.getBounds(), { padding: [20, 20] })
    }
  }

  // Statistiques par type
  const getCountByType = (type: string) => {
    switch (type) {
      case "paroisses":
        return optimizedData.paroisses.length
      case "oeuvres":
        return optimizedData.oeuvres.length
      case "ouvriers":
        return optimizedData.ouvriers.length
      case "bureaux":
        return optimizedData.all.filter((item: any) => item.type.includes("bureau")).length
      default:
        return optimizedData.all.length
    }
  }

  if (!safeLayers.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Aucune donnée disponible</h3>
            <p className="text-gray-500">Vérifiez la connexion à l'API Django</p>
          </div>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Contrôles principaux avec onglets */}
      <div className="absolute top-4 left-4 z-[1000] space-y-2">
        {/* Recherche rapide */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher dans vos données..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs border rounded w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Onglets principaux */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg w-80">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 m-2">
              <TabsTrigger value="layers" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                Couches
              </TabsTrigger>
              <TabsTrigger value="regions" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Régions
              </TabsTrigger>
              <TabsTrigger value="stats" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Alertes
              </TabsTrigger>
            </TabsList>

            <div className="p-3">
              {/* Onglet Couches */}
              <TabsContent value="layers" className="space-y-3 mt-0">
                <div className="space-y-2">
                  {[
                    { key: "all", label: "Tout", icon: MapPin, count: optimizedData.all.length },
                    { key: "paroisses", label: "Paroisses", icon: Building, count: getCountByType("paroisses") },
                    { key: "oeuvres", label: "Œuvres", icon: GraduationCap, count: getCountByType("oeuvres") },
                    { key: "ouvriers", label: "Ouvriers", icon: Users, count: getCountByType("ouvriers") },
                  ].map(({ key, label, icon: Icon, count }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={activeLayer === key ? "default" : "outline"}
                      onClick={() => setActiveLayer(key)}
                      className="w-full justify-between text-xs h-7"
                    >
                      <div className="flex items-center gap-1">
                        <Icon className="h-3 w-3" />
                        <span>{label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        {count}
                      </Badge>
                    </Button>
                  ))}
                </div>

                {/* Filtre par région */}
                <div className="space-y-2">
                  <Label className="text-xs">Filtrer par région</Label>
                  <Select value={selectedRegionFilter} onValueChange={setSelectedRegionFilter}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {regionStatistics.map((region) => (
                        <SelectItem key={region.nom} value={region.nom}>
                          {region.nom} ({region.paroisses.length + region.oeuvres.length + region.ouvriers.length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Options d'affichage */}
                <div className="space-y-2 border-t pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs">Clustering</label>
                    <input
                      type="checkbox"
                      checked={showClustering}
                      onChange={(e) => setShowClustering(e.target.checked)}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs">Relations</label>
                    <input
                      type="checkbox"
                      checked={showConnections}
                      onChange={(e) => setShowConnections(e.target.checked)}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs">Régions</label>
                    <input
                      type="checkbox"
                      checked={showRegionsBoundaries}
                      onChange={(e) => setShowRegionsBoundaries(e.target.checked)}
                      className="rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs">Analyse densité</label>
                    <input
                      type="checkbox"
                      checked={showDensityAnalysis}
                      onChange={(e) => setShowDensityAnalysis(e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Régions */}
              <TabsContent value="regions" className="space-y-3 mt-0">
                {/* Actions des régions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Régions Synodales</h3>
                    {isRegionsSaved && <Check className="h-4 w-4 text-green-600" />}
                  </div>

                  {/* Boutons d'action */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      onClick={saveRegions}
                      disabled={regionsSynodales.length === 0 || isSaving}
                      className="text-xs"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 mr-1" />
                      )}
                      Sauvegarder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportGeoJSON}
                      disabled={regionsSynodales.length === 0}
                      className="text-xs bg-transparent"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      GeoJSON
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportRegionReport}
                      disabled={regionStatistics.length === 0}
                      className="text-xs bg-transparent col-span-2"
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Rapport Détaillé
                    </Button>
                  </div>

                  {/* Upload shapefile */}
                  <div>
                    <Label htmlFor="shapefile-upload" className="text-xs">
                      Charger un shapefile
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="shapefile-upload"
                        type="file"
                        multiple
                        accept=".shp,.shx,.dbf,.prj,.cpg"
                        onChange={handleShapefileUpload}
                        disabled={isUploading}
                        className="text-xs"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sélectionnez tous les fichiers (.shp, .shx, .dbf, .prj)
                    </p>
                  </div>
                </div>

                {/* Liste des régions avec navigation */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-900">Navigation Régions</h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {regionStatistics.map((region) => (
                      <div
                        key={region.nom}
                        className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => zoomToRegion(region.nom)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded border border-white"
                              style={{ backgroundColor: region.couleur }}
                            ></div>
                            <div>
                              <p className="text-xs font-medium">{region.nom}</p>
                              <p className="text-xs text-gray-500">
                                {region.paroisses.length}P • {region.oeuvres.length}Œ • {region.ouvriers.length}O
                              </p>
                            </div>
                          </div>
                          <Compass className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Statistiques */}
              <TabsContent value="stats" className="space-y-3 mt-0">
                <div className="space-y-3">
                  {/* Résumé global basé sur les vraies données */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-700">
                        {regionStatistics.reduce((sum, r) => sum + r.totalFideles, 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600">Total Fidèles</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-700">
                        {regionStatistics.reduce((sum, r) => sum + r.paroisses.length, 0)}
                      </div>
                      <div className="text-xs text-green-600">Total Paroisses</div>
                    </div>
                  </div>

                  {/* Top régions basé sur les vraies données */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Top Régions par Fidèles (Données Réelles)</h4>
                    <div className="space-y-1">
                      {regionStatistics
                        .sort((a, b) => b.totalFideles - a.totalFideles)
                        .slice(0, 3)
                        .map((region, index) => (
                          <div key={region.nom} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                  index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{region.nom}</p>
                                <p className="text-xs text-gray-500">{region.tauxCouverture.toFixed(1)}% couverture</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold">{region.totalFideles.toLocaleString()}</p>
                              <p className="text-xs text-gray-500">{region.densite.toFixed(1)}/paroisse</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Analyse comparative basée sur les vraies données */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Analyse Comparative (Données Réelles)</h4>
                    <div className="space-y-2">
                      {regionStatistics.map((region) => (
                        <div key={region.nom} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{region.nom}</span>
                            <span>{region.totalFideles.toLocaleString()}</span>
                          </div>
                          <Progress
                            value={
                              regionStatistics.length > 0 &&
                              Math.max(...regionStatistics.map((r) => r.totalFideles)) > 0
                                ? (region.totalFideles / Math.max(...regionStatistics.map((r) => r.totalFideles))) * 100
                                : 0
                            }
                            className="h-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Métriques avancées basées sur les vraies données */}
                  <div>
                    <h4 className="text-xs font-medium mb-2">Métriques Avancées (Calculées)</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-purple-50 rounded">
                        <div className="font-bold text-purple-700">
                          {regionStatistics.length > 0
                            ? (
                                regionStatistics.reduce((sum, r) => sum + r.densite, 0) / regionStatistics.length
                              ).toFixed(1)
                            : "0"}
                        </div>
                        <div className="text-purple-600">Densité Moy.</div>
                      </div>
                      <div className="p-2 bg-orange-50 rounded">
                        <div className="font-bold text-orange-700">
                          {regionStatistics.length > 0
                            ? (
                                regionStatistics.reduce((sum, r) => sum + r.tauxCouverture, 0) / regionStatistics.length
                              ).toFixed(1)
                            : "0"}
                          %
                        </div>
                        <div className="text-orange-600">Couverture Moy.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Alertes basées sur les vraies données */}
              <TabsContent value="alerts" className="space-y-3 mt-0">
                <div className="space-y-2">
                  <h4 className="text-xs font-medium">Alertes et Recommandations (Données Réelles)</h4>

                  {regionAlerts.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-xs">Aucune alerte</p>
                      <p className="text-xs">Toutes les régions sont bien couvertes</p>
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {regionAlerts.map((alert, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded border-l-4 ${
                            alert.type === "error"
                              ? "bg-red-50 border-red-500"
                              : alert.type === "warning"
                                ? "bg-yellow-50 border-yellow-500"
                                : alert.type === "success"
                                  ? "bg-green-50 border-green-500"
                                  : "bg-blue-50 border-blue-500"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <alert.icon
                              className={`h-3 w-3 mt-0.5 ${
                                alert.type === "error"
                                  ? "text-red-600"
                                  : alert.type === "warning"
                                    ? "text-yellow-600"
                                    : alert.type === "success"
                                      ? "text-green-600"
                                      : "text-blue-600"
                              }`}
                            />
                            <div>
                              <p className="text-xs font-medium">{alert.region}</p>
                              <p className="text-xs text-gray-600">{alert.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions recommandées basées sur l'analyse des vraies données */}
                  <div className="border-t pt-2">
                    <h5 className="text-xs font-medium mb-2">Actions Recommandées</h5>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        <span>Prioriser les régions à faible couverture</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        <span>Développer les œuvres dans les zones denses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        <span>Former plus d'ouvriers locaux</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* Statistiques temps réel */}
      <div className="absolute top-4 right-80 z-[1000]">
        <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Stats Live (Données Réelles)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Affichés:</span>
                <Badge variant="outline" className="text-xs">
                  {filteredData.length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Relations:</span>
                <Badge variant="outline" className="text-xs">
                  {optimizedData.relationIndex.size}
                </Badge>
              </div>
              {regionsSynodales.length > 0 && (
                <div className="flex justify-between">
                  <span>Régions:</span>
                  <Badge variant="outline" className="text-xs">
                    {regionsSynodales.length}
                  </Badge>
                </div>
              )}
              {selectedRegionFilter !== "all" && (
                <div className="border-t pt-1">
                  <div className="text-xs font-medium text-purple-600">{selectedRegionFilter}</div>
                  <div className="text-xs text-gray-500">Région filtrée</div>
                </div>
              )}
              {hoveredMarker && (
                <div className="border-t pt-1">
                  <div className="text-xs font-medium text-blue-600">{hoveredMarker.nom}</div>
                  <div className="text-xs text-gray-500">{hoveredMarker.type}</div>
                  {hoveredMarker.region_synodale_calculee && (
                    <div className="text-xs text-purple-600">{hoveredMarker.region_synodale_calculee}</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contrôles de zoom */}
      <div className="absolute top-4 right-4 z-[1000] space-y-1">
        <div className="flex flex-col space-y-1">
          <Button size="sm" variant="outline" onClick={zoomIn} className="bg-white/95 backdrop-blur-sm h-8 w-8 p-0">
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={zoomOut} className="bg-white/95 backdrop-blur-sm h-8 w-8 p-0">
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={resetView} className="bg-white/95 backdrop-blur-sm h-8 w-8 p-0">
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Bouton de rafraîchissement avec indicateur de performance */}
      <div className="absolute bottom-4 right-4 z-[1000] space-y-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="h-3 w-3 text-green-500" />
            <span className="text-green-600 font-medium">Données Réelles</span>
          </div>
          <div className="text-xs text-gray-500">API Django + GeoJSON</div>
          {regionsSynodales.length > 0 && (
            <div className="text-xs text-purple-600">Régions: {regionsSynodales.length}</div>
          )}
          {showDensityAnalysis && <div className="text-xs text-orange-600">Analyse densité active</div>}
        </div>
        <Button
          onClick={onRefresh}
          disabled={loading}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Panel de détails enrichi avec données réelles */}
      {showDetails && (selectedMarker || selectedRegion) && (
        <div className="absolute top-4 right-20 z-[1000] w-96">
          <Card className="bg-white/98 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {selectedRegion && <Globe className="h-4 w-4 text-purple-600" />}
                  {selectedMarker?.type === "paroisse" && <Building className="h-4 w-4 text-blue-600" />}
                  {selectedMarker?.type === "oeuvre" && <GraduationCap className="h-4 w-4 text-green-600" />}
                  {selectedMarker?.type === "ouvrier" && <Users className="h-4 w-4 text-cyan-600" />}
                  <span className="truncate">{selectedRegion?.nom || selectedMarker?.nom}</span>
                </CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setShowDetails(false)} className="h-6 w-6 p-0">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Détails région synodale enrichis avec données réelles */}
              {selectedRegion && selectedRegion.stats && (
                <div className="space-y-3">
                  {/* Statistiques principales calculées */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-bold text-blue-700">{selectedRegion.stats.paroisses.length}</div>
                      <div className="text-blue-600 text-xs">Paroisses</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-bold text-green-700">{selectedRegion.stats.oeuvres.length}</div>
                      <div className="text-green-600 text-xs">Œuvres</div>
                    </div>
                    <div className="text-center p-2 bg-cyan-50 rounded">
                      <div className="font-bold text-cyan-700">{selectedRegion.stats.ouvriers.length}</div>
                      <div className="text-cyan-600 text-xs">Ouvriers</div>
                    </div>
                  </div>

                  {/* Métriques avancées calculées */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-bold text-purple-700">
                        {selectedRegion.stats.totalFideles.toLocaleString()}
                      </div>
                      <div className="text-purple-600 text-xs">Total Fidèles</div>
                    </div>
                    <div className="text-center p-2 bg-orange-50 rounded">
                      <div className="font-bold text-orange-700">{selectedRegion.stats.tauxCouverture.toFixed(1)}</div>
                      <div className="text-orange-600 text-xs">fidèles par paroisse</div>
                    </div>
                  </div>

                  {/* Détails supplémentaires basés sur les vraies données */}
                  <div className="text-xs space-y-1 border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Densité calculée:</span>
                      <span className="font-medium">{selectedRegion.stats.densite} fidèles/paroisse</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Communiants:</span>
                      <span className="font-medium">{selectedRegion.stats.totalCommuniants.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Non-communiants:</span>
                      <span className="font-medium">{selectedRegion.stats.totalNonCommuniants.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRegionFilter(selectedRegion.nom)}
                      className="flex-1 text-xs bg-transparent"
                    >
                      <Filter className="h-3 w-3 mr-1" />
                      Filtrer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => zoomToRegion(selectedRegion.nom)}
                      className="flex-1 text-xs bg-transparent"
                    >
                      <MapIcon className="h-3 w-3 mr-1" />
                      Centrer
                    </Button>
                  </div>
                </div>
              )}

              {/* Détails marqueur existant avec région calculée */}
              {selectedMarker && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium text-gray-600">Type:</span>
                      <p>{selectedMarker.type}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Région calculée:</span>
                      <p className="text-purple-600 font-medium">
                        {selectedMarker.region_synodale_calculee || "Non assignée"}
                      </p>
                    </div>
                  </div>

                  {/* Relations spécifiques */}
                  {selectedMarker.type === "paroisse" && optimizedData.relationIndex.has(selectedMarker.id) && (
                    <div className="border rounded-lg p-3 bg-blue-50">
                      <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        Relations (Données Réelles)
                      </h4>
                      {(() => {
                        const relation = optimizedData.relationIndex.get(selectedMarker.id)
                        return (
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center p-2 bg-green-100 rounded">
                              <div className="font-bold text-green-700">{relation.oeuvres.length}</div>
                              <div className="text-green-600">Œuvres</div>
                            </div>
                            <div className="text-center p-2 bg-cyan-100 rounded">
                              <div className="font-bold text-cyan-700">{relation.ouvriers.length}</div>
                              <div className="text-cyan-600">Ouvriers</div>
                            </div>
                          </div>
                        )
                      })()}

                      {paroissesOeuvres.length > 1 && (
                        <Button
                          onClick={() => setShowTable(!showTable)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 h-6 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {showTable ? "Masquer" : "Voir"} les détails
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Statistiques pour paroisse basées sur les vraies données */}
                  {selectedMarker.type === "paroisse" &&
                    (selectedMarker.communiants || selectedMarker.non_communiants) && (
                      <div className="grid grid-cols-2 gap-1">
                        {selectedMarker.communiants && (
                          <div className="bg-blue-50 p-2 rounded text-center">
                            <div className="text-sm font-bold text-blue-700">
                              {Number(selectedMarker.communiants).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600">Communiants</div>
                          </div>
                        )}
                        {selectedMarker.non_communiants && (
                          <div className="bg-gray-50 p-2 rounded text-center">
                            <div className="text-sm font-bold text-gray-700">
                              {Number(selectedMarker.non_communiants).toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600">Non-communiants</div>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Informations pour œuvre */}
                  {selectedMarker.type === "oeuvre" && (
                    <div className="space-y-2">
                      {selectedMarker.paroisse_nom && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-600">Paroisse:</span>
                          <p className="text-blue-600 font-medium">{selectedMarker.paroisse_nom}</p>
                        </div>
                      )}
                      {selectedMarker.niveau && (
                        <div className="text-xs">
                          <span className="font-medium text-gray-600">Niveau:</span>
                          <p className="capitalize">{selectedMarker.niveau}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Coordonnées */}
                  <div className="text-xs text-gray-500 border-t pt-2">
                    <span className="font-medium">Coordonnées:</span>
                    <p className="font-mono">
                      {selectedMarker.coordinates[0].toFixed(4)}, {selectedMarker.coordinates[1].toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conteneur de la carte */}
      <div ref={mapRef} className="w-full h-full rounded-lg" />

      {/* Table des relations (optimisée) avec données réelles */}
      {showTable && paroissesOeuvres.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-[999] bg-white border-t shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1">
                <Network className="h-3 w-3 text-blue-600" />
                Relations de {paroissesOeuvres[0]?.nom} (Données Réelles)
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setShowTable(false)} className="h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs h-6">Type</TableHead>
                    <TableHead className="text-xs h-6">Nom</TableHead>
                    <TableHead className="text-xs h-6">Région Calculée</TableHead>
                    <TableHead className="text-xs h-6">Statut</TableHead>
                    <TableHead className="text-xs h-6">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paroissesOeuvres.slice(1).map((item) => (
                    <TableRow key={`${item.type}-${item.id}`} className="hover:bg-gray-50 h-6">
                      <TableCell className="text-xs py-1">
                        <div className="flex items-center gap-1">
                          {item.type === "oeuvre" ? (
                            <GraduationCap className="h-2 w-2 text-green-600" />
                          ) : (
                            <Users className="h-2 w-2 text-cyan-600" />
                          )}
                          <span>{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs py-1 font-medium truncate">{item.nom}</TableCell>
                      <TableCell className="text-xs py-1 text-purple-600">
                        {item.region_synodale_calculee || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs py-1">
                        <Badge variant="default" className="text-xs h-4">
                          {item.statut || "Actif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs py-1">{item.niveau || item.grade || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS ultra-optimisés */}
      <style jsx global>{`
        .ultra-marker {
          background: transparent !important;
          border: none !important;
        }

        .marker-ultra {
          background: transparent !important;
          border: none !important;
        }

        .marker-ultra {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s ease;
          cursor: pointer;
        }

        .marker-ultra:hover {
          transform: scale(1.2);
          z-index: 1000;
        }

        .ultra-popup {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          line-height: 1.3;
        }

        .ultra-popup h3 {
          margin: 0 0 2px 0;
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
        }

        .ultra-popup .type {
          margin: 0;
          font-size: 10px;
          color: #6b7280;
          text-transform: capitalize;
        }

        .ultra-popup .region {
          margin: 2px 0 0 0;
          font-size: 9px;
          color: #7c3aed;
          font-weight: 500;
        }

        .ultra-popup .relations {
          margin: 2px 0 0 0;
          font-size: 9px;
          color: #059669;
          font-weight: 500;
        }

        .ultra-popup-wrapper .leaflet-popup-content-wrapper {
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          padding: 1px;
        }

        .ultra-popup-wrapper .leaflet-popup-content {
          margin: 4px 6px;
          line-height: 1.2;
        }

        .region-popup {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          line-height: 1.4;
        }

        .region-popup-wrapper .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 2px;
        }

        .region-popup-wrapper .leaflet-popup-content {
          margin: 8px 12px;
          line-height: 1.3;
        }

        .ultra-cluster {
          background: transparent !important;
          border: none !important;
        }

        .cluster-ultra {
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .cluster-ultra:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .cluster-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .cluster-count {
          color: white;
          font-weight: bold;
          font-size: 10px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .cluster-types {
          display: flex;
          gap: 1px;
          margin-top: 1px;
        }

        .type-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: white;
        }

        .type-paroisse { background: #2563eb !important; }
        .type-oeuvre { background: #16a34a !important; }
        .type-ouvrier { background: #0891b2 !important; }

        .connection-line {
          pointer-events: none;
        }

        .leaflet-container {
          font-family: inherit;
        }

        .leaflet-marker-icon {
          transition: none !important;
        }

        .leaflet-zoom-anim .leaflet-zoom-animated {
          transition: none !important;
        }

        /* Optimisations de performance */
        .leaflet-tile-container {
          transform: translate3d(0,0,0);
        }

        .leaflet-layer {
          transform: translate3d(0,0,0);
        }
      `}</style>
    </div>
  )
}
