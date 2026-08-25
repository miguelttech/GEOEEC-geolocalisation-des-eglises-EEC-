"""
=============================================================================
Service de calcul d'itinéraire réel (routing sur le réseau routier)
=============================================================================

POURQUOI CE FICHIER ?
  Le calcul "à vol d'oiseau" (Haversine) donne une distance en ligne droite,
  ce qui n'a aucun sens pour un déplacement réel : on ne traverse pas les
  immeubles ni les fleuves. Pour un itinéraire « comme Google Maps », il faut
  suivre les ROUTES réelles. Cela demande un moteur de routing qui connaît le
  graphe routier (réseau OpenStreetMap).

MOTEUR UTILISÉ : Valhalla (instance publique FOSSGIS)
  - Gratuit, sans clé API, basé sur les données OpenStreetMap.
  - Supporte 3 modes : voiture (auto), vélo (bicycle), à pied (pedestrian).
  - Renvoie : la géométrie du tracé (polyligne encodée), la distance, la durée,
    et les manœuvres virage-par-virage.

ALGORITHME (côté Valhalla) :
  Valhalla modélise le réseau routier comme un GRAPHE :
    - chaque intersection = un NŒUD (vertex)
    - chaque tronçon de route entre deux intersections = une ARÊTE (edge),
      pondérée par un COÛT (temps de parcours selon le mode et la vitesse).
  Le plus court chemin est trouvé avec une variante de l'algorithme de
  DIJKSTRA / A* (bidirectionnel A*), exactement la famille d'algorithmes que
  Google Maps utilise (avec des optimisations type Contraction Hierarchies).
  Voir docs/EXPLICATION_ITINERAIRE.md pour le détail mathématique.

CE MODULE EST VOLONTAIREMENT ISOLÉ :
  Si demain on veut héberger notre propre serveur OSRM/Valhalla, on change
  juste l'URL ici, le reste de l'application ne bouge pas.
=============================================================================
"""

import json
import math
import urllib.request
import urllib.error

# ── Fournisseurs de routing (données OSM, gratuits, sans clé) ──
# 1) Valhalla (FOSSGIS)     : MULTIMODAL — PRINCIPAL
# 2) OSRM (démo publique)   : profil voiture uniquement — SECOURS
# 3) Ligne droite (Haversine) : DERNIER RECOURS pour que ça marche toujours
#
# Valhalla est passé devant OSRM parce qu'il est le seul des deux à connaître
# un graphe par mode : OSRM n'expose que le profil voiture sur son instance de
# démonstration, donc « à pied » et « moto » y empruntent le tracé d'une
# voiture (voies rapides comprises) avec une durée simplement redivisée par une
# vitesse moyenne. Tant que Valhalla répond, les trois modes suivent désormais
# chacun leur propre réseau. Mesuré sur Yaoundé : Valhalla ~1 s, OSRM ~4 s.
OSRM_URL = "https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}"
VALHALLA_URL = "https://valhalla1.openstreetmap.de/route"

# Correspondance mode frontend → "costing" Valhalla
#
# ATTENTION : tout mode envoyé par le frontend DOIT figurer ici. Un mode absent
# retombe sur "auto" via le .get(..., "auto") plus bas, et l'utilisateur voit
# alors la durée de la voiture en croyant lire celle de son mode — c'était le
# cas de "moto", qui n'avait aucune entrée.
#
# CHOIX DU PROFIL MOTO — mesuré, pas supposé.
# Valhalla propose deux profils deux-roues, aucun utilisable tel quel ici :
#   · `motor_scooter` modélise un 50 cm³ et s'effondre sur le réseau
#     camerounais, largement classé en surface dégradée dans OSM. Mesures
#     Valhalla FOSSGIS : centre de Yaoundé → Nsimeyong, 3,58 km parcourus en
#     30,1 min, soit 7,1 km/h — plus lent qu'un vélo. Yaoundé → Douala :
#     8 h 41 contre 4 h 47 en voiture. Les `costing_options` (top_speed,
#     use_primary, use_hills) sont ignorées par l'instance publique : testées,
#     elles ne déplacent pas le résultat d'une seconde.
#   · `motorcycle` modélise une grosse cylindrée et renvoie EXACTEMENT le
#     tracé et la durée de la voiture — le bouton « Moto » n'afficherait donc
#     rien de différent, c'est-à-dire le bug d'origine.
# On retient donc `motorcycle` pour le GRAPHE (vraies routes, vitesses
# plausibles) et on corrige la seule durée par le facteur ci-dessous.
COSTING = {
    "auto":          "auto",           # voiture
    "voiture":       "auto",
    "car":           "auto",
    "moto":          "motorcycle",     # moto / moto-taxi — voir MOTO_FACTEUR_DUREE
    "motorcycle":    "motorcycle",
    "motor_scooter": "motor_scooter",
    "scooter":       "motor_scooter",
    "bicycle":       "bicycle",        # vélo
    "velo":          "bicycle",
    "bike":          "bicycle",
    "pedestrian":    "pedestrian",     # à pied
    "pied":          "pedestrian",
    "foot":          "pedestrian",
    "walk":          "pedestrian",
}

# Les trois modes proposés dans l'interface carte, dans l'ordre d'affichage.
MODES_UI = ("auto", "moto", "pedestrian")

# Correction de durée appliquée au mode « moto », par-dessus le profil
# `motorcycle` de Valhalla.
#
# ATTENTION — c'est une HEURISTIQUE MÉTIER, pas une donnée OpenStreetMap :
# elle traduit le fait qu'une moto-taxi se faufile dans les embouteillages là
# où une voiture les subit. Sans elle, « Moto » afficherait au centième près la
# durée « Voiture », ce qui était précisément le défaut signalé.
# Valeur volontairement modeste (−15 %) : elle ne prétend pas à la précision,
# elle rétablit un ordre de grandeur crédible. Un seul endroit à modifier pour
# la réajuster, voire la neutraliser en la remettant à 1.0.
MOTO_FACTEUR_DUREE = 0.85

# Vitesses moyennes par mode (km/h) — sert à estimer la durée quand on suit
# le tracé routier OSRM (profil voiture) pour le vélo / la marche.
MODE_SPEED_KMH = {"auto": None, "motor_scooter": 28.0, "bicycle": 15.0, "pedestrian": 5.0}


def _haversine_km(lat1, lng1, lat2, lng2):
    """Distance à vol d'oiseau en km (formule de Haversine)."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def decode_polyline(encoded, precision=6):
    """
    Décode une polyligne encodée (format Google/Valhalla) en liste [[lat, lng], ...].

    Valhalla encode les coordonnées avec une précision de 6 décimales (1e-6).
    L'algorithme : chaque nombre est stocké en deltas (différence avec le point
    précédent) sur des blocs de 5 bits, ce qui compresse fortement le tracé.
    """
    inv = 10 ** -precision
    decoded = []
    previous = [0, 0]
    i = 0
    while i < len(encoded):
        ll = [0, 0]
        for j in (0, 1):
            shift = 0
            byte = 0x20
            while byte >= 0x20:
                byte = ord(encoded[i]) - 63
                i += 1
                ll[j] |= (byte & 0x1f) << shift
                shift += 5
            # bit de signe : si impair → négatif
            ll[j] = previous[j] + (~(ll[j] >> 1) if (ll[j] & 1) else (ll[j] >> 1))
            previous[j] = ll[j]
        # Valhalla renvoie (lat, lng) — c'est exactement l'ordre attendu par Leaflet
        decoded.append([ll[0] * inv, ll[1] * inv])
    return decoded


class RoutingError(Exception):
    """Erreur de calcul d'itinéraire (réseau, point inaccessible, etc.)."""


# ── Traductions des manœuvres OSRM en français ──
_OSRM_MODIFIER_FR = {
    "left": "à gauche", "right": "à droite",
    "slight left": "légèrement à gauche", "slight right": "légèrement à droite",
    "sharp left": "franchement à gauche", "sharp right": "franchement à droite",
    "straight": "tout droit", "uturn": "demi-tour",
}


def _osrm_instruction(maneuver, name):
    """Construit une instruction lisible en français depuis une manœuvre OSRM."""
    typ = maneuver.get("type", "")
    mod = _OSRM_MODIFIER_FR.get(maneuver.get("modifier", ""), "")
    voie = f" sur {name}" if name else ""
    if typ == "depart":
        return f"Départ{voie}"
    if typ == "arrive":
        return "Arrivée à destination"
    if typ in ("turn", "end of road", "new name", "continue", "fork", "merge", "on ramp", "off ramp"):
        if mod and mod != "tout droit":
            return f"Tournez {mod}{voie}"
        return f"Continuez{voie}"
    if typ == "roundabout" or typ == "rotary":
        return f"Prenez le rond-point{voie}"
    return (f"Continuez {mod}{voie}").strip()


def _route_osrm(start_lat, start_lng, end_lat, end_lng, mode):
    """Itinéraire via OSRM (profil voiture). Lève RoutingError en cas d'échec."""
    url = OSRM_URL.format(lng1=float(start_lng), lat1=float(start_lat),
                          lng2=float(end_lng), lat2=float(end_lat))
    url += "?overview=full&geometries=polyline6&steps=true&annotations=false"
    req = urllib.request.Request(url, headers={"User-Agent": "GEOEEC/1.0 (EEC Cameroun)"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        raise RoutingError("OSRM injoignable.") from e

    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError("OSRM : aucun itinéraire.")

    route = data["routes"][0]
    geometry = decode_polyline(route.get("geometry", ""), precision=6)
    dist_km = route.get("distance", 0.0) / 1000.0

    # Durée : OSRM = voiture ; pour vélo/piéton on recalcule selon la vitesse
    speed = MODE_SPEED_KMH.get(mode)
    if speed:
        dur_min = dist_km / speed * 60.0
    else:
        dur_min = route.get("duration", 0.0) / 60.0

    steps = []
    for leg in route.get("legs", []):
        for s in leg.get("steps", []):
            s_dist = s.get("distance", 0.0) / 1000.0
            s_dur = (s_dist / speed * 60.0) if speed else (s.get("duration", 0.0) / 60.0)
            steps.append({
                "instruction":  _osrm_instruction(s.get("maneuver", {}), s.get("name", "")),
                "distance_km":  round(s_dist, 3),
                "duration_min": round(s_dur, 1),
                "type":         0,
            })

    return {
        "mode":         mode,
        "distance_km":  round(dist_km, 2),
        "duration_min": round(dur_min, 1),
        "geometry":     geometry,
        "steps":        steps,
        "provider":     "osrm",
    }


def _route_valhalla(start_lat, start_lng, end_lat, end_lng, mode):
    """Itinéraire via Valhalla FOSSGIS (multimodal). Lève RoutingError en cas d'échec."""
    costing = COSTING.get((mode or "auto").lower(), "auto")
    payload = json.dumps({
        "locations": [
            {"lat": float(start_lat), "lon": float(start_lng)},
            {"lat": float(end_lat),   "lon": float(end_lng)},
        ],
        "costing": costing,
        # `language` est indispensable : sans lui Valhalla renvoie ses
        # instructions virage-par-virage en anglais ("Drive north on…"), ce qui
        # se voit directement dans la liste des étapes du panneau itinéraire.
        "directions_options": {"units": "kilometers", "language": "fr-FR"},
    }).encode("utf-8")
    req = urllib.request.Request(
        VALHALLA_URL, data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "GEOEEC/1.0 (EEC Cameroun)"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:  # noqa: BLE001
        raise RoutingError("Valhalla injoignable.") from e

    trip = data.get("trip") or {}
    legs = trip.get("legs") or []
    summary = trip.get("summary") or {}
    if not legs:
        raise RoutingError("Valhalla : aucun itinéraire.")

    leg = legs[0]
    steps = [{
        "instruction":  m.get("instruction", ""),
        "distance_km":  round(m.get("length", 0.0), 3),
        "duration_min": round(m.get("time", 0.0) / 60.0, 1),
        "type":         m.get("type", 0),
    } for m in leg.get("maneuvers", [])]

    return {
        "mode":         costing,
        "distance_km":  round(summary.get("length", 0.0), 2),
        "duration_min": round(summary.get("time", 0.0) / 60.0, 1),
        "geometry":     decode_polyline(leg.get("shape", ""), precision=6),
        "steps":        steps,
        "provider":     "valhalla",
    }


def _route_direct(start_lat, start_lng, end_lat, end_lng, mode):
    """Dernier recours : ligne droite (à vol d'oiseau). Ne lève jamais d'erreur."""
    dist_km = _haversine_km(float(start_lat), float(start_lng), float(end_lat), float(end_lng))
    speed = MODE_SPEED_KMH.get(mode) or 40.0  # 40 km/h par défaut pour la voiture
    dur_min = dist_km / speed * 60.0
    return {
        "mode":         mode,
        "distance_km":  round(dist_km, 2),
        "duration_min": round(dur_min, 1),
        "geometry":     [[float(start_lat), float(start_lng)], [float(end_lat), float(end_lng)]],
        "steps":        [{"instruction": "Trajet direct (routage indisponible)",
                          "distance_km": round(dist_km, 3), "duration_min": round(dur_min, 1), "type": 0}],
        "provider":     "direct",
    }


def calculer_route(start_lat, start_lng, end_lat, end_lng, mode="auto"):
    """
    Calcule un itinéraire réel sur les routes entre deux points GPS.
    Essaie Valhalla, puis OSRM, puis (dernier recours) une ligne droite.
    NE LÈVE JAMAIS d'erreur : renvoie toujours un itinéraire exploitable.

    Retourne un dict :
      { mode, costing, distance_km, duration_min, geometry[[lat,lng]], steps[], provider }

    `mode` réexpédie EXACTEMENT le mode demandé par le frontend ("auto",
    "moto", "pedestrian"), pas le profil moteur : le frontend colore le tracé
    selon cette valeur, et lui renvoyer "motor_scooter" lui ferait retomber sur
    la couleur voiture. Le profil réellement employé reste lisible dans
    `costing`, pour le diagnostic.
    """
    mode_ui = (mode or "auto").lower()
    mode_norm = COSTING.get(mode_ui, "auto")

    result = None
    for provider in (_route_valhalla, _route_osrm):
        try:
            result = provider(start_lat, start_lng, end_lat, end_lng, mode_norm)
            break
        except RoutingError:
            continue
        except Exception:  # noqa: BLE001
            continue
    if result is None:
        # Aucun service dispo → ligne droite (l'appli reste fonctionnelle)
        result = _route_direct(start_lat, start_lng, end_lat, end_lng, mode_norm)

    # Correction moto : le profil `motorcycle` calque la voiture, on applique
    # le facteur métier à la durée totale ET aux étapes (sinon la somme des
    # étapes ne correspondrait plus à la durée annoncée).
    if mode_ui == "moto" and MOTO_FACTEUR_DUREE != 1.0:
        result["duration_min"] = round(result["duration_min"] * MOTO_FACTEUR_DUREE, 1)
        for etape in result.get("steps", []):
            etape["duration_min"] = round(etape["duration_min"] * MOTO_FACTEUR_DUREE, 1)
        result["duree_ajustee"] = True

    result["costing"] = mode_norm
    result["mode"] = mode_ui
    return result


def calculer_resume(start_lat, start_lng, end_lat, end_lng, mode):
    """
    Distance + durée d'un mode, SANS la géométrie ni les étapes.

    Sert à remplir les trois onglets « Voiture / Moto / À pied » d'un coup :
    l'utilisateur doit pouvoir comparer les durées avant de choisir, donc on ne
    peut pas se contenter du mode actuellement sélectionné. Le tracé, lui, ne
    concerne que le mode affiché — inutile de rapatrier trois polylignes.
    """
    r = calculer_route(start_lat, start_lng, end_lat, end_lng, mode)
    return {
        "mode":         r["mode"],
        "distance_km":  r["distance_km"],
        "duration_min": r["duration_min"],
        "provider":     r["provider"],
    }


def calculer_routes_multi(start_lat, start_lng, end_lat, end_lng, mode="auto", modes=None):
    """
    Calcule l'itinéraire COMPLET du mode sélectionné, plus le résumé
    (distance + durée) de chacun des autres modes proposés dans l'interface.

    Les appels partent EN PARALLÈLE : séquentiellement, trois allers-retours
    vers Valhalla à ~1 s chacun feraient patienter l'utilisateur 3 s après un
    simple clic sur « Calculer l'itinéraire ». En parallèle, le coût total
    retombe à celui de l'appel le plus lent.

    Retourne le dict de `calculer_route` enrichi d'une clé `alternatives` :
      { "auto": {distance_km, duration_min}, "moto": {...}, "pedestrian": {...} }
    """
    from concurrent.futures import ThreadPoolExecutor

    modes = list(modes or MODES_UI)
    mode_ui = (mode or "auto").lower()
    if mode_ui not in modes:
        modes.insert(0, mode_ui)

    autres = [m for m in modes if m != mode_ui]

    with ThreadPoolExecutor(max_workers=len(modes)) as pool:
        principal = pool.submit(calculer_route, start_lat, start_lng, end_lat, end_lng, mode_ui)
        resumes = {
            m: pool.submit(calculer_resume, start_lat, start_lng, end_lat, end_lng, m)
            for m in autres
        }
        result = principal.result()
        alternatives = {mode_ui: {
            "distance_km":  result["distance_km"],
            "duration_min": result["duration_min"],
        }}
        for m, fut in resumes.items():
            try:
                r = fut.result()
                alternatives[m] = {"distance_km": r["distance_km"], "duration_min": r["duration_min"]}
            except Exception:  # noqa: BLE001 — un mode indisponible ne doit pas
                # faire échouer l'itinéraire principal : l'onglet concerné
                # affichera simplement « — » côté interface.
                alternatives[m] = None

    result["alternatives"] = alternatives
    return result
