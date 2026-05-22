"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Layers, Settings, Download, RefreshCw, MapPin, Palette } from "lucide-react"

interface MapControlsProps {
  filters: {
    regions: string[]
    districts: string[]
    niveaux: string[]
    types_oeuvres: Array<{ value: string; label: string }>
    grades: string[]
  }
  onFiltersChange: (filters: Record<string, string>) => void
  onLayerToggle: (layer: string, visible: boolean) => void
  onStyleChange: (style: string) => void
  onExport: (format: string, layer: string) => void
  onRefresh: () => void
  loading?: boolean
}

export default function MapControls({
  filters,
  onFiltersChange,
  onLayerToggle,
  onStyleChange,
  onExport,
  onRefresh,
  loading = false,
}: MapControlsProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({
    region: "all",
    district: "all",
    niveau: "all",
    type_oeuvre: "all",
    grade: "all",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [visibleLayers, setVisibleLayers] = useState({
    paroisses: true,
    oeuvres: true,
    zones_influence: false,
    itineraires: false,
    heatmap: false,
  })
  const [mapStyle, setMapStyle] = useState("streets")
  const [opacity, setOpacity] = useState([80])
  const [clusterRadius, setClusterRadius] = useState([50])

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...activeFilters, [key]: value }
    setActiveFilters(newFilters)
    onFiltersChange({ ...newFilters, search: searchTerm })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onFiltersChange({ ...activeFilters, search: value })
  }

  const handleLayerToggle = (layer: string, visible: boolean) => {
    const newLayers = { ...visibleLayers, [layer]: visible }
    setVisibleLayers(newLayers)
    onLayerToggle(layer, visible)
  }

  const handleStyleChange = (style: string) => {
    setMapStyle(style)
    onStyleChange(style)
  }

  const clearFilters = () => {
    const clearedFilters = {
      region: "all",
      district: "all",
      niveau: "all",
      type_oeuvre: "all",
      grade: "all",
    }
    setActiveFilters(clearedFilters)
    setSearchTerm("")
    onFiltersChange({ ...clearedFilters, search: "" })
  }

  const getActiveFiltersCount = () => {
    return Object.values(activeFilters).filter((value) => value !== "all").length + (searchTerm ? 1 : 0)
  }

  return (
    <Card className="w-80 h-full bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-blue-600" />
            <span>Contrôles</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="filters" className="text-xs">
              <Filter className="h-3 w-3 mr-1" />
              Filtres
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="layers" className="text-xs">
              <Layers className="h-3 w-3 mr-1" />
              Couches
            </TabsTrigger>
            <TabsTrigger value="style" className="text-xs">
              <Palette className="h-3 w-3 mr-1" />
              Style
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters" className="space-y-4 mt-4">
            {/* Recherche */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtres géographiques */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">Région</Label>
                <Select value={activeFilters.region} onValueChange={(value) => handleFilterChange("region", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les régions</SelectItem>
                    {filters.regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">District</Label>
                <Select value={activeFilters.district} onValueChange={(value) => handleFilterChange("district", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les districts</SelectItem>
                    {filters.districts.map((district) => (
                      <SelectItem key={district} value={district}>
                        {district}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Niveau</Label>
                <Select value={activeFilters.niveau} onValueChange={(value) => handleFilterChange("niveau", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les niveaux</SelectItem>
                    {filters.niveaux.map((niveau) => (
                      <SelectItem key={niveau} value={niveau}>
                        {niveau}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Type d'œuvre</Label>
                <Select
                  value={activeFilters.type_oeuvre}
                  onValueChange={(value) => handleFilterChange("type_oeuvre", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    {filters.types_oeuvres.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions des filtres */}
            <div className="flex space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={clearFilters} className="flex-1 bg-transparent">
                Effacer
              </Button>
              <Button size="sm" onClick={() => onFiltersChange(activeFilters)} className="flex-1">
                Appliquer
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="layers" className="space-y-4 mt-4">
            {/* Couches principales */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium">Paroisses</Label>
                </div>
                <Switch
                  checked={visibleLayers.paroisses}
                  onCheckedChange={(checked) => handleLayerToggle("paroisses", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <Label className="text-sm font-medium">Œuvres</Label>
                </div>
                <Switch
                  checked={visibleLayers.oeuvres}
                  onCheckedChange={(checked) => handleLayerToggle("oeuvres", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 rounded-full bg-green-500/30 border-2 border-green-500" />
                  <Label className="text-sm font-medium">Zones d'influence</Label>
                </div>
                <Switch
                  checked={visibleLayers.zones_influence}
                  onCheckedChange={(checked) => handleLayerToggle("zones_influence", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-orange-500 rounded-sm" />
                  <Label className="text-sm font-medium">Itinéraires</Label>
                </div>
                <Switch
                  checked={visibleLayers.itineraires}
                  onCheckedChange={(checked) => handleLayerToggle("itineraires", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 bg-gradient-to-r from-red-500 to-yellow-500 rounded-sm" />
                  <Label className="text-sm font-medium">Heatmap</Label>
                </div>
                <Switch
                  checked={visibleLayers.heatmap}
                  onCheckedChange={(checked) => handleLayerToggle("heatmap", checked)}
                />
              </div>
            </div>

            {/* Paramètres des couches */}
            <div className="space-y-3 pt-3 border-t">
              <div>
                <Label className="text-sm font-medium mb-2 block">Opacité: {opacity[0]}%</Label>
                <Slider value={opacity} onValueChange={setOpacity} max={100} min={10} step={10} className="w-full" />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Rayon de cluster: {clusterRadius[0]}px</Label>
                <Slider
                  value={clusterRadius}
                  onValueChange={setClusterRadius}
                  max={100}
                  min={20}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 mt-4">
            {/* Styles de carte */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Style de carte</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={mapStyle === "streets" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleChange("streets")}
                  className="h-16 flex flex-col"
                >
                  <div className="w-8 h-6 bg-gray-200 rounded mb-1"></div>
                  <span className="text-xs">Rues</span>
                </Button>

                <Button
                  variant={mapStyle === "satellite" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleChange("satellite")}
                  className="h-16 flex flex-col"
                >
                  <div className="w-8 h-6 bg-green-400 rounded mb-1"></div>
                  <span className="text-xs">Satellite</span>
                </Button>

                <Button
                  variant={mapStyle === "terrain" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleChange("terrain")}
                  className="h-16 flex flex-col"
                >
                  <div className="w-8 h-6 bg-amber-200 rounded mb-1"></div>
                  <span className="text-xs">Terrain</span>
                </Button>

                <Button
                  variant={mapStyle === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStyleChange("dark")}
                  className="h-16 flex flex-col"
                >
                  <div className="w-8 h-6 bg-gray-800 rounded mb-1"></div>
                  <span className="text-xs">Sombre</span>
                </Button>
              </div>
            </div>

            {/* Paramètres d'affichage */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Étiquettes</Label>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Grille</Label>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Échelle</Label>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Export */}
        <div className="pt-4 border-t space-y-3">
          <Label className="text-sm font-medium">Export des données</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("geojson", "all")}
              className="flex items-center space-x-1"
            >
              <Download className="h-3 w-3" />
              <span className="text-xs">GeoJSON</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport("csv", "paroisses")}
              className="flex items-center space-x-1"
            >
              <Download className="h-3 w-3" />
              <span className="text-xs">CSV</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
