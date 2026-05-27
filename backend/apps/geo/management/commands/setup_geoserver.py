"""
Commande Django : configure GeoServer automatiquement via son API REST.

Usage :
    docker compose run --rm backend python manage.py setup_geoserver

Ce que fait cette commande :
    1. Vérifie que GeoServer est joignable
    2. Crée le workspace  : eec
    3. Crée le datastore  : postgis_eec  (connexion PostGIS)
    4. Crée 4 styles SLD  : eec_regions, eec_districts, eec_paroisses, eec_oeuvres
    5. Publie 4 couches   : regions_synodales, districts, paroisses, oeuvres
    6. Assigne les styles aux couches

La commande est idempotente : relancer ne casse rien (les étapes déjà
faites sont détectées via code HTTP 409 Conflict et ignorées).
"""

import json
import os
import urllib.error
import urllib.request
from base64 import b64encode

from django.core.management.base import BaseCommand

# ─────────────────────────────────────────────────────────────── Config ──────
GEOSERVER_URL = os.environ.get("GEOSERVER_URL", "http://geoserver:8080/geoserver")
GS_REST       = f"{GEOSERVER_URL}/rest"
GS_USER       = "admin"
GS_PASS       = os.environ.get("GEOSERVER_ADMIN_PASSWORD", "")

DB_HOST = os.environ.get("DB_HOST", "db")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "eec_db")
DB_USER = os.environ.get("DB_USER", "eec_user")
DB_PASS = os.environ.get("DB_PASSWORD", "")

WORKSPACE = "eec"
STORE     = "postgis_eec"

# Bounding box du Cameroun (EPSG:4326)
CAMEROUN_BBOX = {"minx": 8.4, "miny": 1.6, "maxx": 16.3, "maxy": 13.2}

# ─────────────────────────────────────────────────────────────── SLD ─────────
SLD_REGIONS = """\
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>eec:regions_synodales</Name>
    <UserStyle>
      <Title>EEC - Régions synodales</Title>
      <FeatureTypeStyle>
        <Rule>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#16A34A</CssParameter>
              <CssParameter name="fill-opacity">0.20</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#15803D</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
          <TextSymbolizer>
            <Label><ogc:PropertyName>nom</ogc:PropertyName></Label>
            <Font>
              <CssParameter name="font-family">Arial</CssParameter>
              <CssParameter name="font-size">11</CssParameter>
              <CssParameter name="font-weight">bold</CssParameter>
            </Font>
            <LabelPlacement>
              <PointPlacement>
                <AnchorPoint>
                  <AnchorPointX>0.5</AnchorPointX>
                  <AnchorPointY>0.5</AnchorPointY>
                </AnchorPoint>
              </PointPlacement>
            </LabelPlacement>
            <Fill>
              <CssParameter name="fill">#14532D</CssParameter>
            </Fill>
            <VendorOption name="autoWrap">60</VendorOption>
            <VendorOption name="maxDisplacement">150</VendorOption>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>"""

SLD_PAROISSES = """\
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink">
  <NamedLayer>
    <Name>eec:paroisses</Name>
    <UserStyle>
      <Title>EEC - Paroisses</Title>
      <FeatureTypeStyle>
        <Rule>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>circle</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#15803D</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#FFFFFF</CssParameter>
                  <CssParameter name="stroke-width">1.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>8</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>"""

SLD_OEUVRES = """\
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink">
  <NamedLayer>
    <Name>eec:oeuvres</Name>
    <UserStyle>
      <Title>EEC - Oeuvres</Title>
      <FeatureTypeStyle>
        <Rule>
          <PointSymbolizer>
            <Graphic>
              <Mark>
                <WellKnownName>square</WellKnownName>
                <Fill>
                  <CssParameter name="fill">#D97706</CssParameter>
                </Fill>
                <Stroke>
                  <CssParameter name="stroke">#FFFFFF</CssParameter>
                  <CssParameter name="stroke-width">1.5</CssParameter>
                </Stroke>
              </Mark>
              <Size>9</Size>
            </Graphic>
          </PointSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>"""

SLD_DISTRICTS = """\
<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
    <Name>eec:districts</Name>
    <UserStyle>
      <Title>EEC - Districts</Title>
      <FeatureTypeStyle>
        <!-- Polygone toujours visible — tirets pour se distinguer des régions -->
        <Rule>
          <PolygonSymbolizer>
            <Fill>
              <CssParameter name="fill">#4ADE80</CssParameter>
              <CssParameter name="fill-opacity">0.10</CssParameter>
            </Fill>
            <Stroke>
              <CssParameter name="stroke">#22C55E</CssParameter>
              <CssParameter name="stroke-width">1.2</CssParameter>
              <CssParameter name="stroke-dasharray">5 3</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
        </Rule>
        <!-- Labels uniquement en zoom district (scale &lt;= 500 000) -->
        <Rule>
          <MaxScaleDenominator>500000</MaxScaleDenominator>
          <TextSymbolizer>
            <Label><ogc:PropertyName>nom</ogc:PropertyName></Label>
            <Font>
              <CssParameter name="font-family">Arial</CssParameter>
              <CssParameter name="font-size">9</CssParameter>
              <CssParameter name="font-style">italic</CssParameter>
            </Font>
            <LabelPlacement>
              <PointPlacement>
                <AnchorPoint>
                  <AnchorPointX>0.5</AnchorPointX>
                  <AnchorPointY>0.5</AnchorPointY>
                </AnchorPoint>
              </PointPlacement>
            </LabelPlacement>
            <Fill>
              <CssParameter name="fill">#166534</CssParameter>
            </Fill>
            <VendorOption name="autoWrap">40</VendorOption>
            <VendorOption name="maxDisplacement">80</VendorOption>
          </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>"""

# ──────────────────────────────────────────────────── Couches à publier ──────
LAYERS = [
    {
        "name":        "regions_synodales",
        "native_name": "geo_regionsynodale",
        "title":       "Régions synodales EEC (22)",
        "abstract":    "Polygones des 22 régions synodales de l'Église Évangélique du Cameroun.",
        "geom_field":  "geometrie",
        "style":       "eec_regions",
    },
    {
        "name":        "districts",
        "native_name": "geo_district",
        "title":       "Districts EEC (134)",
        "abstract":    "Polygones des 134 districts de l'Église Évangélique du Cameroun.",
        "geom_field":  "geometrie",
        "style":       "eec_districts",
    },
    {
        "name":        "paroisses",
        "native_name": "geo_paroisse",
        "title":       "Paroisses EEC (553)",
        "abstract":    "Points GPS des paroisses de l'EEC avec coordonnées valides.",
        "geom_field":  "position",
        "style":       "eec_paroisses",
    },
    {
        "name":        "oeuvres",
        "native_name": "oeuvres_oeuvre",
        "title":       "Oeuvres EEC (311)",
        "abstract":    "Oeuvres scolaires, médicales, agropastorales et autres de l'EEC.",
        "geom_field":  "position",
        "style":       "eec_oeuvres",
    },
]

STYLES = [
    ("eec_regions",   SLD_REGIONS),
    ("eec_districts", SLD_DISTRICTS),
    ("eec_paroisses", SLD_PAROISSES),
    ("eec_oeuvres",   SLD_OEUVRES),
]


# ──────────────────────────────────────────────────── Helpers HTTP ────────────
def _auth_header() -> str:
    token = b64encode(f"{GS_USER}:{GS_PASS}".encode()).decode()
    return f"Basic {token}"


def _call(path: str, method: str = "GET", body=None,
          content_type: str = "application/json") -> tuple[int, bytes]:
    """HTTP call to GeoServer REST API. Returns (status_code, response_bytes)."""
    url = f"{GS_REST}{path}"
    headers = {"Authorization": _auth_header(), "Content-Type": content_type}

    if body is None:
        raw = None
    elif isinstance(body, (dict, list)):
        raw = json.dumps(body).encode()
    elif isinstance(body, str):
        raw = body.encode("utf-8")
    else:
        raw = body  # already bytes

    req = urllib.request.Request(url, data=raw, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read()


def _ok(code: int) -> bool:
    return 200 <= code < 300


def _exists(code: int) -> bool:
    return code == 409  # Conflict = already exists in GeoServer REST


# ──────────────────────────────────────────────────────────────── Command ─────
class Command(BaseCommand):
    help = "Configure GeoServer : workspace, datastore PostGIS, styles SLD et couches."

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n=== Configuration GeoServer — EEC Géolocalisation ===\n"
        ))

        if not GS_PASS:
            raise CommandError(
                "Variable GEOSERVER_ADMIN_PASSWORD non définie. "
                "Vérifiez le fichier backend/.env"
            )

        # ── 0. Test de connectivité ───────────────────────────────────────────
        self._step("0", "Vérification de la connexion GeoServer")
        code, _ = _call("/about/version.json")
        if not _ok(code):
            raise CommandError(
                f"GeoServer inaccessible ({code}). "
                "Vérifiez que le conteneur geoserver est démarré : "
                "docker compose up -d geoserver"
            )
        self._ok("GeoServer joignable")

        # ── 1. Workspace ──────────────────────────────────────────────────────
        self._step("1", f"Création du workspace '{WORKSPACE}'")
        code, _ = _call("/workspaces", "POST", {"workspace": {"name": WORKSPACE}})
        self._done(code, f"Workspace '{WORKSPACE}'")

        # ── 2. Datastore PostGIS ──────────────────────────────────────────────
        self._step("2", f"Création du datastore PostGIS '{STORE}'")
        store_payload = {
            "dataStore": {
                "name":    STORE,
                "type":    "PostGIS",
                "enabled": True,
                "connectionParameters": {
                    "entry": [
                        {"@key": "dbtype",               "$": "postgis"},
                        {"@key": "host",                 "$": DB_HOST},
                        {"@key": "port",                 "$": DB_PORT},
                        {"@key": "database",             "$": DB_NAME},
                        {"@key": "user",                 "$": DB_USER},
                        {"@key": "passwd",               "$": DB_PASS},
                        {"@key": "schema",               "$": "public"},
                        {"@key": "Loose bbox",           "$": "true"},
                        {"@key": "Expose primary keys",  "$": "true"},
                        {"@key": "validate connections", "$": "true"},
                        {"@key": "SSL mode",             "$": "DISABLE"},
                        {"@key": "preparedStatements",   "$": "true"},
                        {"@key": "encode functions",     "$": "true"},
                    ]
                },
            }
        }
        code, resp = _call(f"/workspaces/{WORKSPACE}/datastores", "POST", store_payload)
        if _ok(code):
            self.stdout.write(self.style.SUCCESS(f"  ✓ Datastore '{STORE}' créé (HTTP {code})"))
        elif _exists(code) or b"already exists" in resp:
            self.stdout.write(f"  → Datastore '{STORE}' existe déjà, ignoré")
        else:
            self.stderr.write(self.style.ERROR(f"  ✗ Erreur datastore : {code} — {resp[:200]}"))

        # ── 3. Styles SLD ─────────────────────────────────────────────────────
        self._step("3", f"Création des {len(STYLES)} styles SLD")
        for style_name, sld_content in STYLES:
            self._create_style(style_name, sld_content)

        # ── 4. Publication des couches ─────────────────────────────────────────
        self._step("4", f"Publication des {len(LAYERS)} couches")
        for layer in LAYERS:
            self._publish_layer(layer)

        self.stdout.write(self.style.SUCCESS(
            "\n✓ Configuration GeoServer terminée.\n"
            f"  Aperçu WMS : {GEOSERVER_URL}/{WORKSPACE}/wms?service=WMS&version=1.1.0"
            f"&request=GetCapabilities\n"
            f"  Interface  : http://localhost:8080/geoserver/web\n"
        ))

    # ── Helpers d'affichage ───────────────────────────────────────────────────
    def _step(self, num: str, msg: str):
        self.stdout.write(self.style.MIGRATE_HEADING(f"\n[Étape {num}] {msg}"))

    def _ok(self, msg: str):
        self.stdout.write(self.style.SUCCESS(f"  ✓ {msg}"))

    def _done(self, code: int, label: str):
        if _ok(code):
            self.stdout.write(self.style.SUCCESS(f"  ✓ {label} créé (HTTP {code})"))
        elif _exists(code):
            self.stdout.write(f"  → {label} existe déjà, ignoré")
        else:
            self.stdout.write(self.style.WARNING(f"  ⚠ {label} : HTTP {code}"))

    # ── Création d'un style SLD ───────────────────────────────────────────────
    def _create_style(self, name: str, sld_xml: str):
        # Étape A : déclarer le style (metadata JSON).
        # GeoServer renvoie 201 si créé, 409 si déjà existant, parfois 500.
        # Dans tous les cas on tente l'upload SLD en étape B.
        meta = {"style": {"name": name, "filename": f"{name}.sld"}}
        code_meta, _ = _call(f"/workspaces/{WORKSPACE}/styles", "POST", meta)
        is_new = _ok(code_meta)

        # Étape B : uploader / mettre à jour le SLD (toujours, même si existant)
        code2, resp2 = _call(
            f"/workspaces/{WORKSPACE}/styles/{name}",
            "PUT",
            sld_xml,
            content_type="application/vnd.ogc.sld+xml",
        )
        if _ok(code2):
            verb = "créé et uploadé" if is_new else "mis à jour"
            self.stdout.write(self.style.SUCCESS(f"  ✓ Style '{name}' {verb}"))
        else:
            self.stdout.write(self.style.WARNING(
                f"  ⚠ Style '{name}' SLD : HTTP {code2} — {resp2[:120]}"
            ))

    # ── Publication d'une couche ──────────────────────────────────────────────
    def _publish_layer(self, layer: dict):
        name        = layer["name"]
        native_name = layer["native_name"]
        title       = layer["title"]
        abstract    = layer["abstract"]
        style       = layer["style"]
        bb          = CAMEROUN_BBOX

        ft_payload = {
            "featureType": {
                "name":        name,
                "nativeName":  native_name,
                "title":       title,
                "abstract":    abstract,
                "srs":         "EPSG:4326",
                "projectionPolicy": "FORCE_DECLARED",
                "enabled":     True,
                "nativeBoundingBox": {
                    "minx": bb["minx"], "miny": bb["miny"],
                    "maxx": bb["maxx"], "maxy": bb["maxy"],
                    "crs": "EPSG:4326",
                },
                "latLonBoundingBox": {
                    "minx": bb["minx"], "miny": bb["miny"],
                    "maxx": bb["maxx"], "maxy": bb["maxy"],
                    "crs": "EPSG:4326",
                },
            }
        }
        code, resp = _call(
            f"/workspaces/{WORKSPACE}/datastores/{STORE}/featuretypes",
            "POST",
            ft_payload,
        )
        already = b"already exists" in resp
        if not _ok(code) and not _exists(code) and not already:
            self.stdout.write(self.style.WARNING(
                f"  ⚠ Couche '{name}' : HTTP {code} — {resp[:200]}"
            ))
            return

        if already or _exists(code):
            self.stdout.write(f"  → Couche '{WORKSPACE}:{name}' existe déjà, style mis à jour")
        else:
            self._done(code, f"Couche '{WORKSPACE}:{name}'")

        # Assigner le style par défaut
        style_payload = {
            "layer": {
                "defaultStyle": {
                    "name":      style,
                    "workspace": WORKSPACE,
                }
            }
        }
        code2, _ = _call(f"/layers/{WORKSPACE}:{name}", "PUT", style_payload)
        if _ok(code2):
            self.stdout.write(f"    → Style '{style}' assigné")
        else:
            self.stdout.write(self.style.WARNING(f"    ⚠ Style non assigné : HTTP {code2}"))
