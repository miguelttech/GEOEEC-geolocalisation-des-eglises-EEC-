"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info, MapPin, GraduationCap } from "lucide-react"

interface MapLegendProps {
  visibleLayers: {
    paroisses: boolean
    oeuvres: boolean
    zones_influence: boolean
    itineraires: boolean
    heatmap: boolean
  }
  statistics?: {
    total_paroisses: number
    total_oeuvres: number
    total_fideles: number
    total_ouvriers: number
  }
}

export default function MapLegend({ visibleLayers, statistics }: MapLegendProps) {
  return (
    <Card className="w-64 bg-white/95 backdrop-blur-sm shadow-lg border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <Info className="h-4 w-4 text-blue-600" />
          <span>Légende</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        {statistics && (
          <div className="grid grid-cols-2 gap-2 pb-3 border-b">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{statistics.total_paroisses}</div>
              <div className="text-xs text-gray-600">Paroisses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{statistics.total_oeuvres}</div>
              <div className="text-xs text-gray-600">Œuvres</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{statistics.total_fideles.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Fidèles</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{statistics.total_ouvriers}</div>
              <div className="text-xs text-gray-600">Ouvriers</div>
            </div>
          </div>
        )}

        {/* Légende des paroisses */}
        {visibleLayers.paroisses && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Paroisses</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>&gt; 1000 fidèles</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span>500-1000 fidèles</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>&lt; 500 fidèles</span>
              </div>
            </div>
          </div>
        )}

        {/* Légende des œuvres */}
        {visibleLayers.oeuvres && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Œuvres</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Scolaire</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Universitaire</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Médicale</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Agropastorale</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Immeuble</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Terrain</span>
              </div>
            </div>
          </div>
        )}

        {/* Légende des zones d'influence */}
        {visibleLayers.zones_influence && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500/30 border-2 border-green-500" />
              <span className="text-sm font-medium">Zones d'influence</span>
            </div>
            <div className="ml-6 text-xs text-gray-600">Zones de rayonnement des paroisses</div>
          </div>
        )}

        {/* Légende des itinéraires */}
        {visibleLayers.itineraires && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-1 bg-orange-500 rounded" />
              <span className="text-sm font-medium">Itinéraires</span>
            </div>
            <div className="ml-6 text-xs text-gray-600">Connexions entre paroisses</div>
          </div>
        )}

        {/* Légende de la heatmap */}
        {visibleLayers.heatmap && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded" />
              <span className="text-sm font-medium">Densité</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-600">Faible</span>
                <span className="text-red-600">Élevée</span>
              </div>
            </div>
          </div>
        )}

        {/* Échelle */}
        <div className="pt-3 border-t">
          <div className="text-xs text-gray-600 mb-2">Échelle</div>
          <div className="flex items-center space-x-2">
            <div className="w-16 h-1 bg-black"></div>
            <span className="text-xs">10 km</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
