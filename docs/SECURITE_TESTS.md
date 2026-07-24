# Fiche de tests de sécurité — GEOEEC

Checklist à exécuter avant chaque mise en production. Adaptée à la stack réelle du
projet : Django 5 + GeoDjango + DRF (backend), Next.js 14 (frontend), PostgreSQL/PostGIS,
GeoServer, Redis, Docker Compose (`docker-compose.prod.yml`).

État : aucun de ces contrôles n'est encore automatisé dans `.github/workflows/ci.yml`
(le CI actuel ne fait que tests + lint informatif). Les commandes ci-dessous sont
prévues pour tourner en local d'abord, puis être ajoutées en CI **en mode informatif**
(`continue-on-error: true`), dans le même esprit que le reste du pipeline, avant de les
rendre bloquantes une fois le bruit initial nettoyé.

Cases à cocher pensées pour être recopiées dans une issue/PR de release.

---

## 1. SAST — analyse statique

- [ ] **Bandit** (Python/Django) :
  ```bash
  cd backend && pip install bandit && bandit -r apps eec_core -x '*/migrations/*,*/tests*'
  ```
- [ ] **Semgrep** (règles génériques + Django/React) :
  ```bash
  semgrep --config auto backend/apps frontend/src
  ```
- [ ] **ESLint security** côté frontend — ajouter `eslint-plugin-security` /
  `eslint-plugin-react` aux devDependencies (absent aujourd'hui de `frontend/package.json`)
  et l'inclure dans `npm run lint`.
- Points d'attention spécifiques au projet :
  - `weasyprint` (export PDF) et `openpyxl` (import Excel) manipulent des fichiers
    uploadés — vérifier l'absence d'injection de template/formule (CSV/Excel formula
    injection sur les exports).
  - Les vues qui filtrent par rôle RBAC (`SUPER/REGION/DISTRICT/PAROISSE`) dans
    `apps/geo`, `apps/oeuvres`, `apps/ouvriers` sont le point le plus sensible du
    projet — cf. section 6.

## 2. SCA — dépendances vulnérables

- [ ] Backend :
  ```bash
  cd backend && pip install pip-audit && pip-audit -r requirements.txt
  ```
- [ ] Frontend :
  ```bash
  cd frontend && npm audit --omit=dev
  ```
- [ ] Images Docker (voir aussi section 9) :
  ```bash
  trivy image geoeec-backend:latest
  trivy image geoeec-frontend:latest
  ```

## 3. Détection de secrets

- [ ] `.env` et `.env.prod.example` sont déjà à la racine — vérifier qu'ils sont bien
  dans `.gitignore` (le `.example` peut rester versionné, pas `.env`) :
  ```bash
  git check-ignore -v .env
  ```
- [ ] Scan de l'historique complet (pas seulement l'état courant) :
  ```bash
  trufflehog git file://. --only-verified
  ```
- [ ] Vérifier qu'aucune clé GeoServer/DB n'est en dur dans `infra/geoserver/` ou
  `docker-compose.prod.yml`.

## 4. DAST — tests dynamiques

- [ ] OWASP ZAP baseline scan sur le frontend et l'API, une fois l'environnement de
  staging démarré :
  ```bash
  docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3004
  docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:8000/api/
  ```
- [ ] Cibler en particulier les endpoints d'écriture (`POST/PUT/PATCH`) sur
  `/api/geo/paroisses/`, `/api/oeuvres/`, `/api/ouvriers/`, et les imports
  (`/api/imports/*`) — ce sont les seuls points d'entrée qui acceptent des fichiers.

## 5. Authentification / gestion de session

- [ ] Confirmer qu'en production `SESSION_COOKIE_SECURE=True` et
  `CSRF_COOKIE_SECURE=True` sont bien actifs (déjà en place dans
  `backend/eec_core/settings/prod.py:20-21` — à revérifier après tout refactor de
  settings).
- [ ] Vérifier que `SECRET_KEY` ne peut pas rester à sa valeur par défaut en prod (déjà
  gardé par le check dans `prod.py:12` — tester que `python manage.py runserver` refuse
  bien de démarrer sans variable d'env).
- [ ] Déconnexion réelle : appeler `/api/auth/logout/` puis rejouer un appel
  authentifié avec le même cookie → doit renvoyer 401/403, pas 200.
- [ ] Vérifier `django-ratelimit` (déjà en dépendance) est bien branché sur
  `/api/auth/login/` — tenter 20 tentatives de login erronées consécutives et
  confirmer un blocage/throttle.
- [ ] Politique de mot de passe : tester la création d'un compte avec mot de passe
  faible (`1234`, `password`) via `/api/auth/users/` et confirmer un rejet.

## 6. Contrôle d'accès (RBAC / IDOR) — priorité haute pour ce projet

Le projet a déjà eu un audit RBAC corrigé (commit `f5db192`) — ces tests servent à
vérifier la non-régression, pas juste une découverte initiale.

- [ ] Pour chacun des 4 rôles (`SUPER`, `REGION`, `DISTRICT`, `PAROISSE`), se connecter
  et tenter :
  - `GET /api/geo/paroisses/<id>/` sur une paroisse **hors** du périmètre géographique
    de l'utilisateur → doit être refusé (403/404), pas juste caché côté frontend.
  - `PATCH`/`DELETE` sur une ressource hors périmètre (paroisse, ouvrier, œuvre) → idem.
  - Changer un ID dans l'URL de façon séquentielle (`/api/ouvriers/1/`, `/2/`, `/3/`...)
    en tant qu'utilisateur `PAROISSE` et vérifier qu'aucune donnée d'une autre paroisse
    n'est renvoyée.
- [ ] `/api/audit/journal/` et `/api/statistiques/` : vérifier qu'un rôle `DISTRICT` ne
  voit que les stats de son district, pas de toute la région/nation.
- [ ] `/api/exports/*` : un export Excel/PDF déclenché par un rôle limité doit être
  filtré côté serveur, pas seulement côté UI (l'endpoint ne doit pas accepter un
  paramètre `region_id`/`district_id` arbitraire en dehors du périmètre).
- [ ] Confirmer que ces contrôles sont dans les vues DRF (`permission_classes` /
  `get_queryset()` filtré), pas seulement dans le frontend Next.js — un test doit
  appeler l'API directement (curl/httpie), pas passer par l'UI.

## 7. Injection

- [ ] SQL : GeoDjango/DRF paramètrent les requêtes par défaut — chercher les usages de
  `.raw()`, `extra()` ou SQL brut :
  ```bash
  grep -rn "\.raw(\|extra(\|cursor.execute" backend/apps
  ```
- [ ] Import Excel (`apps/imports`) : tester l'injection de formule (`=CMD(...)`,
  `=HYPERLINK(...)`) dans une cellule et vérifier qu'elle n'est pas réinjectée telle
  quelle dans un export.
- [ ] GeoServer WMS/WFS : tester l'injection sur les paramètres de filtre CQL
  (`CQL_FILTER`) si l'app les transmet depuis le frontend sans validation.

## 8. Configuration

- [ ] Headers HTTP en environnement de staging/prod :
  ```bash
  curl -sI https://<domaine-prod>/ | grep -i "content-security-policy\|x-frame-options\|strict-transport-security\|x-content-type-options"
  ```
  Le frontend Next.js n'a pas de config `headers()` visible dans `next.config.ts` à ce
  jour — à ajouter (CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- [ ] CORS : confirmer qu'en prod `CORS_ALLOWED_ORIGINS` ne contient que l'URL réelle du
  frontend (déjà le cas dans `prod.py:37` via `FRONTEND_URL` — vérifier qu'aucun `*`
  n'est utilisé).
- [ ] `DEBUG` : vérifier qu'il est bien `False` en prod et qu'une 500 ne fuite pas de
  stacktrace :
  ```bash
  curl -s https://<domaine-prod>/api/route-inexistante/ | grep -i traceback
  ```
- [ ] GeoServer : l'interface admin (`/geoserver/web/`) ne doit pas être exposée
  publiquement en prod, ou doit être derrière une authentification forte — vérifier la
  config nginx dans `infra/nginx/`.

## 9. Infrastructure (Docker)

- [ ] Scanner les images de `docker-compose.prod.yml` :
  ```bash
  trivy image $(docker compose -f docker-compose.prod.yml config --images)
  ```
- [ ] Vérifier qu'aucun conteneur (`backend`, `frontend`, `geoserver`) ne tourne en
  `root` — inspecter `backend/Dockerfile`, `frontend/Dockerfile.prod` pour une
  directive `USER`.
- [ ] Confirmer que les secrets (`SECRET_KEY`, mots de passe DB) sont bien passés par
  variables d'environnement (`.env.prod`, non commité) et jamais copiés en dur dans les
  Dockerfiles ou `docker-compose.prod.yml`.
- [ ] Vérifier qu'aucun port de service interne (PostgreSQL 5432, Redis 6379, GeoServer
  admin) n'est publié sur l'hôte dans `docker-compose.prod.yml` au-delà de ce qui est
  strictement nécessaire.

## 10. Charge / résilience (optionnel)

- [ ] `k6` sur les endpoints les plus coûteux : carte (`/api/geo/paroisses/` avec
  géométries), exports PDF (`weasyprint` est connu pour être lent/gourmand en mémoire).
  ```bash
  k6 run --vus 20 --duration 30s script.js
  ```
- [ ] Vérifier qu'une génération d'export PDF/Excel concurrente ne peut pas être
  déclenchée en boucle sans limite (`django-ratelimit` sur ces endpoints aussi, pas
  seulement le login).

## 11. Pentest global

- [ ] Une fois les points 1 à 10 traités, scénario combiné : utilisateur `PAROISSE`
  tentant d'escalader vers les données d'une autre région via la carte, les exports,
  et l'API directement, dans la même session — c'est le scénario réaliste vu que
  l'app expose des données géolocalisées sensibles par territoire.

---

## Prochaine étape suggérée

Ajouter un job `security` informatif à `.github/workflows/ci.yml` (bandit, pip-audit,
npm audit, trufflehog) sur le même modèle que le lint actuel — bloquant plus tard une
fois la baseline nettoyée. Section 6 (RBAC/IDOR) reste la priorité manuelle vu
l'historique récent du projet sur ce point précis.
