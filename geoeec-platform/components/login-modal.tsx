"use client"
import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogIn, User, Lock, Eye, EyeOff, X, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import TermsModal from "./terms-modal"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [showTerms, setShowTerms] = useState(false)
  const router = useRouter()

  const roles = [
    { value: "super_admin", label: "Administrateur Général", color: "text-red-600" },
    { value: "regional_admin", label: "Administrateur Régional", color: "text-blue-600" },
    { value: "authenticated_user", label: "Utilisateur Authentifié", color: "text-emerald-600" },
  ]

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.username) {
      newErrors.username = "Le nom d'utilisateur est requis"
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
    }

    if (!formData.role) {
      newErrors.role = "Veuillez sélectionner un rôle"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const res = await fetch("http://localhost:8000/api/auth/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (res.ok && data.access) {
        // Enregistrement du token JWT
        localStorage.setItem("access_token", data.access)
        localStorage.setItem("refresh_token", data.refresh)
        localStorage.setItem("userRole", formData.role) // optionnel (à remplacer si le backend fournit ce rôle)
        localStorage.setItem("userName", formData.username)

        onClose()
        router.push("/dashboard")
      } else {
        alert(data.detail || "Identifiants incorrects")
      }
    } catch (error) {
      alert("Erreur lors de la connexion")
      console.error(error)
    }

    setIsLoading(false)
  }


  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl p-0 overflow-hidden bg-white border-0 shadow-2xl">
          <div className="flex min-h-[180px]">
            {/* Left Side - Simple Illustration */}
            <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-700 relative overflow-hidden flex items-center justify-center">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-8 left-8 w-16 h-16 bg-white rounded-full animate-pulse"></div>
                <div className="absolute bottom-12 right-12 w-12 h-12 bg-white rounded-full animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-white rounded-full animate-pulse delay-500"></div>
              </div>

              {/* Central Content */}
              <div className="text-center text-white z-10">
                <div className="mb-6">
                  <Image
                    src="/logo.png"
                    alt="GEOEEC Logo"
                    width={80}
                    height={80}
                    className="mx-auto mb-4 rounded-xl bg-white/20 p-3 animate-pulse"
                  />
                </div>
                <h2 className="text-2xl font-bold mb-4">GEOEEC</h2>
                <p className="text-emerald-100 text-sm max-w-48 mx-auto leading-relaxed">
                  Géolocalisation des Paroisses et Œuvres EEC
                </p>

                {/* Simple animated elements */}
                <div className="flex justify-center space-x-4 mt-6">
                  <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce delay-200"></div>
                  <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce delay-400"></div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 bg-white flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Connexion</h3>
                  <p className="text-sm text-gray-600">Accédez à votre espace GEOEEC</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-8 h-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Form */}
              <div className="flex-1 p-4 flex flex-col justify-center">
                <form onSubmit={handleSubmit} className="space-y-2 max-w-[240px] mx-auto w-full">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Nom d'utilisateur
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="username"
                        type="string"
                        placeholder="nom d'utilisateur"
                        value={formData.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        className={`pl-10 h-9 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 ${
                          errors.username ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.username && <p className="text-red-500 text-xs animate-shake">{errors.usernamel}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Mot de Passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={`pl-10 pr-12 h-9 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 ${
                          errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        disabled={isLoading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs animate-shake">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                      Rôle / Fonction
                    </Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange("role", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger
                        className={`h-9 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 transition-all duration-200 ${
                          errors.role ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Sélectionnez votre rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${role.color.replace("text-", "bg-")}`}></div>
                              <span>{role.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-red-500 text-xs animate-shake">{errors.role}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Connexion...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Se Connecter
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        En vous connectant, vous acceptez nos{" "}
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-emerald-600 hover:text-emerald-700 underline font-medium transition-colors duration-200"
                        >
                          conditions d'utilisation
                        </button>
                      </p>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <div className="text-center">
                  <p className="text-xs text-gray-600 mb-2">Niveaux d'accès disponibles</p>
                  <div className="flex justify-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">Administrateur general</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-600">administrateur Régional</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-gray-600">Utilisateur</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    
      {/* Terms Modal */}
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
    </>
  )
}
