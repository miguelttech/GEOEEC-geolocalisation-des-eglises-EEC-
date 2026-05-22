"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, MapPin } from "lucide-react"

interface ParoisseModalProps {
  isOpen: boolean
  onClose: () => void
  paroisse?: any
  onSave: (paroisse: any) => void
}

export default function ParoisseModal({ isOpen, onClose, paroisse, onSave }: ParoisseModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    quartier: "",
    niveau: "",
    region_synodale: "",
    district: "",
    communiants: 0,
    non_communiants: 0,
    ouvriers: 0,
    latitude: "",
    longitude: "",
  })

  useEffect(() => {
    if (paroisse) {
      setFormData({
        nom: paroisse.nom || "",
        quartier: paroisse.quartier || "",
        niveau: paroisse.niveau || "",
        region_synodale: paroisse.region_synodale || "",
        district: paroisse.district || "",
        communiants: paroisse.communiants || 0,
        non_communiants: paroisse.non_communiants || 0,
        ouvriers: paroisse.ouvriers || 0,
        latitude: paroisse.localisation?.latitude?.toString() || "",
        longitude: paroisse.localisation?.longitude?.toString() || "",
      })
    } else {
      setFormData({
        nom: "",
        quartier: "",
        niveau: "",
        region_synodale: "",
        district: "",
        communiants: 0,
        non_communiants: 0,
        ouvriers: 0,
        latitude: "",
        longitude: "",
      })
    }
  }, [paroisse])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {paroisse ? "Modifier la Paroisse" : "Nouvelle Paroisse"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la Paroisse *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quartier">Quartier</Label>
              <Input
                id="quartier"
                value={formData.quartier}
                onChange={(e) => setFormData({ ...formData, quartier: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau">Niveau</Label>
              <Select value={formData.niveau} onValueChange={(value) => setFormData({ ...formData, niveau: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Urbaine">Urbaine</SelectItem>
                  <SelectItem value="Rurale">Rurale</SelectItem>
                  <SelectItem value="Semi-urbaine">Semi-urbaine</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region_synodale">Région Synodale *</Label>
              <Select
                value={formData.region_synodale}
                onValueChange={(value) => setFormData({ ...formData, region_synodale: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner la région" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                  <SelectItem value="Bandundu">Bandundu</SelectItem>
                  <SelectItem value="Bas-Congo">Bas-Congo</SelectItem>
                  <SelectItem value="Kasaï">Kasaï</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="communiants">Nombre de Communiants</Label>
              <Input
                id="communiants"
                type="number"
                value={formData.communiants}
                onChange={(e) => setFormData({ ...formData, communiants: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="non_communiants">Nombre de Non-Communiants</Label>
              <Input
                id="non_communiants"
                type="number"
                value={formData.non_communiants}
                onChange={(e) => setFormData({ ...formData, non_communiants: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ouvriers">Nombre d'Ouvriers</Label>
              <Input
                id="ouvriers"
                type="number"
                value={formData.ouvriers}
                onChange={(e) => setFormData({ ...formData, ouvriers: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-emerald-600" />
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
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {paroisse ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
