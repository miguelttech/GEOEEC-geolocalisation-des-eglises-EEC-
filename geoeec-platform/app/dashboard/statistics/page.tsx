"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Search,
  Building,
  Users,
  Heart,
  GraduationCap,
  BarChart3,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Award,
  AlertCircle,
  CheckCircle,
  Target,
  Activity,
  Download,
  Filter,
  Eye,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Clock,
  School,
  Layers,
  UserCheck,
  Map,
} from "lucide-react"
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Line,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
  Treemap,
  BarChart,
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import type { StatisticsResponse } from "@/hooks/models"

export default function AdvancedStatisticsPage() {
  const { toast } = useToast()
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedDistrict, setSelectedDistrict] = useState("all")
  const [selectedNiveau, setSelectedNiveau] = useState("all")
  const [selectedTypeOeuvre, setSelectedTypeOeuvre] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isExporting, setIsExporting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statisticsData, setStatisticsData] = useState<StatisticsResponse | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Couleurs pour les graphiques
  const COLORS = {
    primary: ["#3B82F6", "#1D4ED8", "#1E40AF"],
    success: ["#10B981", "#059669", "#047857"],
    warning: ["#F59E0B", "#D97706", "#B45309"],
    danger: ["#EF4444", "#DC2626", "#B91C1C"],
    purple: ["#8B5CF6", "#7C3AED", "#6D28D9"],
    pink: ["#EC4899", "#DB2777", "#BE185D"],
    gradient: ["#667eea", "#764ba2", "#f093fb", "#f5576c", "#4facfe", "#00f2fe"],
    oeuvres: {
      scolaire: "#3B82F6",
      universitaire: "#8B5CF6",
      medicale: "#EF4444",
      agropastorale: "#10B981",
      immeuble: "#F59E0B",
      terrain: "#6B7280",
      autre: "#EC4899",
    },
  }

  // Fonction pour charger les données
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (selectedRegion && selectedRegion !== "all") {
        params.append("region", selectedRegion)
      }
      if (selectedDistrict && selectedDistrict !== "all") {
        params.append("district", selectedDistrict)
      }
      if (selectedNiveau && selectedNiveau !== "all") {
        params.append("niveau", selectedNiveau)
      }
      if (selectedTypeOeuvre && selectedTypeOeuvre !== "all") {
        params.append("type_oeuvre", selectedTypeOeuvre)
      }

      const queryString = params.toString()
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/statistiques/${queryString ? `?${queryString}` : ""}`

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setStatisticsData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedRegion, selectedDistrict, selectedNiveau, selectedTypeOeuvre])

  // Calcul des métriques de performance avancées
  const performanceMetrics = useMemo(() => {
    if (!statisticsData) return null

    const { overview, analyses } = statisticsData

    // Vérifications de sécurité avec valeurs par défaut
    const totalParoisses = overview?.total_paroisses || 0
    const totalOuvriers = overview?.total_ouvriers || 0
    const totalFideles = overview?.total_fideles || 0
    const totalOeuvres = overview?.total_oeuvres || 0
    const totalCommuniants = overview?.total_communiants || 0
    const totalNonCommuniants = overview?.total_non_communiants || 0


    // Score global basé sur plusieurs facteurs
    const scoreGlobal = Math.min(
      100,
      Math.max(
        0,
        (totalFideles / Math.max(totalParoisses, 1)) * 0.1 + // Efficacité évangélisation
          (totalOeuvres / Math.max(totalParoisses, 1)) * 20 + // Densité œuvres
          (totalOuvriers / Math.max(totalParoisses, 1)) * 15  // Ratio ouvriers
      ),
    )

    const zonesAttention = []
    const recommandations = []

    // Analyse des zones d'attention


    if (totalOuvriers / Math.max(totalParoisses, 1) < 3) {
      zonesAttention.push("Ratio ouvriers/paroisses insuffisant")
      recommandations.push("Intensifier les programmes de formation d'ouvriers")
    }

    if (totalOeuvres / Math.max(totalParoisses, 1) < 2) {
      zonesAttention.push("Faible densité d'œuvres par paroisse")
      recommandations.push("Développer davantage d'œuvres spécialisées")
    }

    const ratioNonCommuniants = totalNonCommuniants / Math.max(totalFideles, 1)
    if (ratioNonCommuniants > 0.6) {
      zonesAttention.push("Taux élevé de non-communiants")
      recommandations.push("Renforcer l'accompagnement vers la communion")
    }

    return {
      score_global: scoreGlobal,
      zones_attention: zonesAttention,
      recommandations,
      objectifs_atteints: Math.floor(scoreGlobal / 25),
      indicateurs_sante: {
        paroisses: scoreGlobal > 80 ? "excellent" : scoreGlobal > 60 ? "bon" : scoreGlobal > 40 ? "moyen" : "faible",
        ouvriers:
          totalOuvriers / Math.max(totalParoisses, 1) > 5
            ? "excellent"
            : totalOuvriers / Math.max(totalParoisses, 1) > 3
              ? "bon"
              : totalOuvriers / Math.max(totalParoisses, 1) > 2
                ? "moyen"
                : "faible",
        oeuvres:
          totalOeuvres / Math.max(totalParoisses, 1) > 3
            ? "excellent"
            : totalOeuvres / Math.max(totalParoisses, 1) > 2
              ? "bon"
              : totalOeuvres / Math.max(totalParoisses, 1) > 1
                ? "moyen"
                : "faible",
      },
      ratios: {
        fideles_par_paroisse: totalFideles / Math.max(totalParoisses, 1),
        ouvriers_par_paroisse: totalOuvriers / Math.max(totalParoisses, 1),
        oeuvres_par_paroisse: totalOeuvres / Math.max(totalParoisses, 1),
        taux_communion: (totalCommuniants / Math.max(totalFideles, 1)) * 100,
      },
    }
  }, [statisticsData])

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!statisticsData) return null

    // Vérifications de sécurité pour éviter les erreurs
    const parRegion = statisticsData.paroisses?.par_region || []
    const parType = statisticsData.oeuvres?.par_type || []
    const parNiveau = statisticsData.oeuvres?.par_niveau || []
    const parGrade = statisticsData.ouvriers?.par_grade || []
    const paroisseData = statisticsData.paroisses?.data || []
    const regionsPerformance = statisticsData.analyses?.regions_performance || []
    const parDistrict = statisticsData.ouvriers?.par_district || []
    const parRegionOeuvres = statisticsData.oeuvres?.par_region || []

    return {
      // Graphique par région avec toutes les métriques
      regionChart: parRegion.map((region) => ({
        name: region.region_synodale || "Région inconnue",
        Paroisses: region.count || 0,
        Ouvriers: region.ouvriers || 0,
        Fidèles: region.total_fideles || 0,
        Œuvres: region.oeuvres || 0,
        Communiants: region.communiants || 0,
        "Non-Communiants": region.non_communiants || 0,
        "Taux Communion": ((region.communiants || 0) / Math.max(region.total_fideles || 1, 1)) * 100,
        Efficacité: (region.total_fideles || 0) / Math.max(region.count || 1, 1),
      })),

      // Graphique des œuvres par type avec couleurs spécifiques
      oeuvreChart: parType.map((oeuvre) => ({
        name: (oeuvre.type || "Inconnu").charAt(0).toUpperCase() + (oeuvre.type || "inconnu").slice(1),
        value: oeuvre.count || 0,
        percentage: oeuvre.pourcentage || 0,
        color: COLORS.oeuvres[oeuvre.type as keyof typeof COLORS.oeuvres] || COLORS.gradient[0],
      })),

      // Graphique des œuvres par niveau
      niveauOeuvreChart: parNiveau.map((niveau) => ({
        name: (niveau.niveau || "Inconnu").charAt(0).toUpperCase() + (niveau.niveau || "inconnu").slice(1),
        value: niveau.count || 0,
        percentage: niveau.pourcentage || 0,
      })),

      // Graphique des grades d'ouvriers
      gradeChart: parGrade.map((grade) => ({
        name: grade.grade || "Grade inconnu",
        value: grade.count || 0,
        percentage: grade.pourcentage || 0,
      })),

      // Radar de performance par région
      performanceRadar: regionsPerformance.map((region) => ({
        region: region.region_synodale || "Région inconnue",
        "Score Global": region.score_global || 0,
        Efficacité: region.efficacite_evangelisation || 0,
        "Densité Œuvres": region.densite_oeuvres || 0,
        "Ratio Ouvriers": region.ratio_ouvriers || 0,
      })),

      // Corrélation entre différentes métriques
      correlationData: paroisseData.map((paroisse) => ({
        x: paroisse.oeuvres_count || 0,
        y: paroisse.total_fideles || 0,
        z: paroisse.ouvriers || 0,
        name: paroisse.nom || "Paroisse inconnue",
        region: paroisse.region_synodale || "Région inconnue",
      })),

      // Treemap pour visualiser la hiérarchie
      treemapData: parRegion.map((region) => ({
        name: region.region_synodale || "Région inconnue",
        size: region.total_fideles || 0,
        children: paroisseData
          .filter((p) => p.region_synodale === region.region_synodale)
          .slice(0, 5) // Top 5 paroisses par région
          .map((paroisse) => ({
            name: paroisse.nom || "Paroisse inconnue",
            size: paroisse.total_fideles || 0,
          })),
      })),

      // Distribution des niveaux de paroisses
      niveauParoisseChart: (statisticsData.paroisses?.par_niveau || []).map((niveau) => ({
        name: niveau.niveau || "Niveau inconnu",
        value: niveau.count || 0,
        percentage: niveau.pourcentage || 0,
      })),

      // Données pour les graphiques d'ouvriers par district
      districtChart: parDistrict.map((district) => ({
        district: district.district || "District inconnu",
        count: district.count || 0,
      })),

      // Données pour les œuvres par région
      oeuvreRegionChart: parRegionOeuvres.map((region) => ({
        region_synodale: region.region_synodale || "Région inconnue",
        count: region.count || 0,
        types: region.types || {},
      })),
    }
  }, [statisticsData])

  // Composant KPI amélioré avec icônes spécifiques
  const EnhancedKPICard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    target,
    description,
    ratio,
  }: {
    title: string
    value: number | string
    change: number
    icon: any
    color: string
    target?: number
    description?: string
    ratio?: string
  }) => (
    <Card
      className={`relative overflow-hidden bg-gradient-to-br ${color} shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-white/80">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold text-white">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {change !== 0 && (
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    change > 0 ? "bg-green-500/20 text-green-100" : "bg-red-500/20 text-red-100"
                  }`}
                >
                  {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  <span>{Math.abs(change).toFixed(1)}%</span>
                </div>
              )}
            </div>
            {description && <p className="text-xs text-white/70">{description}</p>}
            {ratio && <p className="text-xs text-white/80 font-medium">{ratio}</p>}
            {target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white/80">
                  <span>Objectif: {target.toLocaleString()}</span>
                  <span>{Math.round((Number(value) / target) * 100)}%</span>
                </div>
                <Progress value={Math.min(100, (Number(value) / target) * 100)} className="h-1 bg-white/20" />
              </div>
            )}
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Icon className="h-8 w-8 text-white" />
          </div>
        </div>
      </CardContent>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
    </Card>
  )

  // Composant pour les insights et recommandations
  const InsightsPanel = () => {
    if (!performanceMetrics) return null

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <span>Zones d'Attention</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceMetrics?.zones_attention.length ? (
                performanceMetrics.zones_attention.map((zone, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-amber-800 font-medium">{zone}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-green-700 font-medium">Aucune zone d'attention détectée</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Lightbulb className="h-5 w-5" />
              <span>Recommandations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceMetrics?.recommandations.length ? (
                performanceMetrics.recommandations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-blue-800 font-medium">{rec}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Star className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-700 font-medium">Performance optimale</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Composant pour le score de performance
  const PerformanceScore = () => {
    if (!performanceMetrics) return null

    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Target className="h-5 w-5" />
            <span>Score de Performance Global</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-8">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${((performanceMetrics?.score_global || 0) / 100) * 314} 314`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-800">
                    {Math.round(performanceMetrics?.score_global || 0)}
                  </div>
                  <div className="text-xs text-purple-600">/ 100</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Objectifs atteints:</div>
                <div className="flex space-x-1">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded ${
                        i < (performanceMetrics?.objectifs_atteints || 0) ? "bg-green-500" : "bg-gray-200"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
              {performanceMetrics?.ratios && (
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Fidèles/Paroisse: {performanceMetrics.ratios.fideles_par_paroisse.toFixed(0)}</div>
                  <div>Taux communion: {performanceMetrics.ratios.taux_communion.toFixed(1)}%</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleRefresh = async () => {
    await fetchData()
    toast({
      title: "Données actualisées",
      description: "Toutes les statistiques ont été rechargées",
    })
  }

  const handleExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setIsExporting(true)
      // Simulation d'export
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast({
        title: "Export réussi",
        description: `Le rapport ${format.toUpperCase()} a été généré`,
      })
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  if (loading && !statisticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-lg font-medium">Chargement des analyses...</p>
          <p className="text-gray-500 text-sm">Préparation du tableau de bord</p>
        </div>
      </div>
    )
  }

  if (error && !statisticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Alert className="max-w-md bg-white shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erreur lors du chargement: {error}
                <Button onClick={handleRefresh} className="mt-2 w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  if (!statisticsData || !performanceMetrics || !chartData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-lg font-medium">Initialisation du tableau de bord...</p>
          <p className="text-gray-500 text-sm">Vérification des données</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header amélioré */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-white/20 backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Tableau de Bord Statistiaues EEC
                  </h1>
                  <p className="text-gray-600">Analyse complète des paroisses, œuvres et ouvriers</p>
                </div>
              </div>
              {lastUpdated && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Dernière mise à jour: {lastUpdated.toLocaleString("fr-FR")}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                className="bg-white/80 hover:bg-white border-gray-200 shadow-sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>

              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="bg-white/80 hover:bg-white border-gray-200 shadow-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Région</Label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {statisticsData.filters.regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">District</Label>
                  <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Tous les districts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les districts</SelectItem>
                      {statisticsData.filters.districts.map((district) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Niveau</Label>
                  <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les niveaux</SelectItem>
                      {statisticsData.filters.niveaux.map((niveau) => (
                        <SelectItem key={niveau} value={niveau}>
                          {niveau}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Type d'œuvre</Label>
                  <Select value={selectedTypeOeuvre} onValueChange={setSelectedTypeOeuvre}>
                    <SelectTrigger className="bg-white border-gray-200">
                      <SelectValue placeholder="Tous les types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      {statisticsData.filters.types_oeuvres.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSelectedRegion("all")
                      setSelectedDistrict("all")
                      setSelectedNiveau("all")
                      setSelectedTypeOeuvre("all")
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full bg-white border-gray-200"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPI Cards avec données réelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <EnhancedKPICard
            title="Paroisses Actives"
            value={statisticsData?.overview?.total_paroisses || 0}
            change={statisticsData?.overview?.croissance_paroisses || 0}
            icon={Building}
            color="from-emerald-500 to-teal-600"
            description="Communautés établies"
            ratio={`${(performanceMetrics?.ratios?.fideles_par_paroisse || 0).toFixed(0)} fidèles/paroisse`}
          />

          <EnhancedKPICard
            title="Ouvriers Formés"
            value={statisticsData?.overview?.total_ouvriers || 0}
            change={statisticsData?.overview?.croissance_ouvriers || 0}
            icon={Users}
            color="from-blue-500 to-indigo-600"
            description="Leaders spirituels"
            ratio={`${(performanceMetrics?.ratios?.ouvriers_par_paroisse || 0).toFixed(1)} ouvriers/paroisse`}
          />

          <EnhancedKPICard
            title="Fidèles Engagés"
            value={statisticsData?.overview?.total_fideles || 0}
            change={statisticsData?.overview?.croissance_fideles || 0}
            icon={Heart}
            color="from-pink-500 to-rose-600"
            description={`${(statisticsData?.overview?.total_communiants || 0).toLocaleString()} communiants`}
            ratio={`${(performanceMetrics?.ratios?.taux_communion || 0).toFixed(1)}% de communion`}
          />

          <EnhancedKPICard
            title="Œuvres Déployées"
            value={statisticsData?.overview?.total_oeuvres || 0}
            change={statisticsData?.overview?.croissance_oeuvres || 0}
            icon={GraduationCap}
            color="from-purple-500 to-violet-600"
            description="Ministères spécialisés"
            ratio={`${(performanceMetrics?.ratios?.oeuvres_par_paroisse || 0).toFixed(1)} œuvres/paroisse`}
          />
        </div>

        {/* Score de performance et insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PerformanceScore />
          <div className="lg:col-span-2">
            <InsightsPanel />
          </div>
        </div>

        {/* Onglets d'analyse */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="regions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Régions
            </TabsTrigger>
            <TabsTrigger
              value="oeuvres"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white"
            >
              <School className="h-4 w-4 mr-2" />
              Œuvres
            </TabsTrigger>
            <TabsTrigger
              value="ouvriers"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Ouvriers
            </TabsTrigger>
            <TabsTrigger
              value="paroisses"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white"
            >
              <Building className="h-4 w-4 mr-2" />
              Paroisses
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Analyses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Graphique comparatif par région */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <span>Performance par Région</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={chartData.regionChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="Paroisses" fill={COLORS.success[0]} radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="Ouvriers" fill={COLORS.primary[0]} radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="Œuvres" fill={COLORS.purple[0]} radius={[4, 4, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="Taux Communion"
                        stroke={COLORS.warning[0]}
                        strokeWidth={3}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
                            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <span>Niveaux d'Œuvres</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={chartData.niveauOeuvreChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.niveauOeuvreChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Graphiques en secteurs */}
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <School className="h-5 w-5 text-green-600" />
                    <span>Types d'Œuvres</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={chartData.oeuvreChart}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage?.toFixed(1)}%`}
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.oeuvreChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-t-xl">
                <CardTitle className="text-emerald-800">Analyse Détaillée par Région</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Région</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Paroisses</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Ouvriers</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Fidèles</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Œuvres</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Taux Communion</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Efficacité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {statisticsData.paroisses.par_region.map((region, index) => {
                        const tauxCommunion = (region.communiants / Math.max(region.total_fideles, 1)) * 100
                        const efficacite = region.total_fideles / Math.max(region.count, 1)

                        return (
                          <tr
                            key={region.region_synodale}
                            className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                          >
                            <td className="px-6 py-4 font-medium text-gray-900">{region.region_synodale}</td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-emerald-100 text-emerald-800 font-semibold">{region.count}</Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-blue-100 text-blue-800 font-semibold">{region.ouvriers}</Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-pink-100 text-pink-800 font-semibold">
                                {region.total_fideles.toLocaleString()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge className="bg-purple-100 text-purple-800 font-semibold">{region.oeuvres}</Badge>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                                    style={{ width: `${Math.min(100, tauxCommunion)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold text-gray-700">{tauxCommunion.toFixed(1)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-semibold text-gray-900">{efficacite.toFixed(0)}</span>
                              <span className="text-xs text-gray-500 block">fidèles/paroisse</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oeuvres" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analyse des œuvres par type */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <School className="h-5 w-5 text-purple-600" />
                    <span>Répartition par Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statisticsData.oeuvres.par_type.map((oeuvre, index) => (
                      <div key={oeuvre.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                COLORS.oeuvres[oeuvre.type as keyof typeof COLORS.oeuvres] || COLORS.gradient[index],
                            }}
                          ></div>
                          <span className="font-medium text-gray-700 capitalize">{oeuvre.type}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-purple-100 text-purple-800 font-semibold">{oeuvre.count}</Badge>
                          <span className="text-sm text-gray-500">({oeuvre.pourcentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analyse des œuvres par niveau */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-blue-600" />
                    <span>Répartition par Niveau</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statisticsData.oeuvres.par_niveau.map((niveau, index) => (
                      <div key={niveau.niveau} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS.gradient[index] }}
                          ></div>
                          <span className="font-medium text-gray-700 capitalize">{niveau.niveau}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800 font-semibold">{niveau.count}</Badge>
                          <span className="text-sm text-gray-500">({niveau.pourcentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des œuvres par région */}
            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Map className="h-5 w-5 text-green-600" />
                  <span>Œuvres par Région</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={statisticsData.oeuvres.par_region}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="region_synodale" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={COLORS.purple[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ouvriers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analyse des ouvriers par grade */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    <span>Répartition par Grade</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statisticsData.ouvriers.par_grade.map((grade, index) => (
                      <div key={grade.grade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS.gradient[index] }}
                          ></div>
                          <span className="font-medium text-gray-700">{grade.grade}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-orange-100 text-orange-800 font-semibold">{grade.count}</Badge>
                          <span className="text-sm text-gray-500">({grade.pourcentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analyse des ouvriers par région */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span>Répartition par Région</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statisticsData.ouvriers.par_region.map((region, index) => (
                      <div
                        key={region.region_synodale}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: COLORS.gradient[index] }}
                          ></div>
                          <span className="font-medium text-gray-700">{region.region_synodale}</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 font-semibold">{region.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Graphique des ouvriers par district */}
            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>Ouvriers par District</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={statisticsData.ouvriers.par_district}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="district" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill={COLORS.primary[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paroisses" className="space-y-6">
            {/* Tableau détaillé des paroisses */}
            <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-xl border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-gray-700" />
                    <span>Classement des Paroisses</span>
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher une paroisse..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64 bg-white border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Rang</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Paroisse</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Région</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">District</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Niveau</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Communiants</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Non-Communiants</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Total Fidèles</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Ouvriers</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Œuvres</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {statisticsData.paroisses.data
                        .filter(
                          (paroisse) =>
                            paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .sort((a, b) => b.total_fideles - a.total_fideles)
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((paroisse, index) => {
                          const globalIndex = (currentPage - 1) * itemsPerPage + index
                          const score = Math.round(
                            paroisse.total_fideles * 0.4 + paroisse.ouvriers * 10 + paroisse.oeuvres_count * 5,
                          )

                          return (
                            <tr
                              key={paroisse.id}
                              className={`hover:bg-gray-50 transition-colors ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-25"
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                                    globalIndex === 0
                                      ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                      : globalIndex === 1
                                        ? "bg-gradient-to-r from-gray-300 to-gray-500"
                                        : globalIndex === 2
                                          ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                                  }`}
                                >
                                  {globalIndex + 1}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-medium text-gray-900">{paroisse.nom}</div>
                                {paroisse.quartier && <div className="text-sm text-gray-500">{paroisse.quartier}</div>}
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
                                >
                                  {paroisse.region_synodale}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="outline"
                                  className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
                                >
                                  {paroisse.district}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="outline"
                                  className="bg-gray-50 text-gray-700 border-gray-200 font-medium"
                                >
                                  {paroisse.niveau}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-emerald-600">
                                  {paroisse.communiants.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="font-semibold text-blue-600">
                                  {paroisse.non_communiants.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                                      style={{ width: `${Math.min(100, (score / 1000) * 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-semibold text-gray-700">{score}</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>

                  {statisticsData.paroisses.data.filter(
                    (paroisse) =>
                      paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                  ).length === 0 && (
                    <div className="text-center py-12">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Aucune paroisse trouvée</p>
                      <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {Math.ceil(
                  statisticsData.paroisses.data.filter(
                    (paroisse) =>
                      paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                  ).length / itemsPerPage,
                ) > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
                      <span className="font-medium">
                        {Math.min(
                          currentPage * itemsPerPage,
                          statisticsData.paroisses.data.filter(
                            (paroisse) =>
                              paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                          ).length,
                        )}
                      </span>{" "}
                      sur{" "}
                      <span className="font-medium">
                        {
                          statisticsData.paroisses.data.filter(
                            (paroisse) =>
                              paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                          ).length
                        }
                      </span>{" "}
                      résultats
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 bg-white border-gray-200"
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0 bg-white border-gray-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from(
                          {
                            length: Math.min(
                              5,
                              Math.ceil(
                                statisticsData.paroisses.data.filter(
                                  (paroisse) =>
                                    paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                                ).length / itemsPerPage,
                              ),
                            ),
                          },
                          (_, i) => {
                            const totalPages = Math.ceil(
                              statisticsData.paroisses.data.filter(
                                (paroisse) =>
                                  paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                              ).length / itemsPerPage,
                            )

                            let pageNumber
                            if (totalPages <= 5) {
                              pageNumber = i + 1
                            } else if (currentPage <= 3) {
                              pageNumber = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNumber = totalPages - 4 + i
                            } else {
                              pageNumber = currentPage - 2 + i
                            }

                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNumber)}
                                className={`h-8 w-8 p-0 text-sm ${
                                  currentPage === pageNumber
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                                    : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                {pageNumber}
                              </Button>
                            )
                          },
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                          currentPage ===
                          Math.ceil(
                            statisticsData.paroisses.data.filter(
                              (paroisse) =>
                                paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                            ).length / itemsPerPage,
                          )
                        }
                        className="h-8 w-8 p-0 bg-white border-gray-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(
                            Math.ceil(
                              statisticsData.paroisses.data.filter(
                                (paroisse) =>
                                  paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                              ).length / itemsPerPage,
                            ),
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(
                            statisticsData.paroisses.data.filter(
                              (paroisse) =>
                                paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                paroisse.region_synodale.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                paroisse.district.toLowerCase().includes(searchTerm.toLowerCase()),
                            ).length / itemsPerPage,
                          )
                        }
                        className="h-8 w-8 p-0 bg-white border-gray-200"
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Analyse de corrélation */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    <span>Corrélation Œuvres-Fidèles</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={chartData.correlationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="Œuvres" tick={{ fontSize: 12 }} />
                      <YAxis type="number" dataKey="y" name="Fidèles" tick={{ fontSize: 12 }} />
                      <ZAxis type="number" dataKey="z" range={[50, 400]} />
                      <Tooltip
                        cursor={{ strokeDasharray: "3 3" }}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any, name: string) => [
                          value,
                          name === "x" ? "Œuvres" : name === "y" ? "Fidèles" : "Ouvriers",
                        ]}
                      />
                      <Scatter name="Paroisses" dataKey="y" fill={COLORS.purple[0]} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Analyse comparative */}
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5 text-indigo-600" />
                    <span>Analyse Comparative</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                      <h4 className="font-semibold text-blue-800 mb-2">Région la plus performante</h4>
                      <p className="text-sm text-blue-700">
                        {statisticsData.paroisses.par_region.reduce((prev, current) =>
                          prev.total_fideles > current.total_fideles ? prev : current,
                        )?.region_synodale || "N/A"}{" "}
                        avec{" "}
                        {statisticsData.paroisses.par_region
                          .reduce((prev, current) => (prev.total_fideles > current.total_fideles ? prev : current))
                          ?.total_fideles?.toLocaleString() || 0}{" "}
                        fidèles
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                      <h4 className="font-semibold text-green-800 mb-2">Meilleur ratio Ouvriers/Paroisses</h4>
                      <p className="text-sm text-green-700">
                        {statisticsData.paroisses.par_region.reduce((prev, current) => {
                          const prevRatio = prev.ouvriers / Math.max(prev.count, 1)
                          const currentRatio = current.ouvriers / Math.max(current.count, 1)
                          return prevRatio > currentRatio ? prev : current
                        })?.region_synodale || "N/A"}{" "}
                        avec un ratio de{" "}
                        {(
                          statisticsData.paroisses.par_region.reduce((prev, current) => {
                            const prevRatio = prev.ouvriers / Math.max(prev.count, 1)
                            const currentRatio = current.ouvriers / Math.max(current.count, 1)
                            return prevRatio > currentRatio ? prev : current
                          }).ouvriers /
                          Math.max(
                            statisticsData.paroisses.par_region.reduce((prev, current) => {
                              const prevRatio = prev.ouvriers / Math.max(prev.count, 1)
                              const currentRatio = current.ouvriers / Math.max(current.count, 1)
                              return prevRatio > currentRatio ? prev : current
                            }).count,
                            1,
                          )
                        ).toFixed(1)}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                      <h4 className="font-semibold text-purple-800 mb-2">Taux de communion moyen</h4>
                      <p className="text-sm text-purple-700">
                        {(
                          (statisticsData.overview.total_communiants /
                            Math.max(statisticsData.overview.total_fideles, 1)) *
                          100
                        ).toFixed(1)}
                        % des fidèles sont communiants
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Radar de performance par région */}
            {statisticsData.analyses.regions_performance.length > 0 && (
              <Card className="bg-white shadow-lg rounded-xl border border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-600" />
                    <span>Performance Régionale</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={chartData.performanceRadar}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="region" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} tickCount={5} />
                      <Radar
                        name="Score Global"
                        dataKey="Score Global"
                        stroke={COLORS.success[0]}
                        fill={COLORS.success[0]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Radar
                        name="Efficacité"
                        dataKey="Efficacité"
                        stroke={COLORS.primary[0]}
                        fill={COLORS.primary[0]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
