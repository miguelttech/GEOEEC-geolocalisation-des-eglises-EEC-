"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileText, Download, Loader2, CheckCircle, XCircle, Eye, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface FileAnalysis {
  id: string
  fileName: string
  type: "paroisses" | "oeuvres" | "ouvriers"
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{ ligne: number; erreurs: any }>
  warnings: string[]
  preview: any[]
  status: "analyzing" | "analyzed" | "importing" | "imported" | "error"
  importedCount?: number
}

interface ImportStats {
  paroisses: number
  oeuvres: number
  ouvriers: number
}

export default function ImportPage() {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [analyses, setAnalyses] = useState<FileAnalysis[]>([])
  const [importStats, setImportStats] = useState<ImportStats>({
    paroisses: 0,
    oeuvres: 0,
    ouvriers: 0,
  })
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean
    analysis: FileAnalysis | null
  }>({ open: false, analysis: null })
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token")
    return {
      Authorization: `Bearer ${token}`,
    }
  }

  const detectFileType = (fileName: string): "paroisses" | "oeuvres" | "ouvriers" | null => {
    const name = fileName.toLowerCase()
    if (name.includes("paroisse")) return "paroisses"
    if (name.includes("oeuvre") || name.includes("œuvre")) return "oeuvres"
    if (name.includes("ouvrier")) return "ouvriers"
    return null
  }

  const getExpectedColumns = (type: "paroisses" | "oeuvres" | "ouvriers") => {
    switch (type) {
      case "paroisses":
        return [
          "Nom de la paroisse",
          "Niveau",
          "Region_synodale",
          "districts",
          "Quartier",
          "Coord_x",
          "Coord_y",
          "communiants",
          "non-communiants",
          "ouvriers",
        ]
      case "ouvriers":
        return ["Nom de la paroisse", "Region_synodale", "districts", "Nom", "Grade", "Contact"]
      case "oeuvres":
        return ["Region_synodale", "Nom de l'œuvre", "Type", "Bureau de district", "Nom de la paroisse"]
      default:
        return []
    }
  }

  // Fonction pour lire réellement le fichier Excel
  const readExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (!data) {
            reject(new Error("Impossible de lire le fichier"))
            return
          }

          // Lire le fichier Excel avec la bibliothèque xlsx
          const workbook = XLSX.read(data, { type: "array" })

          // Prendre la première feuille
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Convertir en JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            raw: false,
          })

          if (jsonData.length === 0) {
            reject(new Error("Le fichier est vide"))
            return
          }

          // La première ligne contient les en-têtes
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1) as any[][]

          // Convertir en objets avec les en-têtes comme clés
          const processedData = rows
            .filter((row) => row.some((cell) => cell !== "" && cell !== null && cell !== undefined))
            .map((row) => {
              const obj: any = {}
              headers.forEach((header, index) => {
                obj[header] = row[index] || ""
              })
              return obj
            })

          resolve(processedData)
        } catch (error) {
          console.error("Erreur lors de la lecture du fichier Excel:", error)
          reject(new Error("Erreur lors de la lecture du fichier Excel: " + (error as Error).message))
        }
      }

      reader.onerror = () => {
        reject(new Error("Erreur lors de la lecture du fichier"))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesAdded(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFilesAdded(Array.from(e.target.files))
    }
  }, [])

  const handleFilesAdded = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter((file) => {
        const isValidType =
          file.type.includes("sheet") ||
          file.type.includes("excel") ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".xls")
        const hasValidName = detectFileType(file.name) !== null

        if (!isValidType) {
          toast.error(`${file.name}: Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv`)
          return false
        }
        if (!hasValidName) {
          toast.error(`${file.name}: Le nom doit contenir 'paroisse', 'oeuvre' ou 'ouvrier'`)
          return false
        }
        return true
      })

      setFiles((prev) => {
        const existingNames = prev.map((f) => f.name)
        const newUniqueFiles = validFiles.filter((f) => !existingNames.includes(f.name))
        return [...prev, ...newUniqueFiles]
      })

      validFiles.forEach((file) => {
        if (!files.some((f) => f.name === file.name)) {
          analyzeFile(file)
        }
      })
    },
    [files],
  )

  const analyzeFile = useCallback(async (file: File) => {
    const fileType = detectFileType(file.name)
    if (!fileType) return

    const analysisId = `${file.name}-${Date.now()}`
    const newAnalysis: FileAnalysis = {
      id: analysisId,
      fileName: file.name,
      type: fileType,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [],
      warnings: [],
      preview: [],
      status: "analyzing",
    }

    setAnalyses((prev) => {
      const filtered = prev.filter((a) => a.fileName !== file.name)
      return [...filtered, newAnalysis]
    })

    try {
      const data = await readExcelFile(file)
      const expectedColumns = getExpectedColumns(fileType)
      const warnings: string[] = []
      const errors: Array<{ ligne: number; erreurs: any }> = []

      if (data.length > 0) {
        const fileColumns = Object.keys(data[0])
        const missingColumns = expectedColumns.filter((col) => !fileColumns.includes(col))
        const extraColumns = fileColumns.filter((col) => !expectedColumns.includes(col))

        if (missingColumns.length > 0) {
          warnings.push(`Colonnes manquantes: ${missingColumns.join(", ")}`)
        }
        if (extraColumns.length > 0) {
          warnings.push(`Colonnes supplémentaires détectées: ${extraColumns.length} colonnes`)
        }

        // Validation des données
        data.forEach((row, index) => {
          const rowErrors: string[] = []

          switch (fileType) {
            case "paroisses":
              if (!row["Nom de la paroisse"] || row["Nom de la paroisse"].toString().trim() === "") {
                rowErrors.push("Nom de paroisse manquant")
              }
              if (!row["Region_synodale"] || row["Region_synodale"].toString().trim() === "") {
                rowErrors.push("Région synodale manquante")
              }
              if (!row["Niveau"] || row["Niveau"].toString().trim() === "") {
                rowErrors.push("Niveau manquant")
              }
              if (row["Coord_x"] && isNaN(Number(row["Coord_x"]))) {
                rowErrors.push("Coordonnée X invalide")
              }
              if (row["Coord_y"] && isNaN(Number(row["Coord_y"]))) {
                rowErrors.push("Coordonnée Y invalide")
              }
              break
            case "ouvriers":
              if (!row["Nom"] || row["Nom"].toString().trim() === "") {
                rowErrors.push("Nom d'ouvrier manquant")
              }
              if (!row["Nom de la paroisse"] || row["Nom de la paroisse"].toString().trim() === "") {
                rowErrors.push("Nom de paroisse manquant")
              }
              if (!row["Region_synodale"] || row["Region_synodale"].toString().trim() === "") {
                rowErrors.push("Région synodale manquante")
              }
              if (!row["Grade"] || row["Grade"].toString().trim() === "") {
                rowErrors.push("Grade manquant")
              }
              break
            case "oeuvres":
              if (!row["Nom de l'œuvre"] || row["Nom de l'œuvre"].toString().trim() === "") {
                rowErrors.push("Nom de l'œuvre manquant")
              }
              if (!row["Type"] || row["Type"].toString().trim() === "") {
                rowErrors.push("Type d'œuvre manquant")
              }
              // Pour les œuvres, la validation dépend du type de feuille
              break
          }

          if (rowErrors.length > 0) {
            errors.push({ ligne: index + 2, erreurs: rowErrors.join(", ") })
          }
        })
      }

      const updatedAnalysis: FileAnalysis = {
        ...newAnalysis,
        status: "analyzed",
        totalRows: data.length,
        validRows: data.length - errors.length,
        invalidRows: errors.length,
        errors,
        warnings,
        preview: data.slice(0, 20), // Prendre les 20 premières lignes pour la prévisualisation
      }

      setAnalyses((prev) => prev.map((a) => (a.id === analysisId ? updatedAnalysis : a)))
      toast.success(`Analyse de ${file.name} terminée: ${data.length} lignes trouvées`)
    } catch (error: any) {
      console.error("Erreur lors de l'analyse:", error)
      const errorAnalysis: FileAnalysis = {
        ...newAnalysis,
        status: "error",
        errors: [{ ligne: 0, erreurs: error.message || "Erreur inconnue lors de l'analyse" }],
      }
      setAnalyses((prev) => prev.map((a) => (a.id === analysisId ? errorAnalysis : a)))
      toast.error(`Erreur lors de l'analyse de ${file.name}: ${error.message}`)
    }
  }, [])

  const handlePreview = useCallback((analysis: FileAnalysis) => {
    setPreviewDialog({ open: true, analysis })
  }, [])

  const handleImport = useCallback(
    async (analysis: FileAnalysis) => {
      if (analysis.status !== "analyzed") return

      setAnalyses((prev) => prev.map((a) => (a.id === analysis.id ? { ...a, status: "importing" } : a)))

      try {
        const file = files.find((f) => f.name === analysis.fileName)
        if (!file) throw new Error("Fichier introuvable")

        const formData = new FormData()
        formData.append("file", file)

        // Utiliser l'endpoint correct selon le type
        const endpoints = {
          paroisses: "http://localhost:8000/api/import/paroisses/",
          oeuvres: "http://localhost:8000/api/import/oeuvres/",
          ouvriers: "http://localhost:8000/api/import/ouvriers/",
        }

        const endpoint = endpoints[analysis.type]

        console.log(`Tentative d'importation vers: ${endpoint}`)

        const response = await fetch(endpoint, {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        })

        console.log(`Réponse HTTP: ${response.status} ${response.statusText}`)

        // Vérifier le type de contenu de la réponse
        const contentType = response.headers.get("content-type")
        console.log(`Type de contenu: ${contentType}`)

        if (!response.ok) {
          let errorMessage = `Erreur ${response.status}: ${response.statusText}`

          try {
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json()
              errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage
            } else {
              // Si ce n'est pas du JSON, lire comme texte
              const errorText = await response.text()
              console.log("Réponse d'erreur (HTML/Text):", errorText.substring(0, 500))

              if (response.status === 404) {
                errorMessage = `Endpoint non trouvé: ${endpoint}. Vérifiez que l'URL de l'API est correcte.`
              } else if (response.status === 401) {
                errorMessage = "Non autorisé. Vérifiez votre token d'authentification."
              } else if (response.status === 403) {
                errorMessage = "Accès interdit. Permissions insuffisantes."
              } else if (response.status === 500) {
                errorMessage = "Erreur serveur interne. Vérifiez les logs du serveur Django."
              } else {
                errorMessage = `Erreur ${response.status}. Le serveur a retourné du HTML au lieu de JSON.`
              }
            }
          } catch (parseError) {
            console.error("Erreur lors du parsing de la réponse d'erreur:", parseError)
            errorMessage = `Erreur ${response.status}. Impossible de parser la réponse du serveur.`
          }

          throw new Error(errorMessage)
        }

        // Vérifier que la réponse est bien du JSON
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text()
          console.log("Réponse non-JSON:", responseText.substring(0, 500))
          throw new Error("Le serveur a retourné une réponse non-JSON. Vérifiez la configuration de l'API.")
        }

        const result = await response.json()
        console.log("Résultat de l'importation:", result)

        // Extraire le nombre d'éléments importés
        let importedCount = 0
        if (result.message) {
          const importedMatch = result.message.match(/(\d+)/)
          importedCount = importedMatch ? Number.parseInt(importedMatch[1]) : 0
        }
        if (result.imported_count !== undefined) {
          importedCount = result.imported_count
        }
        if (result.count !== undefined) {
          importedCount = result.count
        }
        if (result.success_count !== undefined) {
          importedCount = result.success_count
        }

        const updatedAnalysis: FileAnalysis = {
          ...analysis,
          status: "imported",
          importedCount,
          errors: result.erreurs || result.errors || [],
        }

        setAnalyses((prev) => prev.map((a) => (a.id === analysis.id ? updatedAnalysis : a)))

        // Mettre à jour les statistiques
        setImportStats((prev) => ({
          ...prev,
          [analysis.type]: prev[analysis.type] + importedCount,
        }))

        toast.success(`${importedCount} ${analysis.type} importé(e)s avec succès`)

        if (result.erreurs && result.erreurs.length > 0) {
          toast.warning(`${result.erreurs.length} erreurs détectées lors de l'importation`)
        }
        if (result.errors && result.errors.length > 0) {
          toast.warning(`${result.errors.length} erreurs détectées lors de l'importation`)
        }
      } catch (error: any) {
        console.error("Erreur lors de l'importation:", error)
        setAnalyses((prev) =>
          prev.map((a) =>
            a.id === analysis.id ? { ...a, status: "error", errors: [{ ligne: 0, erreurs: error.message }] } : a,
          ),
        )
        toast.error(`Erreur lors de l'importation de ${analysis.fileName}: ${error.message}`)
      }
    },
    [files],
  )

  const handleDownloadTemplate = useCallback(async (type: "paroisses" | "oeuvres" | "ouvriers") => {
    setIsDownloading(type)
    try {
      const endpoints = {
        paroisses: "http://localhost:8000/api/export/template/paroisses/",
        oeuvres: "http://localhost:8000/api/export/template/oeuvres/",
        ouvriers: "http://localhost:8000/api/export/template/ouvriers/",
      }

      const endpoint = endpoints[type]
      console.log(`Téléchargement du template depuis: ${endpoint}`)

      const response = await fetch(endpoint, {
        method: "GET",
      })

      console.log(`Réponse HTTP: ${response.status} ${response.statusText}`)
      console.log("Headers de réponse:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`

        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorData.message || errorMessage
          } catch {
            // Ignore parsing errors
          }
        } else if (response.status === 404) {
          errorMessage = `Template non trouvé: ${endpoint}`
        }

        throw new Error(errorMessage)
      }

      // Vérifier le type de contenu
      const contentType = response.headers.get("content-type")
      console.log(`Type de contenu de la réponse: ${contentType}`)

      // Vérifier si c'est bien un fichier Excel
      if (
        !contentType ||
        (!contentType.includes("application/vnd.openxmlformats") && !contentType.includes("application/vnd.ms-excel"))
      ) {
        console.warn("Type de contenu inattendu pour un fichier Excel:", contentType)
      }

      const blob = await response.blob()
      console.log(`Taille du blob: ${blob.size} bytes`)
      console.log(`Type du blob: ${blob.type}`)

      if (blob.size === 0) {
        throw new Error("Le fichier téléchargé est vide")
      }

      // Créer un nom de fichier unique avec timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const filename = `template_${type}_${timestamp}.xlsx`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a)
        }
        window.URL.revokeObjectURL(url)
      }, 100)


      toast.success(`Template ${type} téléchargé avec succès (${filename})`)
    } catch (error: any) {
      console.error("Erreur de téléchargement:", error)
      toast.error(`Erreur lors du téléchargement du template ${type}: ${error.message}`)
    } finally {
      setIsDownloading(null)
    }
  }, [])

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName))
    setAnalyses((prev) => prev.filter((a) => a.fileName !== fileName))
  }, [])

  const getStatusIcon = (status: FileAnalysis["status"]) => {
    switch (status) {
      case "analyzing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "analyzed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "importing":
        return <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
      case "imported":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: FileAnalysis["status"]) => {
    const variants = {
      analyzing: "default",
      analyzed: "secondary",
      importing: "default",
      imported: "default",
      error: "destructive",
    } as const

    const labels = {
      analyzing: "Analyse...",
      analyzed: "Analysé",
      importing: "Import...",
      imported: "Importé",
      error: "Erreur",
    }

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import de Fichiers EEC</h1>
        <p className="text-gray-600 mt-2">
          Importez vos fichiers Excel contenant les données des paroisses, œuvres et ouvriers de l'Église Évangélique du
          Cameroun
        </p>
      </div>

      {/* Zone de téléchargement */}
      <Card className="border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-600" />
            <span>Télécharger des Fichiers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4 text-lg">
              Glissez-déposez vos fichiers Excel ici ou cliquez pour sélectionner
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Formats supportés: .xlsx, .xls, .csv
              <br />
              Le nom du fichier doit contenir "paroisse", "oeuvre" ou "ouvrier"
            </p>
            <Button onClick={handleFileSelect} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Sélectionner des fichiers
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-green-600" />
            <span>Templates de Fichiers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 text-lg">Paroisses</h3>
              <p className="text-sm text-gray-600">
                Colonnes principales: Nom de la paroisse, Niveau, Région synodale, Districts, Quartier, Coordonnées
                (Coord_x, Coord_y), Effectifs (communiants, non-communiants, ouvriers)
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                disabled={isDownloading === "paroisses"}
                onClick={() => handleDownloadTemplate("paroisses")}
              >
                {isDownloading === "paroisses" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Télécharger Template
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 text-lg">Œuvres</h3>
              <p className="text-sm text-gray-600">
                Colonnes principales: Région synodale, Nom de l'œuvre, Type, Bureau de district, Nom de la paroisse
                (selon le type d'œuvre)
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                disabled={isDownloading === "oeuvres"}
                onClick={() => handleDownloadTemplate("oeuvres")}
              >
                {isDownloading === "oeuvres" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Télécharger Template
              </Button>
            </div>

            <div className="space-y-3 p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 text-lg">Ouvriers</h3>
              <p className="text-sm text-gray-600">
                Colonnes principales: Nom de la paroisse, Région synodale, Districts, Nom, Grade, Contact
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                disabled={isDownloading === "ouvriers"}
                onClick={() => handleDownloadTemplate("ouvriers")}
              >
                {isDownloading === "ouvriers" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Télécharger Template
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fichiers analysés */}
      {analyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fichiers Analysés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <div key={analysis.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(analysis.status)}
                      <div>
                        <p className="font-medium text-gray-900">{analysis.fileName}</p>
                        <p className="text-sm text-gray-600 capitalize">{analysis.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(analysis.status)}
                      <Button variant="ghost" size="sm" onClick={() => removeFile(analysis.fileName)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {analysis.status === "analyzed" && (
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="font-semibold text-blue-600 text-xl">{analysis.totalRows}</p>
                        <p className="text-gray-600">Total lignes</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="font-semibold text-green-600 text-xl">{analysis.validRows}</p>
                        <p className="text-gray-600">Lignes valides</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="font-semibold text-red-600 text-xl">{analysis.invalidRows}</p>
                        <p className="text-gray-600">Lignes avec erreurs</p>
                      </div>
                    </div>
                  )}

                  {analysis.status === "imported" && analysis.importedCount !== undefined && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {analysis.importedCount} éléments importés avec succès
                      </p>
                    </div>
                  )}

                  {analysis.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-800 mb-2 flex items-center">
                        <XCircle className="h-5 w-5 mr-2" />
                        Erreurs détectées:
                      </p>
                      <div className="text-sm text-red-700 space-y-1 max-h-32 overflow-y-auto">
                        {analysis.errors.slice(0, 5).map((error, i) => (
                          <div key={`${analysis.id}-error-${i}`} className="flex">
                            <span className="font-medium mr-2">Ligne {error.ligne}:</span>
                            <span>
                              {typeof error.erreurs === "string" ? error.erreurs : JSON.stringify(error.erreurs)}
                            </span>
                          </div>
                        ))}
                        {analysis.errors.length > 5 && (
                          <div className="text-red-600 font-medium">
                            ... et {analysis.errors.length - 5} autres erreurs
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {analysis.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="font-medium text-yellow-800 mb-2">Avertissements:</p>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {analysis.warnings.slice(0, 3).map((warning, i) => (
                          <li key={`${analysis.id}-warning-${i}`}>• {warning}</li>
                        ))}
                        {analysis.warnings.length > 3 && (
                          <li className="text-yellow-600 font-medium">
                            • ... et {analysis.warnings.length - 3} autres avertissements
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {analysis.status === "analyzed" && (
                    <div className="flex space-x-3 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handlePreview(analysis)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Prévisualiser
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleImport(analysis)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Importer dans l'application
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques d'importation */}
      {(importStats.paroisses > 0 || importStats.oeuvres > 0 || importStats.ouvriers > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques d'Importation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-4xl font-bold text-blue-600 mb-2">{importStats.paroisses}</p>
                <p className="text-gray-600 font-medium">Paroisses importées</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <p className="text-4xl font-bold text-green-600 mb-2">{importStats.oeuvres}</p>
                <p className="text-gray-600 font-medium">Œuvres importées</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-4xl font-bold text-purple-600 mb-2">{importStats.ouvriers}</p>
                <p className="text-gray-600 font-medium">Ouvriers importés</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de prévisualisation */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open, analysis: null })}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Prévisualisation - {previewDialog.analysis?.fileName}</DialogTitle>
            <DialogDescription>
              Aperçu des {Math.min(previewDialog.analysis?.preview.length || 0, 20)} premiers enregistrements sur{" "}
              {previewDialog.analysis?.totalRows || 0} au total
            </DialogDescription>
          </DialogHeader>

          {previewDialog.analysis?.preview && previewDialog.analysis.preview.length > 0 && (
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="text-xs font-medium w-12">#</TableHead>
                    {Object.keys(previewDialog.analysis.preview[0]).map((key) => (
                      <TableHead key={key} className="text-xs font-medium whitespace-nowrap min-w-32">
                        {key}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewDialog.analysis.preview.slice(0, 20).map((row, index) => (
                    <TableRow key={`preview-row-${index}`} className="hover:bg-gray-50">
                      <TableCell className="text-xs font-medium text-gray-500">{index + 1}</TableCell>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <TableCell key={`preview-cell-${index}-${cellIndex}`} className="text-xs max-w-48">
                          <div className="truncate" title={String(value || "")}>
                            {String(value || "")}
                          </div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setPreviewDialog({ open: false, analysis: null })}>
              Fermer
            </Button>
            {previewDialog.analysis && previewDialog.analysis.status === "analyzed" && (
              <Button
                onClick={() => {
                  handleImport(previewDialog.analysis!)
                  setPreviewDialog({ open: false, analysis: null })
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Confirmer l'importation
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
