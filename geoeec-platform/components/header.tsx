"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bell,
  User,
  ChevronDown,
  LogOut,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  const [userName, setUserName] = useState("")
  const router = useRouter()

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "")
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push("/")
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="GEOEEC Logo"
              width={36}
              height={36}
              className="rounded shadow-sm"
            />
            <div>
              <h1 className="text-lg font-bold text-emerald-700">GEOEEC</h1>
              <p className="text-xs text-gray-500">
                Géolocalisation des Paroisses et Œuvres
              </p>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-4">
            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-emerald-50 transition px-2"
                >
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-md">
                    {userName.charAt(0).toUpperCase() || "B"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {userName || "visiteur"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:inline" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>
                  Connecté en tant que <br />
                  <span className="font-semibold">{userName || "Visiteur"}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
