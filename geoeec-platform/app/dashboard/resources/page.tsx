"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  Search,
  Plus,
  Users,
  Building,
  GraduationCap,
  Edit,
  Trash2,
  Eye,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react"
import ParoisseModal from "../../../components/paroisse-modal"
import OuvrierModal from "../../../components/ouvrier-modal"
import OeuvreModal from "../../../components/oeuvre-modal"

// Types basés sur vos modèles Django
interface Paroisse {
  id: number
  nom: string
  quartier?: string
  niveau: string
  region_synodale: string
  district: string
  communiants: number
  non_communiants: number
  ouvriers: number
}

interface Ouvrier {
  id: number
  nom: string
  grade: string
  contact: number
  paroisse_nom: string
  region_synodale: string
  district: string
}

interface Oeuvre {
  id: number
  nom: string
  type: "scolaire" | "universitaire" | "médicale" | "agropastorale" | "immeuble" | "terrain" | "autre"
  niveau: "paroissial" | "district" | "regional"
  paroisse?: number
  paroisse_nom?: string
  region_synodale: string
  district: string
  localisation?: {
    latitude: number
    longitude: number
  }
}

export default function ResourcesPage() {
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [ouvriers, setOuvriers] = useState<Ouvrier[]>([])
  const [oeuvres, setOeuvres] = useState<Oeuvre[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [selectedDistrict, setSelectedDistrict] = useState("all")
  const [selectedGrade, setSelectedGrade] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedNiveau, setSelectedNiveau] = useState("all")
  const [showFilters, setShowFilters] = useState(false)

  // Pagination states
  const [currentPageParoisses, setCurrentPageParoisses] = useState(1)
  const [currentPageOuvriers, setCurrentPageOuvriers] = useState(1)
  const [currentPageOeuvres, setCurrentPageOeuvres] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Modals state
  const [showParoisseModal, setShowParoisseModal] = useState(false)
  const [showOuvrierModal, setShowOuvrierModal] = useState(false)
  const [showOeuvreModal, setShowOeuvreModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Simuler le chargement des données depuis votre API Django
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Remplacez par vos vraies URLs d'API
        const [paroissesRes, ouvriersRes, oeuvresRes] = await Promise.all([
          fetch("http://localhost:8000/api/paroisses/"),
          fetch("http://localhost:8000/api/ouvriers"),
          fetch("http://localhost:8000/api/oeuvres/"),
        ])

        const [paroissesData, ouvriersData, oeuvresData] = await Promise.all([
          paroissesRes.json(),
          ouvriersRes.json(),
          oeuvresRes.json(),
        ])

        setParoisses(paroissesData)
        setOuvriers(ouvriersData)
        setOeuvres(oeuvresData)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Obtenir les valeurs uniques pour les filtres
  const uniqueRegions = useMemo(() => {
    const regions = new Set([...paroisses.map((p) => p.region_synodale), ...ouvriers.map((o) => o.region_synodale)])
    return Array.from(regions).sort()
  }, [paroisses, ouvriers])

  const uniqueDistricts = useMemo(() => {
    const districts = new Set([...paroisses.map((p) => p.district), ...ouvriers.map((o) => o.district)])
    return Array.from(districts).sort()
  }, [paroisses, ouvriers])

  const uniqueGrades = useMemo(() => {
    const grades = new Set(ouvriers.map((o) => o.grade))
    return Array.from(grades).sort()
  }, [ouvriers])

  // Filtrage des données
  const filteredParoisses = useMemo(() => {
    return paroisses.filter((paroisse) => {
      const matchesSearch =
        paroisse.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paroisse.quartier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paroisse.district.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRegion = selectedRegion === "all" || paroisse.region_synodale === selectedRegion
      const matchesDistrict = selectedDistrict === "all" || paroisse.district === selectedDistrict

      return matchesSearch && matchesRegion && matchesDistrict
    })
  }, [paroisses, searchTerm, selectedRegion, selectedDistrict])

  const filteredOuvriers = useMemo(() => {
    return ouvriers.filter((ouvrier) => {
      const matchesSearch =
        ouvrier.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ouvrier.paroisse_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ouvrier.grade.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRegion = selectedRegion === "all" || ouvrier.region_synodale === selectedRegion
      const matchesDistrict = selectedDistrict === "all" || ouvrier.district === selectedDistrict
      const matchesGrade = selectedGrade === "all" || ouvrier.grade === selectedGrade

      return matchesSearch && matchesRegion && matchesDistrict && matchesGrade
    })
  }, [ouvriers, searchTerm, selectedRegion, selectedDistrict, selectedGrade])

  const filteredOeuvres = useMemo(() => {
    return oeuvres.filter((oeuvre) => {
      const matchesSearch =
        oeuvre.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oeuvre.paroisse_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        oeuvre.type.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = selectedType === "all" || oeuvre.type === selectedType
      const matchesNiveau = selectedNiveau === "all" || oeuvre.niveau === selectedNiveau

      return matchesSearch && matchesType && matchesNiveau
    })
  }, [oeuvres, searchTerm, selectedType, selectedNiveau])

  // Pagination logic
  const getPaginatedData = (data: any[], currentPage: number) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return {
      data: data.slice(startIndex, endIndex),
      totalPages: Math.ceil(data.length / itemsPerPage),
      startIndex: startIndex + 1,
      endIndex: Math.min(endIndex, data.length),
      total: data.length,
    }
  }

  const paginatedParoisses = getPaginatedData(filteredParoisses, currentPageParoisses)
  const paginatedOuvriers = getPaginatedData(filteredOuvriers, currentPageOuvriers)
  const paginatedOeuvres = getPaginatedData(filteredOeuvres, currentPageOeuvres)

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedRegion("all")
    setSelectedDistrict("all")
    setSelectedGrade("all")
    setSelectedType("all")
    setSelectedNiveau("all")
    setCurrentPageParoisses(1)
    setCurrentPageOuvriers(1)
    setCurrentPageOeuvres(1)
  }

  const refreshData = async () => {
    setLoading(true)
    // Simuler un refresh
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const getTypeColor = (type: string) => {
    const colors = {
      scolaire: "bg-blue-50 text-blue-700 border-blue-200",
      universitaire: "bg-purple-50 text-purple-700 border-purple-200",
      médicale: "bg-red-50 text-red-700 border-red-200",
      agropastorale: "bg-green-50 text-green-700 border-green-200",
      immeuble: "bg-gray-50 text-gray-700 border-gray-200",
      terrain: "bg-yellow-50 text-yellow-700 border-yellow-200",
      autre: "bg-orange-50 text-orange-700 border-orange-200",
    }
    return colors[type as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200"
  }

  const getNiveauColor = (niveau: string) => {
    const colors = {
      paroissial: "bg-emerald-50 text-emerald-700 border-emerald-200",
      district: "bg-blue-50 text-blue-700 border-blue-200",
      regional: "bg-purple-50 text-purple-700 border-purple-200",
    }
    return colors[niveau as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200"
  }

  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    startIndex,
    endIndex,
    total,
  }: {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    startIndex: number
    endIndex: number
    total: number
  }) => (
    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
      <div className="text-sm text-gray-600">
        Affichage de <span className="font-medium">{startIndex}</span> à <span className="font-medium">{endIndex}</span>{" "}
        sur <span className="font-medium">{total}</span> résultats
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                onClick={() => onPageChange(pageNumber)}
                className={`h-8 w-8 p-0 text-sm ${
                  currentPage === pageNumber ? "bg-blue-600 text-white hover:bg-blue-700" : ""
                }`}
              >
                {pageNumber}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 text-lg">Chargement des ressources...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Ressources</h1>
            <p className="text-gray-600 mt-2">Gérez les paroisses, ouvriers et œuvres de l'EEC</p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={refreshData} variant="outline" className="bg-white hover:bg-gray-50">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" className="bg-white hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="bg-white hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans toutes les ressources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-4 border-t animate-fade-in">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Région</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Toutes les régions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        {uniqueRegions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">District</Label>
                    <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Tous les districts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les districts</SelectItem>
                        {uniqueDistricts.map((district) => (
                          <SelectItem key={district} value={district}>
                            {district}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Grade</Label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Tous les grades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les grades</SelectItem>
                        {uniqueGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Type d'œuvre</Label>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="scolaire">Scolaire</SelectItem>
                        <SelectItem value="universitaire">Universitaire</SelectItem>
                        <SelectItem value="médicale">Médicale</SelectItem>
                        <SelectItem value="agropastorale">Agropastorale</SelectItem>
                        <SelectItem value="immeuble">Immeuble</SelectItem>
                        <SelectItem value="terrain">Terrain</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Niveau</Label>
                    <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Tous les niveaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les niveaux</SelectItem>
                        <SelectItem value="paroissial">Paroissial</SelectItem>
                        <SelectItem value="district">District</SelectItem>
                        <SelectItem value="regional">Régional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(searchTerm ||
                selectedRegion !== "all" ||
                selectedDistrict !== "all" ||
                selectedGrade !== "all" ||
                selectedType !== "all" ||
                selectedNiveau !== "all") && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Filtres actifs:{" "}
                    <span className="font-medium">
                      {
                        [
                          searchTerm,
                          selectedRegion !== "all",
                          selectedDistrict !== "all",
                          selectedGrade !== "all",
                          selectedType !== "all",
                          selectedNiveau !== "all",
                        ].filter(Boolean).length
                      }{" "}
                      filtre(s)
                    </span>
                  </div>
                  <Button onClick={clearFilters} variant="outline" size="sm" className="text-sm bg-transparent">
                    <X className="h-4 w-4 mr-1" />
                    Effacer les filtres
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Paroisses</p>
                  <p className="text-3xl font-bold text-emerald-900">{filteredParoisses.length}</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {filteredParoisses.length !== paroisses.length && `sur ${paroisses.length} au total`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Ouvriers</p>
                  <p className="text-3xl font-bold text-blue-900">{filteredOuvriers.length}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {filteredOuvriers.length !== ouvriers.length && `sur ${ouvriers.length} au total`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Œuvres</p>
                  <p className="text-3xl font-bold text-purple-900">{filteredOeuvres.length}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {filteredOeuvres.length !== oeuvres.length && `sur ${oeuvres.length} au total`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different resources */}
        <Tabs defaultValue="paroisses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-sm">
            <TabsTrigger
              value="paroisses"
              className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700"
            >
              Paroisses ({filteredParoisses.length})
            </TabsTrigger>
            <TabsTrigger value="ouvriers" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              Ouvriers ({filteredOuvriers.length})
            </TabsTrigger>
            <TabsTrigger
              value="oeuvres"
              className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              Œuvres ({filteredOeuvres.length})
            </TabsTrigger>
          </TabsList>

          {/* Paroisses Tab */}
          <TabsContent value="paroisses">
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Liste des Paroisses</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null)
                      setShowParoisseModal(true)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Paroisse
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Nom</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Quartier</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Région</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">District</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Ouvriers</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Fidèles</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedParoisses.data.map((paroisse, index) => (
                        <tr
                          key={paroisse.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-25"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{paroisse.nom}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{paroisse.quartier || "-"}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              {paroisse.region_synodale}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {paroisse.district}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{paroisse.ouvriers}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-emerald-600">{paroisse.communiants}</span>
                              <span className="text-gray-400">+{paroisse.non_communiants}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-transparent"
                                onClick={() => {
                                  setEditingItem(paroisse)
                                  setShowParoisseModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paginatedParoisses.data.length === 0 && (
                    <div className="text-center py-12">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Aucune paroisse trouvée</p>
                      <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                    </div>
                  )}
                </div>
                {paginatedParoisses.totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPageParoisses}
                    totalPages={paginatedParoisses.totalPages}
                    onPageChange={setCurrentPageParoisses}
                    startIndex={paginatedParoisses.startIndex}
                    endIndex={paginatedParoisses.endIndex}
                    total={paginatedParoisses.total}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ouvriers Tab */}
          <TabsContent value="ouvriers">
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Liste des Ouvriers</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null)
                      setShowOuvrierModal(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvel Ouvrier
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Nom</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Grade</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Contact</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Paroisse</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">District</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Région</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedOuvriers.data.map((ouvrier, index) => (
                        <tr
                          key={ouvrier.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-25"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{ouvrier.nom}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200">{ouvrier.grade}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ouvrier.contact || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ouvrier.paroisse_nom}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ouvrier.district}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{ouvrier.region_synodale}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-transparent"
                                onClick={() => {
                                  setEditingItem(ouvrier)
                                  setShowOuvrierModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paginatedOuvriers.data.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Aucun ouvrier trouvé</p>
                      <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                    </div>
                  )}
                </div>
                {paginatedOuvriers.totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPageOuvriers}
                    totalPages={paginatedOuvriers.totalPages}
                    onPageChange={setCurrentPageOuvriers}
                    startIndex={paginatedOuvriers.startIndex}
                    endIndex={paginatedOuvriers.endIndex}
                    total={paginatedOuvriers.total}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Œuvres Tab */}
          <TabsContent value="oeuvres">
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Liste des Œuvres</CardTitle>
                  <Button
                    onClick={() => {
                      setEditingItem(null)
                      setShowOeuvreModal(true)
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Œuvre
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Nom</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Type</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Niveau</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Paroisse</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">District</th>
                        <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Region synodale</th>
                        <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedOeuvres.data.map((oeuvre, index) => (
                        <tr
                          key={oeuvre.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-25"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{oeuvre.nom}</div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getTypeColor(oeuvre.type)}>{oeuvre.type}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getNiveauColor(oeuvre.niveau)}>{oeuvre.niveau}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{oeuvre.paroisse_nom || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{oeuvre.region_synodale || "-"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{oeuvre.district || "-"}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-transparent"
                                onClick={() => {
                                  setEditingItem(oeuvre)
                                  setShowOeuvreModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paginatedOeuvres.data.length === 0 && (
                    <div className="text-center py-12">
                      <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">Aucune œuvre trouvée</p>
                      <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                    </div>
                  )}
                </div>
                {paginatedOeuvres.totalPages > 1 && (
                  <PaginationControls
                    currentPage={currentPageOeuvres}
                    totalPages={paginatedOeuvres.totalPages}
                    onPageChange={setCurrentPageOeuvres}
                    startIndex={paginatedOeuvres.startIndex}
                    endIndex={paginatedOeuvres.endIndex}
                    total={paginatedOeuvres.total}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ParoisseModal
        isOpen={showParoisseModal}
        onClose={() => setShowParoisseModal(false)}
        paroisse={editingItem}
        onSave={(paroisse) => {
          // Logique de sauvegarde
          setShowParoisseModal(false)
          setEditingItem(null)
        }}
      />

      <OuvrierModal
        isOpen={showOuvrierModal}
        onClose={() => setShowOuvrierModal(false)}
        ouvrier={editingItem}
        paroisses={paroisses}
        onSave={(ouvrier) => {
          setShowOuvrierModal(false)
          setEditingItem(null)
        }}
      />

      <OeuvreModal
        isOpen={showOeuvreModal}
        onClose={() => setShowOeuvreModal(false)}
        oeuvre={editingItem}
        paroisses={paroisses}
        onSave={(oeuvre) => {
          setShowOeuvreModal(false)
          setEditingItem(null)
        }}
      />
    </div>
  )
}
