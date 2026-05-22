"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet.markercluster"

interface LocationData {
  id: string
  nom: string
  type: "bureau_national" | "bureau_regional" | "bureau_district" | "paroisse" | "oeuvre"
  sousType?: "scolaire" | "sante" | "infrastructure" | "terrain"
  region: string
  district?: string
  latitude: number
  longitude: number
  ouvriers?: number
  fideles?: number
  description?: string
  pasteur?: string
  responsable?: string
  telephone?: string
  oeuvresAssociees?: LocationData[]
}

interface LeafletMapProps {
  onRegionSelect: (region: string | null) => void
  selectedRegion: string | null
  onLocationClick?: (location: LocationData) => void
  locations?: LocationData[]
  enableClustering?: boolean
}

export default function LeafletMap({
  onRegionSelect,
  selectedRegion,
  onLocationClick,
  locations = [],
  enableClustering = true,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current && !mapInstanceRef.current) {
      // Configuration des icônes par défaut de Leaflet
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      })

      // Initialisation de la carte centrée sur le Cameroun
      const map = L.map(mapRef.current!).setView([7.3697, 12.3547], 6)

      // Ajout de la couche OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map)

      // Initialisation du groupe de clustering
      if (enableClustering && (window as any).L.markerClusterGroup) {
        markersRef.current = (window as any).L.markerClusterGroup({
          chunkedLoading: true,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount()
            let className = "marker-cluster-small"
            if (count > 10) className = "marker-cluster-medium"
            if (count > 100) className = "marker-cluster-large"

            return L.divIcon({
              html: `<div><span>${count}</span></div>`,
              className: `marker-cluster ${className}`,
              iconSize: [40, 40],
            })
          },
        })
      } else {
        markersRef.current = L.layerGroup()
      }

      map.addLayer(markersRef.current)
      mapInstanceRef.current = map

      // Ajout des styles CSS pour le clustering
      const style = document.createElement("style")
      style.textContent = `
        .marker-cluster-small {
          background-color: rgba(181, 226, 140, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(110, 204, 57, 0.6);
        }
        .marker-cluster-medium {
          background-color: rgba(241, 211, 87, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(240, 194, 12, 0.6);
        }
        .marker-cluster-large {
          background-color: rgba(253, 156, 115, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(241, 128, 23, 0.6);
        }
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 20px;
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
        }
        .marker-cluster span {
          line-height: 30px;
          color: #fff;
          font-weight: bold;
        }
      `
      document.head.appendChild(style)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [enableClustering])

  // Mise à jour des marqueurs quand les locations changent
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current) return

    // Vider les marqueurs existants
    markersRef.current.clearLayers()

    // Icônes personnalisées plus petites
    const createIcon = (type: string, sousType?: string) => {
      let color = "#6b7280"
      let size = 8

      switch (type) {
        case "bureau_national":
          color = "#dc2626"
          size = 14
          break
        case "bureau_regional":
          color = "#f97316"
          size = 12
          break
        case "bureau_district":
          color = "#f59e0b"
          size = 10
          break
        case "paroisse":
          color = "#2563eb"
          size = 8
          break
        case "oeuvre":
          switch (sousType) {
            case "scolaire":
              color = "#059669"
              break
            case "sante":
              color = "#dc2626"
              break
            case "infrastructure":
              color = "#475569"
              break
            case "terrain":
              color = "#f59e0b"
              break
            default:
              color = "#7c3aed"
          }
          size = 6
          break
      }

      return L.divIcon({
        className: "custom-marker",
        html: `<div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      })
    }

    // Ajouter les marqueurs
    locations.forEach((location) => {
      const icon = createIcon(location.type, location.sousType)

      const marker = L.marker([location.latitude, location.longitude], { icon })

      // Contenu du popup
      const popupContent = `
        <div style="font-family: system-ui; padding: 8px; min-width: 250px; max-width: 300px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 12px; height: 12px; background-color: ${createIcon(location.type, location.sousType).options.html?.match(/background-color: ([^;]+)/)?.[1] || "#6b7280"}; border-radius: 50%;"></div>
            <h4 style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 600;">${location.nom}</h4>
          </div>
          
          <div style="margin-bottom: 8px;">
            <span style="background-color: #f3f4f6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 500;">
              ${getTypeLabel(location.type, location.sousType)}
            </span>
          </div>
          
          <div style="color: #6b7280; font-size: 12px; line-height: 1.4;">
            <p style="margin: 2px 0;"><strong>Région:</strong> ${location.region}</p>
            ${location.district ? `<p style="margin: 2px 0;"><strong>District:</strong> ${location.district}</p>` : ""}
            ${location.pasteur ? `<p style="margin: 2px 0;"><strong>Pasteur:</strong> ${location.pasteur}</p>` : ""}
            ${location.responsable ? `<p style="margin: 2px 0;"><strong>Responsable:</strong> ${location.responsable}</p>` : ""}
            ${location.ouvriers ? `<p style="margin: 2px 0;"><strong>Ouvriers:</strong> ${location.ouvriers}</p>` : ""}
            ${location.fideles ? `<p style="margin: 2px 0;"><strong>Fidèles:</strong> ${location.fideles}</p>` : ""}
            ${location.telephone ? `<p style="margin: 2px 0;"><strong>Tél:</strong> ${location.telephone}</p>` : ""}
          </div>
          
          ${
            location.description
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 11px; font-style: italic;">${location.description}</p>
            </div>
          `
              : ""
          }
          
          ${
            location.type === "paroisse" && location.oeuvresAssociees && location.oeuvresAssociees.length > 0
              ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 11px; color: #374151;">
                Œuvres associées (${location.oeuvresAssociees.length}):
              </p>
              <div style="max-height: 80px; overflow-y: auto;">
                ${location.oeuvresAssociees
                  .map(
                    (oeuvre) => `
                  <div style="display: flex; align-items: center; gap: 4px; margin: 2px 0; font-size: 10px; color: #6b7280;">
                    <div style="width: 6px; height: 6px; background-color: ${createIcon(oeuvre.type, oeuvre.sousType).options.html?.match(/background-color: ([^;]+)/)?.[1] || "#6b7280"}; border-radius: 50%;"></div>
                    <span>${oeuvre.nom}</span>
                  </div>
                `,
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }
          
          <div style="margin-top: 8px; text-align: center;">
            <button onclick="window.selectLocation('${location.id}')" style="
              background-color: #2563eb; 
              color: white; 
              border: none; 
              padding: 4px 8px; 
              border-radius: 4px; 
              font-size: 11px; 
              cursor: pointer;
              font-weight: 500;
            ">
              Voir détails
            </button>
          </div>
        </div>
      `

      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: "custom-popup",
      })

      marker.on("click", () => {
        if (onLocationClick) {
          onLocationClick(location)
        }
      })

      markersRef.current.addLayer(marker)
    })

    // Fonction globale pour la sélection depuis le popup
    ;(window as any).selectLocation = (locationId: string) => {
      const location = locations.find((l) => l.id === locationId)
      if (location && onLocationClick) {
        onLocationClick(location)
      }
    }

    // Ajuster la vue pour inclure tous les marqueurs
    if (locations.length > 0) {
      const group = new L.featureGroup(markersRef.current.getLayers())
      if (group.getBounds().isValid()) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] })
      }
    }
  }, [locations, onLocationClick])

  // Fonction utilitaire pour les labels
  const getTypeLabel = (type: string, sousType?: string) => {
    switch (type) {
      case "bureau_national":
        return "Bureau National"
      case "bureau_regional":
        return "Bureau Régional"
      case "bureau_district":
        return "Bureau District"
      case "paroisse":
        return "Paroisse"
      case "oeuvre":
        switch (sousType) {
          case "scolaire":
            return "Œuvre Scolaire"
          case "sante":
            return "Œuvre de Santé"
          case "infrastructure":
            return "Infrastructure"
          case "terrain":
            return "Terrain"
          default:
            return "Œuvre"
        }
      default:
        return "Inconnu"
    }
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""
      />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
      <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js" async />
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      <style jsx>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}</style>
    </>
  )
}
        