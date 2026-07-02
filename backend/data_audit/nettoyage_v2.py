# -*- coding: utf-8 -*-
"""
Nettoyage v2 (exigences du 02/07/2026) :
  1. Fusion du doublon « Jourdain de Beka Hossere » (ligne corrompue par un
     décalage de colonnes dans l'Excel source — GPS aberrants hors Adamaoua).
  2. Fusion des deux « Mélen » : la fausse (#554, créée manuellement le 30/05)
     est absorbée par la vraie (#79, catégorie officielle A1).
  3. Suppression du grade « Évêque » (n'existe pas dans l'Église protestante ;
     0 ouvrier ne le porte en base — l'affichage venait du front).
  4. Scan des quasi-doublons restants (articles le/la/l'…) — RAPPORT seulement.
"""
import re
import sys
import unicodedata

sys.stdout.reconfigure(encoding="utf-8")
import django  # noqa: E402

django.setup()

from django.apps import apps as django_apps                       # noqa: E402
from django.db import transaction                                  # noqa: E402
from apps.geo.models import Paroisse                                # noqa: E402
from apps.ouvriers.models import Grade, Ouvrier                     # noqa: E402
from apps.accounts.models import StatistiqueAnnuelle                # noqa: E402

REASSIGN = [
    ("accounts", "User", "paroisse"), ("geo", "ZoneInfluence", "paroisse"),
    ("visitors", "Itineraire", "paroisse_depart"), ("visitors", "Itineraire", "paroisse_arrivee"),
    ("oeuvres", "Oeuvre", "paroisse"), ("ouvriers", "Ouvrier", "paroisse"),
    ("visitors", "ProfilVisiteur", "paroisse_affiliee"), ("visitors", "ParoisseVue", "paroisse"),
    ("visitors", "ItinerairePersonnel", "depart_paroisse"),
    ("visitors", "ItinerairePersonnel", "arrivee_paroisse"),
    ("visitors", "ParoisseEnregistree", "paroisse"),
]


def fusionner(keeper: Paroisse, drop: Paroisse, note=""):
    """Fusionne drop → keeper (stats champ à champ, toutes FK réassignées)."""
    for s in StatistiqueAnnuelle.objects.filter(paroisse=drop):
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
            django_apps.get_model(app, model).objects.filter(**{field: drop}).update(**{field: keeper})
        except LookupError:
            pass
    for f in ("adresse", "telephone", "email"):
        if not getattr(keeper, f) and getattr(drop, f):
            setattr(keeper, f, getattr(drop, f))
    if keeper.categorie is None and drop.categorie:
        keeper.categorie = drop.categorie
    drop.delete()
    keeper.save()
    print(f"   ✔ fusionné → #{keeper.id} « {keeper.nom} » {note}")


with transaction.atomic():
    # ═══ 1. Jourdain de Beka Hossere ═══
    print("1) JOURDAIN DE BEKA HOSSERE")
    j1 = Paroisse.objects.filter(id=1).first()
    j2 = Paroisse.objects.filter(id=2).first()
    if j1 and j2:
        # Les deux GPS sont HORS de l'Adamaoua (5.44N et 3.80N vs ~7.3N attendu)
        # → décalage de colonnes dans la source. On annule les positions.
        j2.position = None
        j2.adresse = "Beka Hosséré"
        j2.save(update_fields=["position", "adresse"])
        fusionner(j2, j1, "(GPS corrompus annulés — à re-géolocaliser)")
    else:
        print("   (déjà traité)")

    # ═══ 2. Mélen ═══
    print("2) MÉLEN")
    vraie = Paroisse.objects.filter(id=79).first()
    fausse = Paroisse.objects.filter(id=554).first()
    if vraie and fausse:
        fusionner(vraie, fausse, "(fausse #554 du 30/05 supprimée, 12 ouvriers transférés)")
    else:
        print("   (déjà traité)")

    # ═══ 3. Grade Évêque ═══
    print("3) GRADE ÉVÊQUE")
    g = Grade.objects.filter(nom__iexact="Évêque").first()
    if g:
        n = Ouvrier.objects.filter(grade=g).count()
        if n:
            Ouvrier.objects.filter(grade=g).update(grade=None)
            print(f"   {n} ouvriers dégradés → grade à requalifier")
        g.delete()
        print("   ✔ grade « Évêque » supprimé de la base")
    else:
        print("   (déjà absent)")

# ═══ 4. Scan des quasi-doublons restants (rapport) ═══
print("\n4) QUASI-DOUBLONS RESTANTS (même région, articles ignorés) — rapport :")


def norm2(s):
    s = unicodedata.normalize("NFD", str(s or "")).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"\bparoisse( de| du| d.)?\b", " ", s)
    s = re.sub(r"\beec\b", " ", s)
    s = re.sub(r"\b(le|la|les|l|de|du|des|d)\b", " ", s)      # articles ignorés
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())


groups = {}
for p in Paroisse.objects.select_related("district__region"):
    groups.setdefault((norm2(p.nom), p.district.region_id), []).append(p)
n_susp = 0
for (k, _), ps in groups.items():
    if len(ps) > 1:
        n_susp += 1
        print(f"   ? « {k} » : " + " | ".join(
            f"#{p.id} {p.nom} ({p.district.nom}, GPS={'oui' if p.position else 'non'})" for p in ps))
print(f"   → {n_susp} groupes suspects (validation humaine requise, AUCUNE fusion automatique)")
print(f"\nBILAN : {Paroisse.objects.count()} paroisses, {Grade.objects.count()} grades")
