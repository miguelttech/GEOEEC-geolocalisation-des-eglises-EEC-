"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Zap, Clock, Database } from "lucide-react"

interface PerformanceMetrics {
  renderTime: number
  markerCount: number
  clusterCount: number
  memoryUsage: number
  fps: number
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    markerCount: 0,
    clusterCount: 0,
    memoryUsage: 0,
    fps: 60,
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        setMetrics((prev) => ({
          ...prev,
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
        }))
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFPS)
    }

    measureFPS()

    // Mesure de la mémoire (si disponible)
    const measureMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        }))
      }
    }

    const memoryInterval = setInterval(measureMemory, 2000)
    return () => clearInterval(memoryInterval)
  }, [])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[1001]">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-black/80 text-white px-3 py-1 rounded-full text-xs hover:bg-black/90 transition-colors"
        >
          <Activity className="h-3 w-3 inline mr-1" />
          Performance
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[1001]">
      <Card className="bg-black/90 text-white border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Monitor
            </CardTitle>
            <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">
              ×
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Zap className="h-3 w-3 text-yellow-400" />
              </div>
              <div className="font-bold text-yellow-400">{metrics.fps}</div>
              <div className="text-gray-400">FPS</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-3 w-3 text-blue-400" />
              </div>
              <div className="font-bold text-blue-400">{metrics.renderTime}ms</div>
              <div className="text-gray-400">Render</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Database className="h-3 w-3 text-green-400" />
              </div>
              <div className="font-bold text-green-400">{metrics.markerCount}</div>
              <div className="text-gray-400">Markers</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Activity className="h-3 w-3 text-purple-400" />
              </div>
              <div className="font-bold text-purple-400">{metrics.memoryUsage}MB</div>
              <div className="text-gray-400">Memory</div>
            </div>
          </div>

          <div className="mt-2 flex justify-center">
            <Badge
              variant={metrics.fps > 50 ? "default" : metrics.fps > 30 ? "secondary" : "destructive"}
              className="text-xs"
            >
              {metrics.fps > 50 ? "Excellent" : metrics.fps > 30 ? "Bon" : "Lent"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
