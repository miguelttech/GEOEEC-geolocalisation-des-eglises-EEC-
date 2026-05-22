"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, User } from "lucide-react"

interface OuvrierModalProps {
  isOpen: boolean
  onClose: () => void
  ouvrier?: any
  paroisses: any[]
  onSave: (ouvrier: any) => void
}

export default function OuvrierModal({ isOpen, onClose, ouvrier, paroisses, onSave }: OuvrierModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    grade: "",
    contact: "",
    paroisse: "",
  })

  useEffect(() => {
    if (ouvrier) {
      setFormData({
        nom: ouvrier.nom || "",
        grade: ouvrier.grade || "",
        contact: ouvrier.contact || "",
        paroisse: ouvrier.paroisse?.toString() || "",
      })
    } else {
      setFormData({
        nom: "",
        grade: "",
        contact: "",
        paroisse: "",
      })
    }
  }, [ouvrier])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const grades = ["Pasteur Principal", "Pasteur", "Évangéliste", "Ancien", "Diacre", "Catéchiste", "Moniteur", "Autre"]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>{ouvrier ? "Modifier l'Ouvrier" : "Nouvel Ouvrier"}</span>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom Complet *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              placeholder="Ex: Pasteur Jean Mukendi"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="grade">Grade/Fonction *</Label>
            <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact (Téléphone)</Label>
            <Input
              id="contact"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="+243 123 456 789"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paroisse">Paroisse d'Affectation *</Label>
            <Select value={formData.paroisse} onValueChange={(value) => setFormData({ ...formData, paroisse: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une paroisse" />
              </SelectTrigger>
              <SelectContent>
                {paroisses.map((paroisse) => (
                  <SelectItem key={paroisse.id} value={paroisse.id.toString()}>
                    {paroisse.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {ouvrier ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
