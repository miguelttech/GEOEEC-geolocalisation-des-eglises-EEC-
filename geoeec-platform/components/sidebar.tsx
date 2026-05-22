"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  MapPin,
  BarChart3,
  Upload,
  MessageSquare,
  Users,
  Database,
  Lock,
  Home,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface MenuItem {
  name: string
  href: string
  icon: React.ReactNode
  roles: string[]
}

const menuItems: MenuItem[] = [
/*
  {
    name: "Tableau de bord",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
    roles: ["super_admin", "regional_admin", "authenticated_user", "visitor"],
  },
*/
  {
    name: "Carte Interactive",
    href: "/dashboard/map",
    icon: <MapPin className="h-5 w-5" />,
    roles: ["super_admin", "regional_admin", "authenticated_user", "visitor"],
  },
  {
    name: "Statistiques",
    href: "/dashboard/statistics",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["super_admin", "regional_admin", "authenticated_user"],
  },
  {
    name: "Importation",
    href: "/dashboard/import",
    icon: <Upload className="h-5 w-5" />,
    roles: ["super_admin", "regional_admin"],
  },
  {
    name: "Assistant IA",
    href: "/dashboard/chat",
    icon: <MessageSquare className="h-5 w-5" />,
    roles: ["super_admin", "regional_admin", "authenticated_user", "visitor"],
  },
  {
    name: "Gestion Utilisateurs",
    href: "/dashboard/users",
    icon: <Users className="h-5 w-5" />,
    roles: ["super_admin"],
  },
  {
    name: "Gestion Ressources",
    href: "/dashboard/resources",
    icon: <Database className="h-5 w-5" />,
    roles: ["super_admin", "regional_admin"],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState<boolean>(false)
  const [userRole, setUserRole] = useState("")
  const [userName, setUserName] = useState("")

  // Load user data and sidebar state from localStorage
  useEffect(() => {
    setUserRole(localStorage.getItem("userRole") || "")
    setUserName(localStorage.getItem("userName") || "")
    const savedState = localStorage.getItem("sidebarCollapsed")
    if (savedState !== null) {
      setCollapsed(savedState === "true")
    }
  }, [])

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", collapsed.toString())
  }, [collapsed])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      super_admin: "Admin Général",
      regional_admin: "Admin Régional",
      authenticated_user: "Utilisateur",
      visitor: "Visiteur",
    }
    return labels[role as keyof typeof labels] || role
  }

  const hasAccess = (item: MenuItem) => item.roles.includes(userRole)

  return (
    <div
      className={cn(
        "bg-white shadow-md border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="GEOEEC Logo"
              width={40}
              height={40}
              className="rounded transition-all duration-300"
            />
            {!collapsed && (
              <div className="transition-all duration-300">
                <h1 className="text-lg font-bold text-gray-800">GEOEEC</h1>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-800 focus:outline-none transition-transform transform hover:scale-110"
          >
            {collapsed ? "⮞" : "⮜"}
          </button>
        </div>

        {!collapsed && (
          <div className="mt-4 bg-gray-50 p-3 rounded-lg flex items-center gap-3 hover:bg-gray-100 transition">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold animate-bounce">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-600">{getRoleLabel(userRole)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const isActive = pathname === item.href
          const allowed = hasAccess(item)

          return (
            <Link
              key={item.name}
              href={allowed ? item.href : "#"}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                isActive && allowed
                  ? "bg-emerald-100 text-emerald-700 font-semibold"
                  : allowed
                  ? "text-gray-700 hover:bg-gray-100 hover:scale-[1.01]"
                  : "text-gray-400 cursor-not-allowed"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {item.icon}
              <span
                className={cn(
                  "whitespace-nowrap transition-all duration-300",
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}
              >
                {item.name}
              </span>
              {!allowed && !collapsed && (
                <Lock className="ml-auto h-4 w-4 text-gray-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        {!collapsed ? (
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full flex items-center gap-2 text-gray-600 hover:text-red-600 hover:border-red-300 transition hover:scale-105"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </Button>
        ) : (
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="text-red-600 w-full justify-center"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}
