"use client"

import { useState, useEffect, useCallback } from "react"

interface PerformanceMetrics {
  renderTime: number
  markerCount: number
  clusterCount: number
  memoryUsage: number
  fps: number
  lastUpdate: number
}

export function useMapPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    markerCount: 0,
    clusterCount: 0,
    memoryUsage: 0,
    fps: 60,
    lastUpdate: Date.now(),
  })

  const [isMonitoring, setIsMonitoring] = useState(false)

  // Mesure du temps de rendu
  const measureRenderTime = useCallback((startTime: number) => {
    const endTime = performance.now()
    const renderTime = Math.round(endTime - startTime)

    setMetrics((prev) => ({
      ...prev,
      renderTime,
      lastUpdate: Date.now(),
    }))
  }, [])

  // Mise à jour du nombre de marqueurs
  const updateMarkerCount = useCallback((count: number, clusterCount = 0) => {
    setMetrics((prev) => ({
      ...prev,
      markerCount: count,
      clusterCount,
      lastUpdate: Date.now(),
    }))
  }, [])

  // Monitoring FPS
  useEffect(() => {
    if (!isMonitoring) return

    let frameCount = 0
    let lastTime = performance.now()
    let animationId: number

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        setMetrics((prev) => ({
          ...prev,
          fps,
          lastUpdate: Date.now(),
        }))
        frameCount = 0
        lastTime = currentTime
      }

      animationId = requestAnimationFrame(measureFPS)
    }

    animationId = requestAnimationFrame(measureFPS)

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isMonitoring])

  // Monitoring mémoire
  useEffect(() => {
    if (!isMonitoring) return

    const measureMemory = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory
        setMetrics((prev) => ({
          ...prev,
          memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          lastUpdate: Date.now(),
        }))
      }
    }

    const memoryInterval = setInterval(measureMemory, 2000)
    return () => clearInterval(memoryInterval)
  }, [isMonitoring])

  return {
    metrics,
    measureRenderTime,
    updateMarkerCount,
    startMonitoring: () => setIsMonitoring(true),
    stopMonitoring: () => setIsMonitoring(false),
    isMonitoring,
  }
}
