"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { X, FileText, Shield, Users, AlertTriangle } from "lucide-react"

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-white border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Conditions d'Utilisation</DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Plateforme GEOEEC - Version 1.0 | Dernière mise à jour : 30 juin 2025
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full w-10 h-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 relative">
          <style jsx>{`
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: #10b981 #f3f4f6;
            }
            
            .custom-scrollbar::-webkit-scrollbar {
              width: 12px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: linear-gradient(to bottom, #f9fafb, #f3f4f6);
              border-radius: 10px;
              margin: 8px 0;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(to bottom, #10b981, #059669);
              border-radius: 10px;
              border: 2px solid #f9fafb;
              transition: all 0.3s ease;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(to bottom, #059669, #047857);
              border-color: #e5e7eb;
              transform: scale(1.1);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:active {
              background: linear-gradient(to bottom, #047857, #065f46);
            }
            
            .custom-scrollbar::-webkit-scrollbar-corner {
              background: #f9fafb;
            }
            
            /* Animation pour la barre de défilement */
            @keyframes scrollbar-appear {
              from {
                opacity: 0;
                transform: scaleY(0.8);
              }
              to {
                opacity: 1;
                transform: scaleY(1);
              }
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              animation: scrollbar-appear 0.3s ease-out;
            }
            
            /* Indicateur de position */
            .scroll-indicator {
              position: absolute;
              top: 0;
              right: 0;
              width: 4px;
              height: 100%;
              background: linear-gradient(to bottom, #e5e7eb, #d1d5db);
              border-radius: 2px;
              z-index: 10;
            }
            
            .scroll-progress {
              width: 100%;
              background: linear-gradient(to bottom, #10b981, #059669);
              border-radius: 2px;
              transition: height 0.1s ease-out;
              box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
            }
          `}</style>

          <div
            className="custom-scrollbar overflow-y-auto h-[60vh] p-6 relative"
            onScroll={(e) => {
              const target = e.target as HTMLDivElement
              const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100
              const progressBar = target.parentElement?.querySelector(".scroll-progress") as HTMLDivElement
              if (progressBar) {
                progressBar.style.height = `${scrollPercentage}%`
              }
            }}
          >
            {/* Indicateur de progression */}
            <div className="scroll-indicator">
              <div className="scroll-progress" style={{ height: "0%" }}></div>
            </div>
        {/* Content */}
          <div className="prose prose-sm max-w-none space-y-6 pr-4">
            {/* Section 1 */}
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">1. Objet et Champ d'Application</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                La plateforme GEOEEC (Géolocalisation des Paroisses et Œuvres EEC) est un système d'information
                géographique destiné à la gestion et à la visualisation des données relatives aux paroisses et œuvres de
                l'Église Évangélique du Cameroun (EEC).
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                L'utilisation de cette plateforme implique l'acceptation pleine et entière des présentes conditions
                d'utilisation.
              </p>
            </div>

            <Separator />

            {/* Section 2 */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-emerald-600" />
                <h3 className="text-lg font-semibold text-gray-900">2. Accès et Niveaux d'Autorisation</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Niveaux d'accès disponibles :</h4>
                <ul className="space-y-2">
                  <li className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>
                      <strong>Administrateur Général :</strong> Accès complet à toutes les fonctionnalités
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>
                      <strong>Administrateur Régional :</strong> Gestion des données de sa région
                    </span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span>
                      <strong>Utilisateur Authentifié :</strong> Consultation et saisie limitée
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <Separator />

            {/* Section 3 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Obligations de l'Utilisateur</h3>
              <div className="space-y-3">
                <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-gray-700">
                    <strong>Confidentialité :</strong> Les utilisateurs s'engagent à maintenir la confidentialité de
                    leurs identifiants de connexion et à ne pas les partager avec des tiers.
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                  <p className="text-gray-700">
                    <strong>Exactitude des données :</strong> Les utilisateurs sont responsables de l'exactitude et de
                    la véracité des informations qu'ils saisissent dans le système.
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg border-l-4 border-purple-400">
                  <p className="text-gray-700">
                    <strong>Usage approprié :</strong> La plateforme doit être utilisée uniquement dans le cadre des
                    activités officielles de l'EEC.
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 4 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Protection des Données</h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Conformément aux réglementations en vigueur sur la protection des données personnelles, l'EEC s'engage à
                :
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>Collecter uniquement les données nécessaires au fonctionnement de la plateforme</li>
                <li>Sécuriser les données contre tout accès non autorisé</li>
                <li>Ne pas céder les données à des tiers sans autorisation explicite</li>
                <li>Permettre aux utilisateurs d'accéder à leurs données personnelles</li>
              </ul>
            </div>

            <Separator />

            {/* Section 5 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Responsabilités et Limitations</h3>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-gray-700 leading-relaxed">
                      L'EEC ne peut être tenue responsable des dommages directs ou indirects résultant de l'utilisation
                      de la plateforme, notamment en cas de :
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700 ml-4">
                      <li>Interruption temporaire du service</li>
                      <li>Perte de données due à des problèmes techniques</li>
                      <li>Usage inapproprié par les utilisateurs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section 6 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Modifications et Évolutions</h3>
              <p className="text-gray-700 leading-relaxed">
                L'EEC se réserve le droit de modifier les présentes conditions d'utilisation à tout moment. Les
                utilisateurs seront informés de toute modification significative et devront accepter les nouvelles
                conditions pour continuer à utiliser la plateforme.
              </p>
            </div>

            <Separator />

            {/* Contact */}
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h3 className="text-lg font-semibold text-emerald-900 mb-3">Contact et Support</h3>
              <p className="text-emerald-800">
                Pour toute question concernant ces conditions d'utilisation ou l'utilisation de la plateforme, veuillez
                contacter l'équipe technique de l'EEC.
              </p>
              <p className="text-emerald-700 mt-2 text-sm">
                <strong>Email :</strong> support.geoeec@eec-congo.org
                <br />
                <strong>Téléphone :</strong> +243 XXX XXX XXX
              </p>
            </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">© 2024 Église Évangélique du Congo (EEC) - Tous droits réservés</p>
            <Button onClick={onClose} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6">
              J'ai lu et compris
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
