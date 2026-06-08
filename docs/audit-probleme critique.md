J'ai maintenant lu l'ensemble du projet en profondeur. Voici l'audit critique complet.

AUDIT CRITIQUE — Plateforme EEC Géolocalisation
État au 29 mai 2026
I. VERDICT GLOBAL
Le projet est dans un état avancé sur la forme, mais non connecté sur le fond. L'interface admin est visuellement riche et bien structurée. Le backend est architecturalement solide. Mais les deux ne se parlent pas encore — tout le front-end tourne sur des données fictives. Avant de viser la connexion front↔back, plusieurs incohérences structurelles doivent être corrigées.

II. INCOHÉRENCES CRITIQUES (bloquantes)
1. Préfixe API incorrect dans Docker Compose
La variable d'environnement définie dans docker-compose.yml:93 est :


NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
Mais le backend dans eec_core/urls.py:106 monte tout à /api/ :


path("api/", include(router.urls)),
path("api/auth/", include(auth_patterns)),
Il n'existe pas de préfixe /v1/ dans le backend. Toutes les routes réelles sont /api/geo/regions/, /api/auth/login/, etc. Si le frontend utilise l'env var pour construire ses URLs, chaque appel API retournera un 404.

2. Le login utilise des URLs relatives qui pointent vers le mauvais serveur
Dans login/page.tsx:41 :


fetch('/api/auth/login/', { ... })
Cette URL relative se résout vers http://localhost:3004/api/auth/login/ — le serveur Next.js, pas Django. Sans proxy configuré dans next.config.ts, cette requête ne peut jamais atteindre le backend. Il en va de même pour /api/auth/csrf/ à la ligne 25.

3. Le modèle Paroisse n'a pas de champ niveau
Dans geo/models.py, le modèle Paroisse ne contient aucun champ niveau. Pourtant :

Le front-end affiche et filtre par PAROISSE / STATION / ANNEXE dans toutes les pages admin
La commande import_paroisses.py lit une colonne "Niveau" dans l'Excel
Les vues filtrent par niveau (geo/views.py:118 : qs = qs.filter(niveau=niveau))
Les sérialiseurs renverront une erreur car le champ n'existe pas
C'est un bug silencieux qui cassera l'import et les filtres API.

4. SESSION_COOKIE_SAMESITE = "Strict" bloque les échanges front↔back
Dans settings/base.py:148 :


SESSION_COOKIE_SAMESITE = "Strict"
Le frontend tourne sur le port 3004 et le backend sur le port 8000 — deux origines différentes. Avec SameSite=Strict, le navigateur refuse d'envoyer le cookie de session sur toute requête cross-origin. Le dev.py ne redéfinit pas ce paramètre. Résultat : même si la connexion réussit et qu'un cookie est créé, il ne sera jamais envoyé sur les appels API suivants. Il faut SESSION_COOKIE_SAMESITE = "Lax" en dev.

5. L'app visitors n'est pas migrée
Le dossier backend/apps/visitors/migrations/ ne contient que __init__.py — aucun fichier 0001_initial.py. Les cinq modèles (ProfilVisiteur, ParoisseVue, RechercheHistorique, ItinerairePersonnel, ParoisseEnregistree) n'existent pas en base. Les endpoints importés depuis apps.visitors.urls dans le fichier principal d'URLs causeront des erreurs si on tente d'y accéder.

III. INCOHÉRENCES MAJEURES (fonctionnelles)
6. Tout le front-end tourne sur des données fictives
Aucune page admin ne consomme le backend. Sans exception :

dashboard/page.tsx : importe sampleParoisses, topRegions, fidelesEvolution depuis data.ts
paroisses/page.tsx : filtre sampleParoisses localement
La carte EECMapApp.tsx et EECApp.tsx importent depuis @/lib/eec-data.ts
Les chiffres affichés ("553 paroisses", "22 régions", "147 832 fidèles") sont tous en dur dans le code.

7. Les régions dans eec-data.ts sont totalement différentes de la vraie base
Le fichier eec-data.ts invente 22 régions avec des noms géographiques : "Région Synodale de Douala", "Région Synodale de Yaoundé", etc.

Les vraies régions EEC en base sont : "ADAMAOUA", "BAMBOUTOS ET NORD OUEST", "CENTRE SUD 1", "MOUNGO SUD ET MEME", etc. Noms, IDs, coordonnées — tout est fictif dans le mock. La carte publique afficherait actuellement des données inventées.

8. Le middleware désactive l'authentification en développement
Dans middleware.ts:14-16 :


if (process.env.NODE_ENV === 'development') {
  return NextResponse.next();
}
Toutes les routes /admin/* sont librement accessibles en dev, sans session. Conséquence : les pages admin chargent mais ne peuvent pas appeler le backend (session absente → 403 sur chaque endpoint authentifié), ce qui renforce l'usage des données mock. Ce bypass masque complètement les problèmes d'intégration.

9. Les actions UI ne font rien côté serveur
Dans la page paroisses, les boutons suivants ne font qu'afficher un toast ou fermer un panel :

"Importer Excel" → addToast(...) seulement, pas de fetch
"Exporter tout" → toast seulement
"Créer une paroisse" → ferme le formulaire sans appel API
"Modifier" → toast "Modifications enregistrées" sans fetch
"Supprimer" → la DeleteModal onConfirm n'appelle aucune API, juste un toast
Les boutons "Valider" / "Rejeter" → toasts seulement
10. Le formulaire paroisse n'a pas de carte GPS fonctionnelle
L'onglet "Localisation GPS" dans le formulaire affiche un div statique avec le texte "Aperçu carte — disponible après saisie des coordonnées". Il n'y a ni Leaflet, ni carte interactive pour placer un point. C'est le composant le plus critique pour le cahier des charges ("saisie GPS sur la carte").

11. Fonctionnalités inexistantes côté backend
Ces éléments visibles dans l'UI n'ont pas d'endpoint backend :

Réinitialisation de mot de passe (/auth/mot-de-passe-oublie) — aucun endpoint côté Django
Inscription visiteur (/register) — create_user exige IsAuthenticated
SSO synodal — bouton décoratif, aucune implémentation
Upload de photos — le modèle Paroisse n'a aucun champ photo ; pas d'endpoint upload
"Connexion via SSO synodal" — fonctionnalité fantôme
IV. ÉTAT DE LA BASE DE DONNÉES
Migrations appliquées (certaines) :

✅ accounts (User, StatistiqueAnnuelle, scope fields)
✅ geo (RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire, HistoriquePosition)
✅ oeuvres (TypeOeuvre, Oeuvre + district/region FK)
✅ ouvriers (Grade, Ouvrier)
✅ audit (LogActivite)
❌ visitors — jamais migrée (aucun fichier 0001_initial.py)
Données importées : Impossible à déterminer depuis le code seul. Les commandes d'import existent et sont bien écrites (import_regions, import_paroisses, import_ouvriers, import_oeuvres, import_grades, import_statistiques), mais leur exécution n'est pas traçable sans accéder à la base. La roadmap prévoie cela aux jours 3-4, soit 23-24 mai.

Problème structurel de la base : Le modèle Paroisse ne stocker ni niveau, ni communiants, ni non_communiants (les deux derniers sont dans StatistiqueAnnuelle). Quand le frontend demandera /api/geo/paroisses/, la réponse n'inclura pas ces champs. Il manque au minimum le champ niveau.

V. CE QUI FONCTIONNE BIEN
Backend :

Architecture RBAC propre et complète (SUPER/REGION/DISTRICT/PAROISSE)
Tous les ViewSets avec filtres, pagination, CRUD
Exports Excel et PDF fonctionnels côté serveur
Import Excel via API avec validation RBAC
Journal d'audit (LogActivite) branché sur les actions importantes
dashboard_stats qui fait de vraies requêtes SQL avec scope
top_paroisses, performance_regions avec agrégations correctes
Gestion utilisateurs (CRUD, toggle_active, reset_password)
import_paroisses.py gère correctement l'inversion Coord_x/Coord_y et la table de correspondance des 5 noms de régions
Frontend :

UI admin visuellement excellente avec 4 layouts (general/regional/district/paroisse)
Composants atomiques réutilisables (atoms.tsx, icons.tsx)
Page de login bien faite (CSRF, shake animation, error handling)
Carte Leaflet EECMapApp avec clustering, filtres, panneau latéral
Middleware prêt à être activé (juste retirer le bypass dev)
VI. PRIORITÉS POUR LA PHASE DE CONNEXION
Voici l'ordre de travail recommandé avant toute autre chose :

Ajouter niveau au modèle Paroisse + migration → makemigrations geo → migrate
Créer la migration visitors → makemigrations visitors → migrate
Corriger le préfixe API : supprimer /v1 du docker-compose OU ajouter /api/v1/ dans urls.py
Ajouter proxy Next.js dans next.config.ts pour rediriger /api/* vers http://backend:8000/api/*
Changer SESSION_COOKIE_SAMESITE = "Lax" dans dev.py
Retirer le bypass dev dans middleware.ts
Remplacer les données mock par des useEffect + fetch(NEXT_PUBLIC_API_URL + ...) dans les pages admin
Implémenter la carte GPS dans le formulaire paroisse (MiniLeafletMap déjà existant dans admin)
Ces 8 points sont la condition sine qua non pour que le front et le back communiquent de manière persistante.