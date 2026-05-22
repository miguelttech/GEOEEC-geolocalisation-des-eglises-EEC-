"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Shield,
  MapPin,
  Mail,
  Filter,
  UserCheck,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

interface User {
  id: number
  username: string
  email: string
  role: string
  region_synodale: string
  status: "active" | "inactive"
  lastLogin: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy, setSortBy] = useState<"username" | "email" | "role" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    role: "",
    region_synodale: "",
    password: "",
  })

  const roles = [
    {
      value: "admin_general",
      label: "Administrateur Général",
      color: "bg-rose-50 text-rose-700 border-rose-200",
      icon: Crown,
      description: "Accès complet au système",
    },
    {
      value: "admin_regional",
      label: "Administrateur Régional",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: Shield,
      description: "Gestion d'une région spécifique",
    },
    {
      value: "utilisateur_auth",
      label: "Utilisateur Authentifié",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: UserCheck,
      description: "Accès en lecture seule",
    },
  ]

  // Obtenir toutes les régions uniques des utilisateurs existants
  const uniqueRegions = useMemo(() => {
    const regions = users
      .map((user) => user.region_synodale)
      .filter((region) => region && region.trim() !== "")
      .filter((region, index, self) => self.indexOf(region) === index)
      .sort()
    return regions
  }, [users])

  // Filtrage et tri des utilisateurs avec useMemo pour optimiser les performances
  const filteredAndSortedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesSearch =
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.region_synodale.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesRegion =
        regionFilter === "" || (user.region_synodale && user.region_synodale.toLowerCase().includes(regionFilter.toLowerCase()))

      return matchesSearch && matchesRole && matchesRegion
    })

    // Tri
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
      }
      if (typeof bValue === "string") {
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [users, searchTerm, roleFilter, regionFilter, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentUsers = filteredAndSortedUsers.slice(startIndex, endIndex)

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, regionFilter])

  const getRoleInfo = (role: string) => {
    return (
      roles.find((r) => r.value === role) || {
        label: role,
        color: "bg-gray-50 text-gray-700 border-gray-200",
        icon: Users,
        description: "",
      }
    )
  }

  const handleAddUser = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("http://localhost:8000/api/api/register/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) throw new Error("Erreur lors de l'ajout de l'utilisateur")

      const createdUser = await response.json()
      setUsers((prev) => [...prev, createdUser])
      setNewUser({ username: "", email: "", role: "", region_synodale: "", password: "" })
      setIsAddModalOpen(false)
      toast.success("Utilisateur ajouté avec succès!")
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'utilisateur :", error)
      toast.error("Erreur lors de l'ajout de l'utilisateur")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return

    try {
      const response = await fetch(`http://localhost:8000/api/api/users/${userId}/`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Erreur lors de la suppression")

      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast.success("Utilisateur supprimé avec succès!")
    } catch (error) {
      console.error("Erreur lors de la suppression :", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    setRegionFilter("")
    setCurrentPage(1)
  }

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/api/api/users/")
      if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs")
      const data = await response.json()
      setUsers(data)
      toast.success("Données actualisées!")
    } catch (error) {
      console.error("Erreur lors du refresh :", error)
      toast.error("Erreur lors de l'actualisation")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/api/users/")
        if (!response.ok) throw new Error("Erreur lors de la récupération des utilisateurs")
        const data = await response.json()
        setUsers(data)
      } catch (error) {
        console.error("Erreur lors du fetch des utilisateurs :", error)
        toast.error("Erreur lors du chargement des utilisateurs")
      } finally {
        setIsLoading(false)
      }
    }
    fetchUsers()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 text-sm">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Gestion des Utilisateurs</h1>
            <p className="text-sm text-gray-600 mt-1">
              Gérez les accès et permissions des utilisateurs de la plateforme GEOEEC
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="border-gray-200 hover:bg-gray-50 bg-transparent"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Utilisateur
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Ajouter un Utilisateur</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">
                      Nom d'utilisateur
                    </Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
                      placeholder="Nom complet"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemple.com"
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Rôle
                    </Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => {
                        setNewUser((prev) => ({
                          ...prev,
                          role: value,
                          // Reset region when role changes
                          region_synodale: value === "admin_regional" ? prev.region_synodale : "",
                        }))
                      }}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const Icon = role.icon
                          return (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <span className="text-sm">{role.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                      className="text-sm"
                    />
                  </div>
                  {newUser.role === "admin_regional" && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="region" className="text-sm font-medium">
                        Région synodale
                      </Label>
                      <Input
                        id="region_synodale"
                        value={newUser.region_synodale}
                        onChange={(e) => setNewUser((prev) => ({ ...prev, region_synodale: e.target.value }))}
                        placeholder="Saisissez la région synodale"
                        className="text-sm"
                      />
                
                    </div>
                  )}
                  <div className="flex space-x-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddModalOpen(false)
                        setNewUser({ username: "", email: "", role: "", region_synodale: "", password: "" })
                      }}
                      className="flex-1 text-sm"
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleAddUser}
                      disabled={
                        !newUser.username ||
                        !newUser.email ||
                        !newUser.role ||
                        !newUser.password ||
                        (newUser.role === "admin_regional" && !newUser.region_synodale.trim()) ||
                        isSubmitting
                      }
                      className="flex-1 bg-green-500 hover:bg-green-600 text-sm"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>Ajout...</span>
                        </div>
                      ) : (
                        "Ajouter"
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">{users.length}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Utilisateurs</div>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {users.filter((u) => u.role === "admin_general").length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Administrateurs</div>
                </div>
                <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Crown className="h-5 w-5 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {users.filter((u) => u.role === "admin_regional").length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Régionaux</div>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {users.filter((u) => u.role === "utilisateur_auth").length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">Utilisateurs</div>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-base font-medium">
                <Filter className="h-4 w-4 text-gray-500" />
                <span>Filtres</span>
              </CardTitle>
              {(searchTerm || roleFilter !== "all" || regionFilter !== "") && (
                <Button onClick={clearFilters} variant="outline" size="sm" className="text-xs bg-transparent">
                  <X className="h-3 w-3 mr-1" />
                  Effacer
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Rechercher</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Rôle</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {roles.map((role) => {
                      const Icon = role.icon
                      return (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4" />
                            <span className="text-sm">{role.label}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">Région</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filtrer par région synodale..."
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>
                {uniqueRegions.length > 0 && regionFilter === "" && (
                  <div className="text-xs text-gray-500">
                    Régions disponibles: {uniqueRegions.slice(0, 3).join(", ")}
                    {uniqueRegions.length > 3 && ` et ${uniqueRegions.length - 3} autres`}
                  </div>
                )}
              </div>
            </div>
            {(searchTerm || roleFilter !== "all" || regionFilter !== "") && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">{filteredAndSortedUsers.length}</span> utilisateur(s) trouvé(s) sur{" "}
                  <span className="font-medium">{users.length}</span> au total
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Liste des Utilisateurs ({filteredAndSortedUsers.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger className="w-16 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-600">par page</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setSortBy("username")
                          setSortOrder(sortBy === "username" && sortOrder === "asc" ? "desc" : "asc")
                        }}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Nom</span>
                        {sortBy === "username" && (
                          <span className="text-blue-600">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setSortBy("email")
                          setSortOrder(sortBy === "email" && sortOrder === "asc" ? "desc" : "asc")
                        }}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Email</span>
                        {sortBy === "email" && <span className="text-blue-600">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <button
                        onClick={() => {
                          setSortBy("role")
                          setSortOrder(sortBy === "role" && sortOrder === "asc" ? "desc" : "asc")
                        }}
                        className="flex items-center space-x-1 hover:text-gray-700"
                      >
                        <span>Rôle</span>
                        {sortBy === "role" && <span className="text-blue-600">{sortOrder === "asc" ? "↑" : "↓"}</span>}
                      </button>
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Région
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsers.map((user) => {
                    const roleInfo = getRoleInfo(user.role)
                    const RoleIcon = roleInfo.icon
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${roleInfo.color} text-xs font-medium px-2 py-1 border`}>
                            <RoleIcon className="h-3 w-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.region_synodale ? (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.region_synodale}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-blue-50 border-blue-200 h-8 w-8 p-0 bg-transparent"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:bg-red-50 border-red-200 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {currentUsers.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Aucun utilisateur trouvé</p>
                  <p className="text-xs text-gray-400 mt-1">Essayez de modifier vos critères de recherche</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  Affichage de <span className="font-medium">{startIndex + 1}</span> à{" "}
                  <span className="font-medium">{Math.min(endIndex, filteredAndSortedUsers.length)}</span> sur{" "}
                  <span className="font-medium">{filteredAndSortedUsers.length}</span> utilisateurs
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`h-8 w-8 p-0 text-xs ${
                            currentPage === pageNumber ? "bg-green-600 text-white hover:bg-green-700" : ""
                          }`}
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
