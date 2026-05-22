"use client"

import { MapPin, Layers, Search } from "lucide-react"

export default function MapLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
            </div>
            <div className="flex space-x-3">
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Panneau de contrôle skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recherche */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-5 w-5 text-gray-300" />
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Couches */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Layers className="h-5 w-5 text-gray-300" />
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Légende */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center space-x-2 mb-4">
                <MapPin className="h-5 w-5 text-gray-300" />
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carte skeleton */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border h-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Chargement de la carte interactive...</p>
                    <p className="text-gray-500 text-sm mt-2">Préparation des données géographiques</p>
                  </div>
                </div>

                {/* Éléments décoratifs pour simuler une carte */}
                <div className="absolute top-10 left-10 w-8 h-8 bg-emerald-300 rounded-full opacity-50 animate-pulse"></div>
                <div className="absolute top-20 right-20 w-6 h-6 bg-blue-300 rounded-full opacity-50 animate-pulse delay-300"></div>
                <div className="absolute bottom-20 left-20 w-10 h-10 bg-purple-300 rounded-full opacity-50 animate-pulse delay-500"></div>
                <div className="absolute bottom-10 right-10 w-7 h-7 bg-yellow-300 rounded-full opacity-50 animate-pulse delay-700"></div>

                {/* Lignes simulant des routes */}
                <div className="absolute top-1/4 left-0 right-0 h-1 bg-gray-300 opacity-30 animate-pulse delay-1000"></div>
                <div className="absolute top-0 bottom-0 left-1/3 w-1 bg-gray-300 opacity-30 animate-pulse delay-1200"></div>
              </div>

              {/* Contrôles de carte simulés */}
              <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 space-y-2">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
