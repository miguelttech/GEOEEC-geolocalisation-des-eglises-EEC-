import sys, os, pathlib, json

# 1. Accès au dossier du projet
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "geoeec_backend.settings")

import django
django.setup()

# 2. Import des modèles
from oeuvres.models import Oeuvre, Paroisse
from ouvriers.models import Ouvrier

# 3. Dossier d'export
EXPORT_DIR = BASE_DIR / "chatbot" / "export"
EXPORT_DIR.mkdir(parents=True, exist_ok=True)

# 4. Export des œuvres
def export_oeuvres_json():
    data = []
    for oeuvre in Oeuvre.objects.all():
        data.append({
            "nom": oeuvre.nom,
            "type": oeuvre.type,
            "niveau": oeuvre.niveau,
            "paroisse": str(oeuvre.paroisse) if oeuvre.paroisse else "",
            "localisation": str(oeuvre.localisation) if oeuvre.localisation else "",
        })
    with open(EXPORT_DIR / "oeuvres.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# 5. Export des paroisses
def export_paroisses_json():
    data = []
    for p in Paroisse.objects.all():
        data.append({
            "nom": p.nom,
            "quartier": p.quartier,
            "district": str(p.district) if p.district else "",
            "region_synodale": str(p.region_synodale) if p.region_synodale else "",
            "niveau": p.niveau,
            "localisation": str(p.localisation) if p.localisation else "",
            "communiants": p.communiants,
            "non_communiants": p.non_communiants,
        })
    with open(EXPORT_DIR / "paroisses.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# 6. Export des ouvriers
def export_ouvriers_json():
    data = []
    for o in Ouvrier.objects.all():
        data.append({
            "nom": o.nom,
            "grade": o.grade,
            "contact": o.contact,
            "paroisse_nom": str(o.paroisse_nom) if o.paroisse_nom else "",
            "district": str(o.district) if o.district else "",
            "region_synodale": str(o.region_synodale) if o.region_synodale else "",
        })
    with open(EXPORT_DIR / "ouvriers.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# 7. Main
if __name__ == "__main__":
    export_oeuvres_json()
    export_paroisses_json()
    export_ouvriers_json()
    print("✅ Export terminé : fichiers générés dans chatbot/export/")
