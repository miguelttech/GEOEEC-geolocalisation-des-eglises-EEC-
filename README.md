# Ancienne version — Plateforme GeoEEC

> **Branche d'archive** — Code source de la première version du projet EEC Géolocalisation (PFE).  
> Cette branche est en lecture seule. Tout développement actif se fait sur `develop`.

---

## Contenu de cette branche

| Dossier | Description |
|---------|-------------|
| `geoeec_backend/` | Backend Django 5.2.1 standalone (sans Docker) |
| `geoeec-platform/` | Frontend Next.js (Pages Router, react-leaflet, shadcn/ui) |

---

## Stack de l'ancienne version

| Couche | Technologie |
|--------|-------------|
| Backend | Django 5.2.1 — sans Docker, sans Redis, sans GeoServer |
| Auth | JWT (djangorestframework-simplejwt) |
| API docs | drf-yasg (Swagger + Redoc) |
| Carte | Leaflet + react-leaflet (GeoJSON statique dans public/) |
| Régions | Fichier GeoJSON statique (`public/geojson_file/`) |
| Chatbot IA | Ollama phi3:mini + LangChain + FAISS |
| Export PDF | xhtml2pdf |
| Frontend | Next.js (Pages Router) |
| UI | shadcn/ui |

## Applications backend

- `paroisses/` — CRUD paroisses
- `oeuvres/` — CRUD œuvres
- `ouvriers/` — CRUD ouvriers
- `users/` — Authentification JWT + 4 rôles
- `cartographie/` — Statistiques + GeoJSON layers
- `statistiques/` — Statistiques avancées + export PDF
- `import_export/` — Import Excel (paroisses, ouvriers, œuvres)
- `export/` — Export PDF/Excel
- `chatbot/` — Chatbot IA (Ollama phi3:mini + LangChain + FAISS)

## Démarrage (ancienne version)

```bash
cd geoeec_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

```bash
cd geoeec-platform
pnpm install
pnpm dev
```

---

> Pour la nouvelle version (Docker, GeoServer, PostGIS, Redis, Sessions) → branche `develop`.
