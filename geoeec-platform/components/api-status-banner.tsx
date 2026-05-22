"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, X } from "lucide-react"

export default function ApiStatusBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "demo">("checking")

  useEffect(() => {
    const checkApiStatus = async () => {
      const useMockData = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true"

      if (useMockData) {
        setApiStatus("demo")
        setIsVisible(true)
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/health/`)
        if (response.ok) {
          setApiStatus("connected")
        } else {
          setApiStatus("demo")
          setIsVisible(true)
        }
      } catch (error) {
        setApiStatus("demo")
        setIsVisible(true)
      }
    }

    checkApiStatus()
  }, [])

  if (!isVisible || apiStatus === "connected") {
    return null
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center space-x-2">
          <span className="text-yellow-800">
            <strong>Mode Démonstration :</strong> L'application utilise des données de test. Connectez votre backend
            Django pour utiliser les vraies données.
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Réessayer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-yellow-700 hover:bg-yellow-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
