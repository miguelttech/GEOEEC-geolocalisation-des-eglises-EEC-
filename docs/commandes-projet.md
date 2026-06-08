# Commandes Projet GEOEEC — Référence complète

> **Stratégie adoptée**
> - **Base de données + Backend + Redis + GeoServer** → Docker (toujours)
> - **Frontend Next.js** → `npm run dev` en local (HMR instantané < 2 s)
> - **Règle absolue** : ne jamais supprimer les volumes Docker → la BD ne sera jamais perdue

---

## Accès aux services

| Service | URL |
|---|---|
| Frontend | http://localhost:3004 |
| Backend API | http://localhost:8000/api |
| GeoServer | http://localhost:8080/geoserver |
| Base de données | localhost:5432 |

---

## SCÉNARIO 1 — Démarrage après redémarrage de la machine

> À faire à chaque allumage du PC, dans cet ordre.

**Terminal 1 — Démarrer BD + Backend + GeoServer (Docker) :**
```powershell
cd d:\Academique\GEOEEC
docker compose up db redis backend geoserver -d
```

**Terminal 2 — Démarrer le Frontend en local :**
```powershell
cd d:\Academique\GEOEEC\frontend
npm run dev
```

Attendre le message `▲ Next.js ready on http://localhost:3004` puis ouvrir le navigateur.

---

## SCÉNARIO 2 — Modification du Frontend uniquement

> Modification d'un composant, page, CSS, ou image.

**Aucune commande nécessaire.** La modification est prise en compte automatiquement par HMR (Hot Module Replacement) en moins de 2 secondes.

**Si le changement ne s'affiche pas :**
```powershell
# Hard refresh dans le navigateur
# Raccourci : Ctrl + Shift + R
```

**Si les images Next.js ne se mettent pas à jour :**
```powershell
cd d:\Academique\GEOEEC\frontend
Remove-Item -Recurse -Force .next\cache\images
# Puis Ctrl + Shift + R dans le navigateur
```

**Si le serveur npm plante ou ne répond plus :**
```powershell
# Dans le terminal du frontend : Ctrl + C, puis :
cd d:\Academique\GEOEEC\frontend
npm run dev
```

---

## SCÉNARIO 3 — Modification du Backend uniquement

> Modification d'un fichier Python (views, serializers, urls, permissions…)

**Aucune commande nécessaire.** `runserver` Django recharge automatiquement les fichiers Python modifiés.

**Si le rechargement ne se fait pas :**
```powershell
cd d:\Academique\GEOEEC
docker compose restart backend
```

---

## SCÉNARIO 4 — Modification des modèles Django (Base de données)

> Ajout/modification d'un champ, d'un modèle, ou d'une contrainte.

```powershell
cd d:\Academique\GEOEEC

# Étape 1 : Générer la migration
docker exec eec_backend_dev python manage.py makemigrations

# Étape 2 : Appliquer la migration
docker exec eec_backend_dev python manage.py migrate
```

**Vérifier l'état des migrations :**
```powershell
docker exec eec_backend_dev python manage.py showmigrations
```

---

## SCÉNARIO 5 — Modification du Dockerfile ou de requirements.txt

> Ajout d'une dépendance Python, modification du Dockerfile backend.

```powershell
cd d:\Academique\GEOEEC

# 1. S'assurer que la BD tourne déjà
docker compose up db redis -d

# 2. Rebuild de l'image backend SANS toucher les volumes
docker compose build backend

# 3. Relancer le backend avec la nouvelle image
docker compose up backend -d
```

---

## SCÉNARIO 6 — Modification de tout (front + back + migrations)

```powershell
cd d:\Academique\GEOEEC

# 1. Relancer les services Docker
docker compose restart backend

# 2. Appliquer les migrations si nécessaire
docker exec eec_backend_dev python manage.py migrate

# 3. Redémarrer le frontend local si besoin (Ctrl+C puis) :
cd frontend
npm run dev
```

---

## SCÉNARIO 7 — Libérer l'espace Docker (AppData) SANS perdre la BD

> Les images Docker s'accumulent dans C:\Users\...\AppData\Local\Docker
> Ces commandes nettoient UNIQUEMENT les ressources inutilisées.

**Nettoyage léger — images non taguées seulement :**
```powershell
docker image prune -f
```

**Nettoyage standard — conteneurs arrêtés + images sans tag :**
```powershell
docker system prune -f
```

**Nettoyage approfondi — images non utilisées par aucun conteneur actif :**
```powershell
# Vérifier d'abord que les conteneurs essentiels tournent
docker ps

# Puis nettoyer les images inutilisées
docker image prune -a -f
```

**Vérifier l'espace libéré :**
```powershell
docker system df
```

---

## SCÉNARIO 8 — Arrêt propre (fin de journée)

```powershell
cd d:\Academique\GEOEEC

# Arrêter le frontend : Ctrl+C dans son terminal

# Arrêter tous les conteneurs Docker SANS supprimer les données
docker compose stop
```

---

## COMMANDES DE VÉRIFICATION

**Voir les conteneurs actifs :**
```powershell
docker ps
```

**Voir les logs du backend en temps réel :**
```powershell
docker logs eec_backend_dev -f
```

**Vérifier que la BD est accessible :**
```powershell
docker exec eec_db_dev pg_isready
```

**Voir les volumes existants (ne jamais supprimer pg_data) :**
```powershell
docker volume ls
```

**Voir l'espace occupé par Docker :**
```powershell
docker system df -v
```

---

## ⛔ COMMANDES INTERDITES — Suppriment la Base de Données

Ces commandes détruisent toutes les données PostgreSQL de façon irréversible.
**Ne jamais les exécuter.**

```powershell
# INTERDIT — supprime tous les volumes dont pg_data
docker compose down -v

# INTERDIT — supprime le volume pg_data directement
docker volume rm geoeec_pg_data

# INTERDIT — supprime tout Docker y compris les volumes
docker system prune -a --volumes
docker system prune --volumes
```

---

## RÉSUMÉ RAPIDE

| Situation | Commande |
|---|---|
| Allumer le PC | `docker compose up db redis backend geoserver -d` puis `npm run dev` |
| Modif frontend | Rien — HMR automatique |
| Modif backend Python | Rien — auto-reload Django |
| Nouvelle migration | `docker exec eec_backend_dev python manage.py migrate` |
| Rebuild backend | `docker compose build backend && docker compose up backend -d` |
| Fin de journée | `docker compose stop` (+ Ctrl+C sur le frontend) |
| Libérer espace | `docker system prune -f` |
| Voir les conteneurs | `docker ps` |
