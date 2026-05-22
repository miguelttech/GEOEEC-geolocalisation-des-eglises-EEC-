"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import {
  MapPin,
  BarChart3,
  Database,
  MessageSquare,
  Bell,
  User,
  Menu,
  ChevronRight,
  Star,
  Globe,
  Heart,
} from "lucide-react"
import LoginModal from "@/components/login-modal"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [currentStat, setCurrentStat] = useState(0)
  const router = useRouter()
  const [showAlternateBackground, setShowAlternateBackground] = useState(false)

  useEffect(() => {
    setShowAlternateBackground(showLoginModal)
  }, [showLoginModal])

  useEffect(() => {
    setIsVisible(true)

    // Animate stats counter
    const interval = setInterval(() => {
      setCurrentStat((prev) => (prev + 1) % 4)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleVisitorAccess = () => {
    localStorage.setItem("userRole", "visitor")
    localStorage.setItem("userName", "Visiteur")
    router.push("/dashboard")
  }

  const bureauMembers = [
    {
      name: "Rev. BILLA MBENGA ALEXANDRE",
      role: "Président",
      image: "/president.png?height=120&width=120",
    },
    {
      name: "Rev. Dr. NJOUENWET KOPP BERNARD",
      role: "1er Vice-Président",
      image: "/vp.png?height=120&width=120",
    },
    {
      name: "Ancien d’Eglise BAUNI KAMGA",
      role: "2eme Vice-Président",
      image: "/vp2.png?height=120&width=120",
    },    
    {
      name: "Ancien d’Eglise TAMO TATIETSE",
      role: "3eme Vice-Président",
      image: "/vp3.png?height=120&width=120",
    },
    {
      name: "Rev. MEMIAFOH SOBJIO Abestine",
      role: "Secrétaire Générale",
      image: "/se.png?height=120&width=120",
    },
    {
      name: "Rev. MEKAH NYIMI Pierre",
      role: "Secrétaire General Adjoint nº1",
      image: "/se2.png?height=120&width=120",
    },
    {
      name: "Ancien d’Eglise MAKA TOCKO SAMUEL",
      role: "Secrétaire General Adjoint nº2",
      image: "/se3.png?height=120&width=120",
    },
    {
      name: "Ancien d’Eglise FOCHIVE Édouard",
      role: "Trésorier Général",
      image: "/tre.png?height=120&width=120",
    },
    {
      name: " Rev. DJENE Jacques Bruno",
      role: "Trésorier Général Adjoint",
      image: "/se4.png?height=120&width=120",
    },
  ]

  const eecStats = [
    { label: "Paroisses", value: "1129", color: "text-blue-600", icon: <Heart className="h-6 w-6" /> },
    { label: "Régions Synodales", value: "22", color: "text-emerald-600", icon: <Globe className="h-6 w-6" /> },
    { label: "Œuvres", value: "391", color: "text-orange-600", icon: <Star className="h-6 w-6" /> },
    { label: "Ouvriers", value: "716", color: "text-purple-600", icon: <User className="h-6 w-6" /> },
  ]

  const features = [
    {
      icon: <MapPin className="h-12 w-12 text-blue-500" />,
      title: "Carte Interactive",
      description: "Visualisation géographique des paroisses et œuvres",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-emerald-500" />,
      title: "Statistiques",
      description: "Analyses détaillées par région synodale",
      gradient: "from-emerald-500 to-emerald-600",
    },
    {
      icon: <Database className="h-12 w-12 text-orange-500" />,
      title: "Gestion des Données",
      description: "Import et gestion sécurisée des informations",
      gradient: "from-orange-500 to-orange-600",
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-purple-500" />,
      title: "Assistant IA",
      description: "Aide intelligente pour la navigation",
      gradient: "from-purple-500 to-purple-600",
    },
  ]

  return (
    <>
      {!showAlternateBackground ? (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <Image
                      src="/logo.png"
                      alt="GEOEEC Logo"
                      width={40}
                      height={40}
                      className="rounded transition-transform duration-300 hover:scale-110"
                    />
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">GEOEEC</h1>
                      <p className="text-sm text-gray-600">Géolocalisation des Paroisses et Œuvres EEC</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="hover:scale-110 transition-transform duration-200">
                    <Bell className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="hover:scale-110 transition-transform duration-200">
                    <User className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white transform transition-all duration-200 hover:scale-105"
                  >
                    Se Connecter
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section className="bg-white py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 opacity-50"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
              <div
                className={`text-center mb-12 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              >
                <div className="flex justify-center mb-8">
                  <div className="relative">
                    <Image
                      src="/logo.png"
                      alt="Logo EEC"
                      width={120}
                      height={120}
                      className="rounded-2xl shadow-lg animate-pulse"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
                  Plateforme de Géolocalisation des Paroisses et Œuvres
                </h1>
                <h2 className="text-2xl text-gray-700 mb-6 animate-fade-in" style={{ animationDelay: "200ms" }}>
                  Église Évangélique du Cameroun (EEC)
                </h2>
                <p
                  className="text-lg text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in"
                  style={{ animationDelay: "400ms" }}
                >
                  Une solution moderne et complète pour visualiser, analyser et gérer la distribution géographique des
                  paroisses et œuvres de l'EEC à travers une interface cartographique dynamique et interactive.
                </p>
                <div
                  className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in"
                  style={{ animationDelay: "600ms" }}
                >
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    Se Connecter
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button
                    onClick={handleVisitorAccess}
                    variant="outline"
                    size="lg"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-3 transform transition-all duration-300 hover:scale-105"
                  >
                    Accès Visiteur
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* EEC Statistics */}
          <section className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">L'EEC au Cameroun en Chiffres</h3>
                <p className="text-lg text-gray-600">
                  Une présence forte et bien établie sur tout le territoire national
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {eecStats.map((stat, index) => (
                  <Card
                    key={index}
                    className={`bg-white border border-gray-200 shadow-sm transform transition-all duration-500 hover:scale-105 hover:shadow-lg ${
                      currentStat === index ? "ring-2 ring-emerald-500 scale-105" : ""
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="flex justify-center mb-3 text-emerald-500">{stat.icon}</div>
                      <div className={`text-3xl font-bold ${stat.color} mb-2 transition-all duration-300`}>
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Bureau National */}
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Membres du Bureau National</h3>
                <p className="text-lg text-gray-600">Direction et leadership de l'Église Évangélique du Cameroun</p>
              </div>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
  {bureauMembers.map((member, index) => (
    <Card
      key={index}
      className="group bg-white border border-gray-200 shadow-md rounded-2xl transition-all duration-300 ease-in-out hover:scale-[1.03] hover:shadow-2xl hover:bg-emerald-50 animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-6 flex flex-col items-center relative overflow-visible">
        <div className="relative w-28 h-28 mb-6">
        <div className="relative w-28 h-28 mb-6 overflow-visible">
  <Image
    src={member.image || "/placeholder.svg"}
    alt={member.name}
    width={112}
    height={112}
    className="w-28 h-28 rounded-full border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-105"
  />
        </div>

          <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-md animate-pulse"></div>
        </div>

        <div className="text-center">
          <h4 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-emerald-600 transition-colors duration-300">
            {member.name}
          </h4>
          <p className="text-sm text-gray-500 italic">{member.role}</p>
        </div>
      </CardContent>
    </Card>
  ))}
</div>


            </div>
          </section>

          {/* Fonctionnalités */}
          <section className="bg-gray-50 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Fonctionnalités de la Plateforme</h3>
                <p className="text-lg text-gray-600">Des outils modernes pour une gestion efficace</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="bg-white border border-gray-200 shadow-sm transform transition-all duration-500 hover:scale-105 hover:shadow-xl animate-fade-in group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="mb-4 transform transition-transform duration-300 group-hover:scale-110">
                        {feature.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* About EEC */}
          <section className="bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="animate-fade-in">
                  <h3 className="text-3xl font-bold text-gray-900 mb-6">À propos de l'EEC</h3>
                  <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                    L'Église Évangélique du Cameroun (EEC) est une dénomination chrétienne protestante présente sur
                    l'ensemble du territoire camerounais. Fondée sur les valeurs évangéliques, l'EEC œuvre pour
                    l'évangélisation, l'éducation, la santé et le développement social des communautés.
                  </p>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                    Cette plateforme de géolocalisation permet une gestion moderne et efficace de notre présence
                    géographique, facilitant la coordination entre les différentes régions synodales et l'optimisation
                    de nos actions sur le terrain.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Présence dans les 10 régions du Cameroun",
                      "Plus de 500 paroisses actives",
                      "Œuvres sociales, éducatives et sanitaires",
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 animate-slide-in"
                        style={{ animationDelay: `${index * 200}ms` }}
                      >
                        <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></div>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center animate-fade-in" style={{ animationDelay: "300ms" }}>
                  <div className="relative">
                    <Image
                      src="/fiche.png"
                      alt="Logo EEC"
                      width={400}
                      height={350}
                      className="mx-auto rounded-2xl shadow-xl transform transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="animate-fade-in">
                  <div className="flex items-center space-x-3 mb-4">
                    <Image src="/logo.png" alt="GEOEEC Logo" width={40} height={40} className="rounded" />
                    <span className="text-xl font-bold">GEOEEC</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Plateforme officielle de géolocalisation des paroisses et œuvres de l'Église Évangélique du
                    Cameroun.
                  </p>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                  <h4 className="font-bold mb-4">Contact</h4>
                  <div className="space-y-2 text-gray-400">
                    <p>Église Évangélique du Cameroun</p>
                    <p> 13 rue Alfred Saker Douala-Cameroun</p>
                    <p>Tél: +237 6 20 89 89 89</p>
                    <p>Email: contact@eecmr.cm</p>
                  </div>
                </div>
                <div className="animate-fade-in" style={{ animationDelay: "400ms" }}>
                  <h4 className="font-bold mb-4">Liens Utiles</h4>
                  <div className="space-y-2 text-gray-400">
                    <a href="https://www.eecmr.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white cursor-pointer transition-colors duration-200 underline">Site Web EEC</a>
                    <p className="hover:text-white cursor-pointer transition-colors duration-200">Documentation</p>
                    <p className="hover:text-white cursor-pointer transition-colors duration-200">Support Technique</p>
                    <p className="hover:text-white cursor-pointer transition-colors duration-200">
                      Conditions d'Utilisation
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2025 GEOEEC - Église Évangélique du Cameroun. Tous droits réservés.</p>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            {/* Floating circles */}
            <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full animate-float"></div>
            <div className="absolute top-40 right-32 w-24 h-24 bg-white/15 rounded-full animate-float-delayed"></div>
            <div className="absolute bottom-32 left-40 w-20 h-20 bg-white/20 rounded-full animate-float"></div>
            <div className="absolute bottom-20 right-20 w-28 h-28 bg-white/10 rounded-full animate-float-delayed"></div>

            {/* Animated lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
              </defs>
              <path
                d="M0,100 Q150,50 300,100 T600,100"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-draw"
              />
              <path
                d="M100,200 Q250,150 400,200 T700,200"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                fill="none"
                className="animate-draw"
                style={{ animationDelay: "1s" }}
              />
            </svg>

            {/* Geometric shapes */}
            <div
              className="absolute top-1/4 left-1/4 w-16 h-16 border-2 border-white/20 rotate-45 animate-spin"
              style={{ animationDuration: "20s" }}
            ></div>
            <div className="absolute bottom-1/4 right-1/4 w-12 h-12 border-2 border-white/25 rotate-12 animate-pulse"></div>
          </div>

          {/* Central content */}
          <div className="text-center text-white z-10 relative">
            <div className="mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-2xl mx-auto mb-6 flex items-center justify-center backdrop-blur-sm animate-pulse">
                <Image src="/logo.png" alt="GEOEEC Logo" width={48} height={48} className="rounded-lg" />
              </div>
              <h2 className="text-4xl font-bold mb-4 animate-fade-in">GEOEEC Platform</h2>
              <p className="text-xl text-white/90 mb-2 animate-fade-in delay-300">Géolocalisation des Paroisses</p>
              <p className="text-lg text-white/80 animate-fade-in delay-500">Connexion en cours...</p>
            </div>

            {/* Loading animation */}
            <div className="flex justify-center space-x-2 mb-8">
              <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>

            {/* Progress bar */}
            <div className="w-64 h-1 bg-white/20 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-white/60 rounded-full animate-pulse" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
