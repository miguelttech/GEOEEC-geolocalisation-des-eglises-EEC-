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
# 1) OSRM (démo publique)   : rapide et fiable — PRINCIPAL
# 2) Valhalla (FOSSGIS)     : multimodal — SECOURS
# 3) Ligne droite (Haversine) : DERNIER RECOURS pour que ça marche toujours
OSRM_URL = "https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}"
VALHALLA_URL = "https://valhalla1.openstreetmap.de/route"

# Correspondance mode frontend → "costing" Valhalla
COSTING = {
    "auto":       "auto",        # voiture
    "voiture":    "auto",
    "car":        "auto",
    "bicycle":    "bicycle",     # vélo
    "velo":       "bicycle",
    "bike":       "bicycle",
    "pedestrian": "pedestrian",  # à pied
    "pied":       "pedestrian",
    "foot":       "pedestrian",
    "walk":       "pedestrian",
}

# Vitesses moyennes par mode (km/h) — sert à estimer la durée quand on suit
# le tracé routier OSRM (profil voiture) pour le vélo / la marche.
MODE_SPEED_KMH = {"auto": None, "bicycle": 15.0, "pedestrian": 5.0}


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
        "directions_options": {"units": "kilometers"},
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
    Essaie OSRM, puis Valhalla, puis (dernier recours) une ligne droite.
    NE LÈVE JAMAIS d'erreur : renvoie toujours un itinéraire exploitable.

    Retourne un dict :
      { mode, distance_km, duration_min, geometry[[lat,lng]], steps[], provider }
    """
    mode_norm = COSTING.get((mode or "auto").lower(), "auto")
    for provider in (_route_osrm, _route_valhalla):
        try:
            return provider(start_lat, start_lng, end_lat, end_lng, mode_norm)
        except RoutingError:
            continue
        except Exception:  # noqa: BLE001
            continue
    # Aucun service dispo → ligne droite (l'appli reste fonctionnelle)
    return _route_direct(start_lat, start_lng, end_lat, end_lng, mode_norm)
