# -*- coding: utf-8 -*-
"""
Intégration des catégories officielles (résolution R05/CSG juillet 2024).

Étapes :
  1. Fusion des VRAIS doublons de paroisses (même nom normalisé + même région) :
     - on garde l'enregistrement avec GPS (sinon le plus ancien),
     - on choisit le nom le plus « propre » (sans préfixe « Paroisse de »/« EEC »,
       casse correcte),
     - toutes les références (stats, ouvriers, œuvres, favoris…) sont réassignées.
  2. Attribution des catégories aux paroisses existantes (exact puis approché,
     avec la région du docx « par région » pour départager les homonymes).
  3. Création des paroisses catégorisées absentes de la BD (sans GPS),
     rattachées à un district « NON PRÉCISÉ » de leur région.

Usage :  python integrate_categories.py [--apply]
         (sans --apply : simulation, AUCUNE écriture)
"""
import difflib
import json
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
import django  # noqa: E402

django.setup()

from django.db import transaction                                   # noqa: E402
from apps.geo.models import Paroisse, District, RegionSynodale      # noqa: E402

APPLY = "--apply" in sys.argv
D = "/app/data_audit/"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode()
    s = s.lower()
    s = re.sub(r"\bparoisse( de| du| d')?\b", " ", s)
    s = re.sub(r"\beec\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", " ", s)
    return " ".join(s.split())


def norm_region(s: str) -> str:
    """Normalise les variantes de noms de régions synodales."""
    n = norm(s).replace("&", "et")
    n = re.sub(r"\bregion synodale (de la|de l|du|des|de)?\b", " ", n)
    n = n.replace(" et ", " ").replace("  ", " ")
    return " ".join(sorted(n.split()))          # insensible à l'ordre des mots


def name_quality(nom: str) -> int:
    """Score de « propreté » d'un nom (plus haut = meilleur)."""
    score = 0
    if not re.search(r"(?i)\bparoisse\b", nom):
        score += 4                # sans préfixe administratif
    if not re.search(r"(?i)\beec\b", nom):
        score += 3
    if not nom.isupper() and not nom.islower():
        score += 2                # casse mixte correcte (« Bafou Fodzong »)
    if "(" not in nom:
        score += 1
    return score


# ═══════════════════ Chargement des sources ═══════════════════
cat1 = json.load(open(D + "out_cat1.json", encoding="utf-8"))
cat2 = json.load(open(D + "out_cat2.json", encoding="utf-8"))
AB = {
    "A++": ["Cinquantenaire", "Messa - Mokolo", "Biyem-Assi", "Nlongkak"],
    "A1": ["Bonamunduru", "Briqueterie 1", "Briqueterie 2", "Essos", "Mont des Oliviers",
           "New-Bell Aviation", "New-Deido", "Njimbam- Foumbot", "Bonabéri", "Bonatéki",
           "Centenaire (Act Fr)", "Company", "Melen", "Soboum", "Grand Temple", "Rue Manguiers"],
    "A2": ["Bafoussam Plateau", "Centre Martin Luther", "Maképè Tonnere", "Tamdja"],
    "B1": ["Bafang II", "Bamendzi A", "Bodomo", "Cité – Palmiers", "Koupgouo", "Messassi",
           "Ngousso Essesselakok", "Nkoldongo II", "Nkoldongo I", "Nkozoa", "Nsam Efoulan",
           "Nzintia", "Oyom Abang", "Tchitchap", "Tialong", "Toket"],
    "B2": ["Famgo", "Nkomo"],
}
C_TABLES = ["C1", "C2", "C3", "C4"]

# officiel : norm(nom) → {"cat", "nom_officiel"}  (docx1 = source nationale)
officiel = {}
for cat, names in AB.items():
    for n in names:
        officiel[norm(n)] = {"cat": cat, "nom": n}
for i, tbl in enumerate(cat1):
    for n in tbl["names"]:
        officiel.setdefault(norm(n), {"cat": C_TABLES[i], "nom": n})

# région par paroisse (docx2, en appui)
region_hint = {}
for e in cat2:
    region_hint.setdefault(norm(e["paroisse"]), norm_region(e["region"]))

print(f"Source officielle : {len(officiel)} paroisses catégorisées "
      f"(région connue pour {sum(1 for k in officiel if k in region_hint)})")

# ═══════════════════ 1. FUSION DES VRAIS DOUBLONS ═══════════════════
paroisses = list(Paroisse.objects.select_related("district__region"))
groups = {}
for p in paroisses:
    key = (norm(p.nom), p.district.region_id)
    groups.setdefault(key, []).append(p)

vrais_doublons = {k: v for k, v in groups.items() if len(v) > 1}
merges = []
for (nkey, _rid), plist in vrais_doublons.items():
    # garder : GPS d'abord, puis id le plus ancien
    keeper = sorted(plist, key=lambda p: (p.position is None, p.id))[0]
    # meilleur nom parmi le groupe
    best_name = max((p.nom for p in plist), key=name_quality)
    merges.append({"keep": keeper, "drop": [p for p in plist if p.id != keeper.id],
                   "name": best_name})

print(f"\n1) FUSION — {len(merges)} groupes de vrais doublons (même nom + même région)")
for m in merges:
    print(f"   ✔ garde #{m['keep'].id} « {m['name']} » (GPS={'oui' if m['keep'].position else 'non'})"
          f" ← absorbe {[f'#{p.id} {p.nom}' for p in m['drop']]}")

REASSIGN = [
    ("accounts", "User", "paroisse"),
    ("accounts", "StatistiqueAnnuelle", "paroisse"),
    ("geo", "ZoneInfluence", "paroisse"),
    ("visitors", "Itineraire", "paroisse_depart"),
    ("visitors", "Itineraire", "paroisse_arrivee"),
    ("oeuvres", "Oeuvre", "paroisse"),
    ("ouvriers", "Ouvrier", "paroisse"),
    ("visitors", "ProfilVisiteur", "paroisse_affiliee"),
    ("visitors", "ParoisseVue", "paroisse"),
    ("visitors", "ItinerairePersonnel", "depart_paroisse"),
    ("visitors", "ItinerairePersonnel", "arrivee_paroisse"),
    ("visitors", "ParoisseEnregistree", "paroisse"),
]
from django.apps import apps as django_apps  # noqa: E402

if APPLY:
    with transaction.atomic():
        from apps.accounts.models import StatistiqueAnnuelle
        for m in merges:
            keeper = m["keep"]
            for p in m["drop"]:
                # Statistiques : contrainte unique (paroisse, année) → fusion champ
                # par champ (on garde la valeur la plus élevée = donnée la plus
                # complète), puis suppression de la ligne du doublon.
                for s in StatistiqueAnnuelle.objects.filter(paroisse=p):
                    ks = StatistiqueAnnuelle.objects.filter(paroisse=keeper, annee=s.annee).first()
                    if ks is None:
                        s.paroisse = keeper
                        s.save(update_fields=["paroisse"])
                    else:
                        changed = []
                        for f in ("communiants", "non_communiants", "baptemes",
                                  "confirmations", "mariages", "deces"):
                            if getattr(s, f) > getattr(ks, f):
                                setattr(ks, f, getattr(s, f)); changed.append(f)
                        if changed:
                            ks.save(update_fields=changed)
                        s.delete()
                for app, model, field in REASSIGN:
                    if model == "StatistiqueAnnuelle":
                        continue
                    try:
                        Mdl = django_apps.get_model(app, model)
                        Mdl.objects.filter(**{field: p}).update(**{field: keeper})
                    except LookupError:
                        pass
                # fusion des champs vides du keeper
                for f in ("adresse", "telephone", "email"):
                    if not getattr(keeper, f) and getattr(p, f):
                        setattr(keeper, f, getattr(p, f))
                if keeper.position is None and p.position is not None:
                    keeper.position = p.position
                p.delete()
            keeper.nom = m["name"]
            keeper.save()
    print(f"   → {sum(len(m['drop']) for m in merges)} doublons fusionnés (APPLIQUÉ)")
else:
    print("   → SIMULATION (relancer avec --apply)")

# ═══════════════════ 2. ATTRIBUTION DES CATÉGORIES ═══════════════════
paroisses = list(Paroisse.objects.select_related("district__region"))
db_by_norm = {}
for p in paroisses:
    db_by_norm.setdefault(norm(p.nom), []).append(p)
db_keys = list(db_by_norm.keys())

assigned, fuzzy_log, ambiguous = 0, [], []
matched_off = set()
for k, info in officiel.items():
    cands = db_by_norm.get(k)
    ratio = 1.0
    if not cands:
        got = difflib.get_close_matches(k, db_keys, n=1, cutoff=0.87)
        if got:
            ratio = difflib.SequenceMatcher(None, k, got[0]).ratio()
            cands = db_by_norm[got[0]]
    if not cands:
        continue
    # homonymes : départager par la région du docx2
    target = None
    if len(cands) == 1:
        target = cands[0]
    else:
        hint = region_hint.get(k)
        if hint:
            same = [p for p in cands if norm_region(p.district.region.nom) == hint]
            if len(same) == 1:
                target = same[0]
        if target is None:
            ambiguous.append((info["nom"], [f"{p.nom} ({p.district.region.nom})" for p in cands]))
            continue
    matched_off.add(k)
    if ratio < 1.0:
        fuzzy_log.append(f"{info['nom']} → {target.nom} ({ratio:.2f})")
    if APPLY:
        Paroisse.objects.filter(id=target.id).update(categorie=info["cat"])
    assigned += 1

print(f"\n2) CATÉGORIES — attribuées à {assigned} paroisses existantes "
      f"(dont {len(fuzzy_log)} par rapprochement orthographique)")
print(f"   Homonymes non départagés (catégorie NON attribuée) : {len(ambiguous)}")
for a in ambiguous[:6]:
    print(f"     ? {a[0]} : {a[1]}")

# ═══════════════════ 3. CRÉATION DES PAROISSES MANQUANTES ═══════════════════
regions_db = {norm_region(r.nom): r for r in RegionSynodale.objects.all()}
to_create, sans_region = [], []
for k, info in officiel.items():
    if k in matched_off:
        continue
    hint = region_hint.get(k)
    reg = regions_db.get(hint) if hint else None
    if reg is None:
        sans_region.append(info["nom"])
        continue
    to_create.append((info, reg))

print(f"\n3) CRÉATION — {len(to_create)} paroisses officielles à créer (sans GPS)")
print(f"   Sans région identifiable (NON créées, à traiter manuellement) : {len(sans_region)}")
for n in sans_region[:10]:
    print(f"     ? {n}")

created = 0
if APPLY:
    with transaction.atomic():
        for info, reg in to_create:
            dist, _ = District.objects.get_or_create(
                nom="NON PRÉCISÉ", region=reg,
                defaults={},
            )
            Paroisse.objects.create(
                nom=info["nom"], categorie=info["cat"],
                district=dist, position=None, est_active=True,
            )
            created += 1
    print(f"   → {created} paroisses créées (APPLIQUÉ)")

# ═══════════════════ Bilan ═══════════════════
if APPLY:
    total = Paroisse.objects.count()
    avec_cat = Paroisse.objects.exclude(categorie__isnull=True).count()
    print(f"\nBILAN FINAL : {total} paroisses en BD, {avec_cat} avec catégorie, "
          f"{total - avec_cat} sans catégorie")
    from django.db.models import Count
    for r in Paroisse.objects.values("categorie").annotate(n=Count("id")).order_by("categorie"):
        print(f"   {r['categorie'] or '(aucune)'} : {r['n']}")

json.dump({"fuzzy": fuzzy_log, "ambigus": [a[0] for a in ambiguous], "sans_region": sans_region},
          open(D + "out_integration.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\nDétails → out_integration.json")
