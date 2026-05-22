"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, GraduationCap, MapPin } from "lucide-react"

interface OeuvreModalProps {
  isOpen: boolean
  onClose: () => void
  oeuvre?: any
  paroisses: any[]
  onSave: (oeuvre: any) => void
}

export default function OeuvreModal({ isOpen, onClose, oeuvre, paroisses, onSave }: OeuvreModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    type: "scolaire", // Default value set to "scolaire"
    niveau: "paroissial", // Default value set to "paroissial"
    paroisse: "",
    latitude: "",
    longitude: "",
  })

  useEffect(() => {
    if (oeuvre) {
      setFormData({
        nom: oeuvre.nom || "",
        type: oeuvre.type || "scolaire", // Default value set to "scolaire"
        niveau: oeuvre.niveau || "paroissial", // Default value set to "paroissial"
        paroisse: oeuvre.paroisse?.toString() || "",
        latitude: oeuvre.localisation?.latitude?.toString() || "",
        longitude: oeuvre.localisation?.longitude?.toString() || "",
      })
    } else {
      setFormData({
        nom: "",
        type: "scolaire", // Default value set to "scolaire"
        niveau: "paroissial", // Default value set to "paroissial"
        paroisse: "",
        latitude: "",
        longitude: "",
      })
    }
  }, [oeuvre])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const types = [
    { value: "scolaire", label: "Scolaire" },
    { value: "universitaire", label: "Universitaire" },
    { value: "médicale", label: "Médicale" },
    { value: "agropastorale", label: "Agropastorale" },
    { value: "immeuble", label: "Immeuble" },
    { value: "terrain", label: "Terrain" },
    { value: "autre", label: "Autre" },
  ]

  const niveaux = [
    { value: "paroissial", label: "Paroissial" },
    { value: "district", label: "District" },
    { value: "regional", label: "Régional" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <span>{oeuvre ? "Modifier l'Œuvre" : "Nouvelle Œuvre"}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de l'Œuvre *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: École Primaire Saint-Pierre"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'Œuvre *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau">Niveau *</Label>
              <Select value={formData.niveau} onValueChange={(value) => setFormData({ ...formData, niveau: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le niveau" />
                </SelectTrigger>
                <SelectContent>
                  {niveaux.map((niveau) => (
                    <SelectItem key={niveau.value} value={niveau.value}>
                      {niveau.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paroisse">Paroisse (Optionnel)</Label>
              <Select
                value={formData.paroisse}
                onValueChange={(value) => setFormData({ ...formData, paroisse: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une paroisse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune paroisse</SelectItem>
                  {paroisses.map((paroisse) => (
                    <SelectItem key={paroisse.id} value={paroisse.id.toString()}>
                      {paroisse.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Localisation (Optionnel)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-4.3317"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="15.3139"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              {oeuvre ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
