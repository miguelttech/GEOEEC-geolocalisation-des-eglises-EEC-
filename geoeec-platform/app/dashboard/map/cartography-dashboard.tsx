"use client"

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  Building,
  GraduationCap,
  Users,
  Filter,
  Layers,
  Maximize2,
  Eye,
  EyeOff,
  RotateCcw,
  Network,
  Zap,
  Activity,
  MapPin,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Database,
  Minimize2,
} from "lucide-react"
import { cartographieApi } from "@/lib/api"
import { useApi } from "@/hooks/useApi"
import ApiStatusBanner from "@/components/api-status-banner"

// Import dynamique de la carte optimisée
const InteractiveCartographyMap = dynamic(() => import("../../../components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div
            className="absolute inset-0 w-16 h-16 border-4 border-blue-500/30 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          ></div>
        </div>
        <p className="text-gray-700 font-semibold">Connexion au backend Django...</p>
        <p className="text-sm text-gray-500 mt-1">Chargement des données géographiques ⚡</p>
        <div className="flex justify-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
        </div>
      </div>
    </div>
  ),
})

interface MapFilters {
  search: string
  regions: string[]
  districts: string[]
  types: string[]
  niveaux: string[]
  showParoisses: boolean
  showOeuvres: boolean
  showOuvriers: boolean
}

export default function MapPage() {
  const [filters, setFilters] = useState<MapFilters>({
    search: "",
    regions: [],
    districts: [],
    types: [],
    niveaux: [],
    showParoisses: true,
    showOeuvres: true,
    showOuvriers: true,
  })

  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(false)
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(true)
  const [activeTab, setActiveTab] = useState("layers")

  // Chargement des statistiques depuis le backend Django
  const {
    data: statisticsData,
    loading: statisticsLoading,
    error: statisticsError,
    refetch: refetchStatistics,
  } = useApi(
    () =>
      cartographieApi.getStatistics({
        region: filters.regions[0],
        district: filters.districts[0],
        type: filters.types[0],
      }),
    [filters.regions, filters.districts, filters.types],
  )

  // Chargement des couches géographiques depuis le backend Django
  const {
    data: layersData,
    loading: layersLoading,
    error: layersError,
    refetch: refetchLayers,
  } = useApi(
    () =>
      cartographieApi.getLayers({
        region: filters.regions[0],
        district: filters.districts[0],
        type: filters.types[0],
      }),
    [filters.regions, filters.districts, filters.types],
  )

  // Chargement des listes de filtres depuis le backend Django
  const { data: regionsData, loading: regionsLoading } = useApi(() => cartographieApi.getRegions())
  const { data: districtsData, loading: districtsLoading } = useApi(() => cartographieApi.getDistricts())
  const { data: typesData, loading: typesLoading } = useApi(() => cartographieApi.getOeuvreTypes())

  // Conversion des données GeoJSON en format compatible avec la carte
  const optimizedData = useMemo(() => {
    if (!layersData) {
      return {
        paroisses: [],
        oeuvres: [],
        ouvriers: [],
        relationIndex: new Map(),
        allLayers: [],
      }
    }

    // Conversion des features GeoJSON en objets compatibles
    const paroisses = layersData.paroisses.features.map((feature) => ({
      ...feature.properties,
      type: "paroisse",
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      localisation: {
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      },
    }))

    const oeuvres = layersData.oeuvres.features.map((feature) => ({
      ...feature.properties,
      type: "oeuvre",
      latitude: feature.geometry.coordinates[0],
      longitude: feature.geometry.coordinates[1],
      localisation: {
        latitude: feature.geometry.coordinates[0],
        longitude: feature.geometry.coordinates[1],
      },
    }))

    const ouvriers = layersData.ouvriers.features.map((feature) => ({
      ...feature.properties,
      type: "ouvrier",
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      localisation: {
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
      },
    }))

    // Créer un index des relations
    const relationIndex = new Map()
    paroisses.forEach((paroisse: any) => {
      const paroissesOeuvres = oeuvres.filter(
        (oeuvre: any) => oeuvre.paroisse_id === paroisse.id || oeuvre.paroisse_nom === paroisse.nom,
      )
      const paroissesOuvriers = ouvriers.filter(
        (ouvrier: any) => ouvrier.paroisse_id === paroisse.id || ouvrier.paroisse_nom === paroisse.nom,
      )

      relationIndex.set(paroisse.id, {
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
      allLayers: [...paroisses, ...oeuvres, ...ouvriers],
    }
  }, [layersData])

  // Filtrage des données
  const filteredData = useMemo(() => {
    let data = optimizedData.allLayers

    // Filtre par recherche
    if (filters.search) {
      data = data.filter(
        (item) =>
          item.nom?.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.region_synodale?.toLowerCase().includes(filters.search.toLowerCase()) ||
          item.district?.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    // Filtre par visibilité des couches
    data = data.filter((item) => {
      if (item.type === "paroisse" && !filters.showParoisses) return false
      if (item.type === "oeuvre" && !filters.showOeuvres) return false
      if (item.type === "ouvrier" && !filters.showOuvriers) return false
      return true
    })

    return data
  }, [optimizedData.allLayers, filters])

  const handleFilterChange = (key: keyof MapFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const toggleArrayFilter = (key: "regions" | "districts" | "types" | "niveaux", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((item) => item !== value) : [...prev[key], value],
    }))
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      regions: [],
      districts: [],
      types: [],
      niveaux: [],
      showParoisses: true,
      showOeuvres: true,
      showOuvriers: true,
    })
  }

  const refreshAll = async () => {
    await Promise.all([refetchStatistics(), refetchLayers()])
  }

  // Affichage du loading
  if (statisticsLoading && layersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div
                  className="absolute inset-0 w-20 h-20 border-4 border-blue-500/30 border-t-transparent rounded-full animate-spin mx-auto"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                ></div>
              </div>
              <p className="text-gray-700 font-semibold text-lg">Connexion au backend Django...</p>
              <p className="text-gray-500 mt-2">Chargement des données géographiques depuis votre BD ⚡</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Affichage des erreurs
  if (statisticsError || layersError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-6">
        <div className="max-w-full mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white p-8 rounded-lg shadow-lg">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de connexion au backend</h2>
              <p className="text-gray-600 mb-6">
                Impossible de se connecter à votre backend Django. Vérifiez que le serveur est démarré sur{" "}
                <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:8000</code>
              </p>
              <div className="space-y-2 text-sm text-left bg-gray-50 p-4 rounded mb-6">
                <p className="font-medium">Erreurs détectées :</p>
                {statisticsError && <p className="text-red-600">• Statistiques : {statisticsError}</p>}
                {layersError && <p className="text-red-600">• Couches géographiques : {layersError}</p>}
              </div>
              <div className="space-x-3">
                <Button onClick={refreshAll} className="bg-emerald-600 hover:bg-emerald-700">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réessayer la connexion
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Actualiser la page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white" : "min-h-screen bg-gray-50"}`}>
      {/* Header compact et professionnel */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Zap className="h-8 w-8 text-emerald-500" />
                <div className="absolute inset-0 h-8 w-8 text-emerald-300 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Cartographie GEOEEC</h1>
                <p className="text-sm text-gray-600">Backend Django - Données temps réel</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Contrôles des panneaux */}
            <Button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              {showLeftPanel ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="hidden sm:inline">Contrôles</span>
            </Button>

            <Button
              onClick={() => setShowRightPanel(!showRightPanel)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Détails</span>
              {showRightPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button
              onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
              variant={showPerformanceMonitor ? "default" : "outline"}
              size="sm"
              className="flex items-center space-x-1"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Perf</span>
            </Button>

            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden sm:inline">{isFullscreen ? "Quitter" : "Plein écran"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques compactes en haut */}
      {!isFullscreen && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Paroisses</p>
                <p className="text-xl font-bold text-blue-700">{statisticsData?.total_paroisses || 0}</p>
                <p className="text-xs text-blue-600">
                  {statisticsData?.taux_geolocalisation_paroisses || 0}% géolocalisées
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <GraduationCap className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Œuvres</p>
                <p className="text-xl font-bold text-green-700">{statisticsData?.total_oeuvres_actives || 0}</p>
                <p className="text-xs text-green-600">
                  {statisticsData?.taux_geolocalisation_oeuvres || 0}% géolocalisées
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg">
              <Users className="h-8 w-8 text-cyan-600" />
              <div>
                <p className="text-sm font-medium text-cyan-900">Ouvriers</p>
                <p className="text-xl font-bold text-cyan-700">{statisticsData?.total_ouvriers_actifs || 0}</p>
                <p className="text-xs text-cyan-600">Actifs</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">Fidèles</p>
                <p className="text-xl font-bold text-purple-700">
                  {statisticsData?.total_fideles?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-purple-600">{statisticsData?.pourcentage_communiants || 0}% communiants</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interface principale avec panneaux latéraux */}
      <div className="flex h-[calc(100vh-140px)]">

        {/* Panneau droit - Détails */}
        {showRightPanel && selectedItem && (
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Détails</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowRightPanel(false)} className="p-1 h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Informations de base */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {selectedItem.type === "paroisse" && <Building className="h-4 w-4 text-blue-600" />}
                      {selectedItem.type === "oeuvre" && <GraduationCap className="h-4 w-4 text-green-600" />}
                      {selectedItem.type === "ouvrier" && <Users className="h-4 w-4 text-cyan-600" />}
                      <span className="truncate">{selectedItem.nom}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Type:</span>
                        <p className="capitalize">{selectedItem.type}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Région:</span>
                        <p>{selectedItem.region_synodale || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">District:</span>
                        <p>{selectedItem.district || "N/A"}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Statut:</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedItem.statut || "Actif"}
                        </Badge>
                      </div>
                    </div>

                    {/* Coordonnées */}
                    <div className="text-sm border-t pt-3">
                      <span className="font-medium text-gray-600">Coordonnées:</span>
                      <p className="font-mono text-xs text-gray-500">
                        {selectedItem.latitude?.toFixed(6)}, {selectedItem.longitude?.toFixed(6)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Relations pour les paroisses */}
                {selectedItem.type === "paroisse" && optimizedData.relationIndex.has(selectedItem.id) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Network className="h-4 w-4 text-purple-600" />
                        Relations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const relation = optimizedData.relationIndex.get(selectedItem.id)
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-700">{relation.oeuvres.length}</div>
                                <div className="text-sm text-green-600">Œuvres</div>
                              </div>
                              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                                <div className="text-lg font-bold text-cyan-700">{relation.ouvriers.length}</div>
                                <div className="text-sm text-cyan-600">Ouvriers</div>
                              </div>
                            </div>

                            {/* Liste des œuvres */}
                            {relation.oeuvres.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Œuvres liées</h4>
                                <ScrollArea className="h-32">
                                  <div className="space-y-2">
                                    {relation.oeuvres.map((oeuvre: any) => (
                                      <div key={oeuvre.id} className="p-2 bg-green-50 rounded text-sm">
                                        <div className="font-medium text-green-800">{oeuvre.nom}</div>
                                        <div className="text-green-600 text-xs">
                                          {oeuvre.type_oeuvre || oeuvre.type}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}

                            {/* Liste des ouvriers */}
                            {relation.ouvriers.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Ouvriers affectés</h4>
                                <ScrollArea className="h-32">
                                  <div className="space-y-2">
                                    {relation.ouvriers.map((ouvrier: any) => (
                                      <div key={ouvrier.id} className="p-2 bg-cyan-50 rounded text-sm">
                                        <div className="font-medium text-cyan-800">{ouvrier.nom}</div>
                                        <div className="text-cyan-600 text-xs">{ouvrier.grade || "Ouvrier"}</div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Statistiques pour paroisse */}
                {selectedItem.type === "paroisse" && (selectedItem.communiants || selectedItem.non_communiants) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        Statistiques
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedItem.communiants && (
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="text-lg font-bold text-blue-700">
                              {selectedItem.communiants.toLocaleString()}
                            </div>
                            <div className="text-sm text-blue-600">Communiants</div>
                          </div>
                        )}
                        {selectedItem.non_communiants && (
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-gray-700">
                              {selectedItem.non_communiants.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Non-communiants</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

                {/* Zone centrale - Carte */}
        <div className="flex-1 relative">
          <div className="h-full bg-white">
            <InteractiveCartographyMap
              statistics={statisticsData || {}}
              layers={filteredData}
              onRefresh={refreshAll}
              loading={statisticsLoading || layersLoading}
              selectedMapItem={selectedItem}
            />

            {/* Indicateur de performance en bas à droite */}
            {showPerformanceMonitor && (
              <div className="absolute bottom-4 right-4 z-[1001]">
                <Card className="bg-black/90 backdrop-blur-sm text-white border-gray-700 shadow-lg">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <Zap className="h-3 w-3 text-green-400" />
                        <span className="text-green-400 font-medium">Django</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                        <Database className="h-3 w-3 text-blue-400" />
                        <span className="text-blue-400 font-medium">GeoJSON</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <Network className="h-3 w-3 text-purple-400" />
                        <span className="text-purple-400 font-medium">{filteredData.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Panneau gauche - Contrôles */}
        {showLeftPanel && (
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="layers" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    Couches
                  </TabsTrigger>
                  <TabsTrigger value="filters" className="text-xs">
                    <Filter className="h-3 w-3 mr-1" />
                    Filtres
                  </TabsTrigger>
                  <TabsTrigger value="search" className="text-xs">
                    <Search className="h-3 w-3 mr-1" />
                    Recherche
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1 p-4">
              <Tabs value={activeTab} className="w-full">
                {/* Onglet Couches */}
                <TabsContent value="layers" className="space-y-4 mt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Paroisses</span>
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                          {optimizedData.paroisses.length}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFilterChange("showParoisses", !filters.showParoisses)}
                        className="p-1 h-8 w-8"
                      >
                        {filters.showParoisses ? (
                          <Eye className="h-4 w-4 text-blue-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Œuvres</span>
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                          {optimizedData.oeuvres.length}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFilterChange("showOeuvres", !filters.showOeuvres)}
                        className="p-1 h-8 w-8"
                      >
                        {filters.showOeuvres ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-cyan-600" />
                        <span className="text-sm font-medium">Ouvriers</span>
                        <Badge variant="outline" className="text-xs bg-cyan-100 text-cyan-700">
                          {optimizedData.ouvriers.length}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFilterChange("showOuvriers", !filters.showOuvriers)}
                        className="p-1 h-8 w-8"
                      >
                        {filters.showOuvriers ? (
                          <Eye className="h-4 w-4 text-cyan-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Éléments affichés</h4>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{filteredData.length}</div>
                      <div className="text-sm text-gray-600">sur {optimizedData.allLayers.length} total</div>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Filtres */}
                <TabsContent value="filters" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Filtres actifs</h4>
                    <Button size="sm" variant="ghost" onClick={resetFilters} className="text-xs h-7">
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <Tabs defaultValue="regions" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 text-xs">
                      <TabsTrigger value="regions">Régions</TabsTrigger>
                      <TabsTrigger value="districts">Districts</TabsTrigger>
                      <TabsTrigger value="types">Types</TabsTrigger>
                    </TabsList>

                    <TabsContent value="regions" className="space-y-2 mt-4">
                      <ScrollArea className="h-48">
                        {regionsLoading ? (
                          <p className="text-sm text-gray-500 p-2">Chargement des régions...</p>
                        ) : (
                          <div className="space-y-2">
                            {regionsData?.map((region) => (
                              <div key={region} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  id={`region-${region}`}
                                  checked={filters.regions.includes(region)}
                                  onChange={() => toggleArrayFilter("regions", region)}
                                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <label
                                  htmlFor={`region-${region}`}
                                  className="text-sm text-gray-700 cursor-pointer flex-1"
                                >
                                  {region}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {!regionsLoading && (!regionsData || regionsData.length === 0) && (
                          <p className="text-sm text-gray-500 italic p-2">Aucune région trouvée</p>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="districts" className="space-y-2 mt-4">
                      <ScrollArea className="h-48">
                        {districtsLoading ? (
                          <p className="text-sm text-gray-500 p-2">Chargement des districts...</p>
                        ) : (
                          <div className="space-y-2">
                            {districtsData?.map((district) => (
                              <div key={district} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  id={`district-${district}`}
                                  checked={filters.districts.includes(district)}
                                  onChange={() => toggleArrayFilter("districts", district)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor={`district-${district}`}
                                  className="text-sm text-gray-700 cursor-pointer flex-1"
                                >
                                  {district}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {!districtsLoading && (!districtsData || districtsData.length === 0) && (
                          <p className="text-sm text-gray-500 italic p-2">Aucun district trouvé</p>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="types" className="space-y-2 mt-4">
                      <ScrollArea className="h-48">
                        {typesLoading ? (
                          <p className="text-sm text-gray-500 p-2">Chargement des types...</p>
                        ) : (
                          <div className="space-y-2">
                            {typesData?.map((type) => (
                              <div key={type} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                                <input
                                  type="checkbox"
                                  id={`type-${type}`}
                                  checked={filters.types.includes(type)}
                                  onChange={() => toggleArrayFilter("types", type)}
                                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                />
                                <label
                                  htmlFor={`type-${type}`}
                                  className="text-sm text-gray-700 cursor-pointer flex-1 capitalize"
                                >
                                  {type}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                        {!typesLoading && (!typesData || typesData.length === 0) && (
                          <p className="text-sm text-gray-500 italic p-2">Aucun type trouvé</p>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                {/* Onglet Recherche */}
                <TabsContent value="search" className="space-y-4 mt-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher dans votre BD..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-10 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>

                  {filters.search && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">Résultats</span>
                        <Badge variant="outline">{filteredData.length}</Badge>
                      </div>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {filteredData.slice(0, 20).map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => setSelectedItem(item)}
                            >
                              <div className="flex items-center space-x-2">
                                {item.type === "paroisse" && <Building className="h-4 w-4 text-blue-600" />}
                                {item.type === "oeuvre" && <GraduationCap className="h-4 w-4 text-green-600" />}
                                {item.type === "ouvrier" && <Users className="h-4 w-4 text-cyan-600" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.nom}</p>
                                  <p className="text-xs text-gray-500 capitalize">{item.type}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>

            <div className="p-4 border-t border-gray-200">
              <Button onClick={refreshAll} className="w-full" disabled={statisticsLoading || layersLoading}>
                <RotateCcw className={`h-4 w-4 mr-2 ${statisticsLoading || layersLoading ? "animate-spin" : ""}`} />
                Actualiser les données
              </Button>
            </div>
          </div>
        )}




      </div>
    </div>
  )
}
