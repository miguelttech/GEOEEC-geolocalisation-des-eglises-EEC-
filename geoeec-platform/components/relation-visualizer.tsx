"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Network, Building, GraduationCap, Users, Eye, EyeOff, Zap } from "lucide-react"

interface RelationVisualizerProps {
  selectedParoisse: any
  relations: {
    oeuvres: any[]
    ouvriers: any[]
  }
  onHighlightRelation: (item: any) => void
  onClearHighlight: () => void
}

export default function RelationVisualizer({
  selectedParoisse,
  relations,
  onHighlightRelation,
  onClearHighlight,
}: RelationVisualizerProps) {
  const [showOeuvres, setShowOeuvres] = useState(true)
  const [showOuvriers, setShowOuvriers] = useState(true)
  const [animateConnections, setAnimateConnections] = useState(false)

  useEffect(() => {
    if (animateConnections) {
      const timer = setTimeout(() => setAnimateConnections(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [animateConnections])

  if (!selectedParoisse) {
    return (
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
        <CardContent className="p-4 text-center text-gray-500">
          <Network className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Sélectionnez une paroisse pour voir ses relations</p>
        </CardContent>
      </Card>
    )
  }

  const totalRelations = relations.oeuvres.length + relations.ouvriers.length

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            <span className="truncate">{selectedParoisse.nom}</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAnimateConnections(true)} className="h-6 px-2">
            <Zap className="h-3 w-3" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {totalRelations} relations
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {selectedParoisse.region || selectedParoisse.region_synodale}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Statistiques de la paroisse */}
        {(selectedParoisse.communiants || selectedParoisse.non_communiants) && (
          <div className="grid grid-cols-2 gap-2">
            {selectedParoisse.communiants && (
              <div className="bg-blue-50 p-2 rounded text-center">
                <div className="text-sm font-bold text-blue-700">{selectedParoisse.communiants.toLocaleString()}</div>
                <div className="text-xs text-blue-600">Communiants</div>
              </div>
            )}
            {selectedParoisse.non_communiants && (
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="text-sm font-bold text-gray-700">
                  {selectedParoisse.non_communiants.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Non-communiants</div>
              </div>
            )}
          </div>
        )}

        {/* Contrôles de visibilité */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={showOeuvres ? "default" : "outline"}
            onClick={() => setShowOeuvres(!showOeuvres)}
            className="flex-1 h-7 text-xs"
          >
            {showOeuvres ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            Œuvres ({relations.oeuvres.length})
          </Button>
          <Button
            size="sm"
            variant={showOuvriers ? "default" : "outline"}
            onClick={() => setShowOuvriers(!showOuvriers)}
            className="flex-1 h-7 text-xs"
          >
            {showOuvriers ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            Ouvriers ({relations.ouvriers.length})
          </Button>
        </div>

        {/* Liste des œuvres */}
        {showOeuvres && relations.oeuvres.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-green-600" />
              Œuvres liées
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {relations.oeuvres.map((oeuvre) => (
                <div
                  key={oeuvre.id}
                  className="flex items-center justify-between p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => onHighlightRelation(oeuvre)}
                  onMouseEnter={() => onHighlightRelation(oeuvre)}
                  onMouseLeave={onClearHighlight}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-green-800 truncate">{oeuvre.nom}</div>
                    <div className="text-xs text-green-600">{oeuvre.type_oeuvre || oeuvre.type || "Autre"}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {oeuvre.niveau || "N/A"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liste des ouvriers */}
        {showOuvriers && relations.ouvriers.length > 0 && (
          <div className="space-y-1">
            <h4 className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Users className="h-3 w-3 text-cyan-600" />
              Ouvriers affectés
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {relations.ouvriers.map((ouvrier) => (
                <div
                  key={ouvrier.id}
                  className="flex items-center justify-between p-2 bg-cyan-50 rounded cursor-pointer hover:bg-cyan-100 transition-colors"
                  onClick={() => onHighlightRelation(ouvrier)}
                  onMouseEnter={() => onHighlightRelation(ouvrier)}
                  onMouseLeave={onClearHighlight}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-cyan-800 truncate">{ouvrier.nom}</div>
                    <div className="text-xs text-cyan-600">{ouvrier.grade || ouvrier.fonction || "Ouvrier"}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {ouvrier.statut || "Actif"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune relation */}
        {totalRelations === 0 && (
          <div className="text-center py-4 text-gray-500">
            <Network className="h-6 w-6 mx-auto mb-2 text-gray-400" />
            <p className="text-xs">Aucune relation trouvée</p>
          </div>
        )}

        {/* Animation des connexions */}
        {animateConnections && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="animate-pulse bg-blue-500/20 rounded-lg h-full w-full"></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
