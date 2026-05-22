"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Sparkles, MapPin, Building, Users } from "lucide-react"

export default function Loading() {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const loadingSteps = [
    { icon: Building, text: "Chargement des paroisses...", color: "text-emerald-500" },
    { icon: Users, text: "Synchronisation des ouvriers...", color: "text-blue-500" },
    { icon: MapPin, text: "Géolocalisation des œuvres...", color: "text-purple-500" },
    { icon: Sparkles, text: "Finalisation...", color: "text-yellow-500" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100
        const newProgress = prev + Math.random() * 15
        return Math.min(newProgress, 100)
      })
    }, 200)

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length)
    }, 1500)

    return () => {
      clearInterval(interval)
      clearInterval(stepInterval)
    }
  }, [])

  const CurrentIcon = loadingSteps[currentStep].icon

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center z-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-emerald-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-32 right-32 w-24 h-24 bg-blue-500 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-purple-500 rounded-full animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-yellow-500 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-pink-500 rounded-full animate-pulse delay-300"></div>
      </div>

      {/* Main Loading Container */}
      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        {/* Logo Container with Premium Effects */}
        <div className="relative mb-8">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full blur-2xl opacity-30 animate-pulse scale-150"></div>

          {/* Rotating Ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 border-r-blue-500 rounded-full animate-spin"></div>

          {/* Logo */}
          <div className="relative bg-white rounded-full p-6 shadow-2xl border border-gray-100">
            <Image src="/logo.png" alt="GEOEEC Logo" width={80} height={80} className="mx-auto animate-pulse" />
          </div>

          {/* Floating Particles */}
          <div className="absolute -top-4 -left-4 w-3 h-3 bg-emerald-400 rounded-full animate-bounce"></div>
          <div className="absolute -top-2 -right-6 w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
          <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-purple-400 rounded-full animate-bounce delay-400"></div>
          <div className="absolute -bottom-2 -left-6 w-2 h-2 bg-yellow-400 rounded-full animate-bounce delay-600"></div>
        </div>

        {/* Brand Name with Gradient */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            GEOEEC
          </h1>
          <p className="text-gray-600 text-lg font-medium">Géolocalisation des Paroisses et Œuvres EEC</p>
        </div>

        {/* Progress Bar Container */}
        <div className="mb-8">
          <div className="relative bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse"></div>

            {/* Progress Fill */}
            <div
              className="relative h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full transition-all duration-300 ease-out shadow-lg"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="flex justify-between items-center mt-3">
            <span className="text-sm text-gray-500 font-medium">{Math.round(progress)}%</span>
            <span className="text-sm text-gray-500 font-medium">Chargement en cours...</span>
          </div>
        </div>

        {/* Current Step Indicator */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-100">
          <div className="flex items-center justify-center space-x-4">
            {/* Animated Icon */}
            <div className="relative">
              <div
                className={`p-3 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 ${loadingSteps[currentStep].color}`}
              >
                <CurrentIcon className="h-6 w-6 animate-pulse" />
              </div>

              {/* Icon Glow */}
              <div
                className={`absolute inset-0 rounded-full blur-lg opacity-50 ${loadingSteps[currentStep].color.replace("text-", "bg-")} animate-pulse`}
              ></div>
            </div>

            {/* Step Text */}
            <div className="text-left">
              <p className="text-gray-900 font-semibold text-lg">{loadingSteps[currentStep].text}</p>
              <p className="text-gray-500 text-sm">Veuillez patienter quelques instants</p>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex justify-center space-x-2 mt-6">
            {loadingSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep ? "bg-gradient-to-r from-emerald-500 to-blue-500 scale-125" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Premium Loading Dots */}
        <div className="flex justify-center space-x-2 mt-8">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce delay-200"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce delay-300"></div>
        </div>

        {/* Subtle Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 font-medium">© 2024 Église Évangélique du Congo (EEC)</p>
        </div>
      </div>

      {/* Additional Floating Elements */}
      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
      <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-500"></div>
      <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-1000"></div>
    </div>
  )
}
