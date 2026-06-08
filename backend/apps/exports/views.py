import io
from datetime import date

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from django.contrib.gis.geos import Point
from django.http import HttpResponse

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.geo.models import RegionSynodale, District, Paroisse
from apps.oeuvres.models import TypeOeuvre, Oeuvre
from apps.ouvriers.models import Grade, Ouvrier
from apps.accounts.models import StatistiqueAnnuelle

# ---------------------------------------------------------------------------
# Constantes de validation GPS Cameroun
# ---------------------------------------------------------------------------
CAM_LAT_MIN, CAM_LAT_MAX = 1.7, 13.1
CAM_LON_MIN, CAM_LON_MAX = 8.5, 16.2

# ---------------------------------------------------------------------------
# Styles Excel partagés
# ---------------------------------------------------------------------------
EEC_GREEN      = "1B5E20"
EEC_LIGHT_ROW  = "E8F5E9"

HEADER_FONT    = Font(bold=True, color="FFFFFF", size=11)
HEADER_FILL    = PatternFill("solid", fgColor=EEC_GREEN)
HEADER_ALIGN   = Alignment(horizontal="center", vertical="center", wrap_text=True)
PAIR_ROW_FILL  = PatternFill("solid", fgColor=EEC_LIGHT_ROW)
CELL_ALIGN     = Alignment(vertical="center")
THIN           = Side(style="thin")
CELL_BORDER    = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)


def _apply_header(ws, row_idx, nb_cols):
    for col in range(1, nb_cols + 1):
        cell = ws.cell(row=row_idx, column=col)
        cell.font      = HEADER_FONT
        cell.fill      = HEADER_FILL
        cell.alignment = HEADER_ALIGN
        cell.border    = CELL_BORDER
    ws.row_dimensions[row_idx].height = 28


def _apply_row(ws, row_idx, nb_cols):
    fill = PAIR_ROW_FILL if row_idx % 2 == 0 else None
    for col in range(1, nb_cols + 1):
        cell = ws.cell(row=row_idx, column=col)
        if fill:
            cell.fill = fill
        cell.alignment = CELL_ALIGN
        cell.border    = CELL_BORDER


def _excel_response(wb, filename):
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    resp = HttpResponse(
        buf.read(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


def _set_col_widths(ws, widths):
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w


def _parse_gps(lat_raw, lon_raw):
    """Retourne un Point GIS valide dans la bounding box Cameroun, ou None."""
    try:
        lat = float(str(lat_raw).replace(",", ".").strip())
        lon = float(str(lon_raw).replace(",", ".").strip())
        if CAM_LAT_MIN <= lat <= CAM_LAT_MAX and CAM_LON_MIN <= lon <= CAM_LON_MAX:
            return Point(lon, lat, srid=4326)
    except (ValueError, TypeError, AttributeError):
        pass
    return None


# ===========================================================================
# EXPORTS
# ===========================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_paroisses_excel(request):
    """GET /api/exports/paroisses/excel/"""
    from apps.audit.utils import log_action

    qs = (
        Paroisse.objects
        .select_related("district", "district__region")
        .order_by("district__region__nom", "district__nom", "nom")
    )

    wb  = openpyxl.Workbook()
    ws  = wb.active
    ws.title = "Paroisses EEC"

    headers = [
        "ID", "Nom de la Paroisse", "District", "Région",
        "Adresse", "Téléphone", "Latitude", "Longitude",
        "GPS ?", "Année Création", "Active",
    ]
    ws.append(headers)
    _apply_header(ws, 1, len(headers))

    for idx, p in enumerate(qs, start=2):
        lat = round(p.position.y, 6) if p.position else ""
        lon = round(p.position.x, 6) if p.position else ""
        ws.append([
            p.id, p.nom,
            p.district.nom, p.district.region.nom,
            p.adresse, p.telephone,
            lat, lon,
            "Oui" if p.position else "Non",
            p.annee_creation or "",
            "Oui" if p.est_active else "Non",
        ])
        _apply_row(ws, idx, len(headers))

    _set_col_widths(ws, [6, 40, 25, 30, 35, 15, 12, 12, 6, 10, 6])
    ws.freeze_panes = "A2"

    log_action(request, "EXPORT", "paroisse", description=f"Export Excel paroisses — {qs.count()} lignes")
    return _excel_response(wb, f"EEC_paroisses_{date.today()}.xlsx")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_oeuvres_excel(request):
    """GET /api/exports/oeuvres/excel/"""
    from apps.audit.utils import log_action

    qs = (
        Oeuvre.objects
        .select_related(
            "type_oeuvre",
            "paroisse", "paroisse__district", "paroisse__district__region",
            "district", "district__region",
            "region",
        )
        .order_by("type_oeuvre__nom", "nom")
    )

    wb  = openpyxl.Workbook()
    ws  = wb.active
    ws.title = "Oeuvres EEC"

    headers = [
        "ID", "Nom de l'Œuvre", "Type", "Niveau",
        "Paroisse", "District", "Région",
        "Adresse", "Latitude", "Longitude",
        "Capacité", "Année Création", "Active",
    ]
    ws.append(headers)
    _apply_header(ws, 1, len(headers))

    for idx, o in enumerate(qs, start=2):
        if o.paroisse_id:
            niveau       = "Paroisse"
            paroisse_nom = o.paroisse.nom
            district_nom = o.paroisse.district.nom
            region_nom   = o.paroisse.district.region.nom
        elif o.district_id:
            niveau       = "District"
            paroisse_nom = ""
            district_nom = o.district.nom
            region_nom   = o.district.region.nom
        else:
            niveau       = "Région"
            paroisse_nom = ""
            district_nom = ""
            region_nom   = o.region.nom if o.region else ""

        lat = round(o.position.y, 6) if o.position else ""
        lon = round(o.position.x, 6) if o.position else ""

        ws.append([
            o.id, o.nom,
            o.type_oeuvre.get_nom_display(), niveau,
            paroisse_nom, district_nom, region_nom,
            o.adresse, lat, lon,
            o.capacite or "", o.annee_creation or "",
            "Oui" if o.est_active else "Non",
        ])
        _apply_row(ws, idx, len(headers))

    _set_col_widths(ws, [6, 40, 18, 12, 35, 25, 30, 35, 12, 12, 10, 10, 6])
    ws.freeze_panes = "A2"

    log_action(request, "EXPORT", "oeuvre", description=f"Export Excel œuvres — {qs.count()} lignes")
    return _excel_response(wb, f"EEC_oeuvres_{date.today()}.xlsx")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_statistiques_excel(request):
    """GET /api/exports/statistiques/excel/?annee=2025"""
    from apps.audit.utils import log_action

    annee = int(request.query_params.get("annee", date.today().year))

    qs = (
        StatistiqueAnnuelle.objects
        .filter(annee=annee)
        .select_related("paroisse", "paroisse__district", "paroisse__district__region")
        .order_by("paroisse__district__region__nom", "paroisse__district__nom", "paroisse__nom")
    )

    wb  = openpyxl.Workbook()
    ws  = wb.active
    ws.title = f"Statistiques {annee}"

    headers = [
        "Paroisse", "District", "Région",
        "Communiants", "Non-Communiants", "Total Fidèles",
        "Baptêmes", "Confirmations", "Mariages", "Décès",
        "Offrandes (FCFA)", "Dîmes (FCFA)", "Validée",
    ]
    ws.append(headers)
    _apply_header(ws, 1, len(headers))

    for idx, s in enumerate(qs, start=2):
        ws.append([
            s.paroisse.nom,
            s.paroisse.district.nom,
            s.paroisse.district.region.nom,
            s.communiants, s.non_communiants,
            s.communiants + s.non_communiants,
            s.baptemes, s.confirmations, s.mariages, s.deces,
            float(s.offrandes), float(s.dimes),
            "Oui" if s.validee else "Non",
        ])
        _apply_row(ws, idx, len(headers))

    # Ligne totaux
    last = ws.max_row + 1
    TOTAUX_FILL = PatternFill("solid", fgColor="FFF9C4")
    TOTAUX_FONT = Font(bold=True)
    ws.cell(row=last, column=1, value="TOTAL").font = TOTAUX_FONT
    for col in range(4, 13):
        letter = get_column_letter(col)
        cell   = ws.cell(row=last, column=col)
        cell.value     = f"=SUM({letter}2:{letter}{last - 1})"
        cell.font      = TOTAUX_FONT
        cell.fill      = TOTAUX_FILL
        cell.border    = CELL_BORDER

    _set_col_widths(ws, [40, 25, 30, 14, 16, 14, 12, 14, 12, 12, 16, 16, 10])
    ws.freeze_panes = "A2"

    log_action(request, "EXPORT", "statistique", description=f"Export Excel statistiques {annee} — {qs.count()} paroisses")
    return _excel_response(wb, f"EEC_statistiques_{annee}_{date.today()}.xlsx")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_statistiques_pdf(request):
    """GET /api/exports/statistiques/pdf/?annee=2025"""
    from apps.audit.utils import log_action

    try:
        from weasyprint import HTML as WeasyHTML
    except Exception:
        return Response(
            {"detail": "Génération PDF indisponible sur ce serveur."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )

    annee = int(request.query_params.get("annee", date.today().year))

    qs = list(
        StatistiqueAnnuelle.objects
        .filter(annee=annee)
        .select_related("paroisse", "paroisse__district", "paroisse__district__region")
        .order_by("paroisse__district__region__nom", "paroisse__district__nom", "paroisse__nom")
    )

    tot_com = sum(s.communiants     for s in qs)
    tot_non = sum(s.non_communiants for s in qs)
    tot_bap = sum(s.baptemes        for s in qs)
    tot_mar = sum(s.mariages        for s in qs)
    tot_dec = sum(s.deces           for s in qs)

    rows_html = ""
    for i, s in enumerate(qs):
        bg = "#f0faf0" if i % 2 == 0 else "#ffffff"
        total = s.communiants + s.non_communiants
        rows_html += (
            f'<tr style="background:{bg};">'
            f"<td>{s.paroisse.nom}</td>"
            f"<td>{s.paroisse.district.nom}</td>"
            f"<td>{s.paroisse.district.region.nom}</td>"
            f'<td class="num">{s.communiants:,}</td>'
            f'<td class="num">{s.non_communiants:,}</td>'
            f'<td class="num bold">{total:,}</td>'
            f'<td class="num">{s.baptemes:,}</td>'
            f'<td class="num">{s.mariages:,}</td>'
            f'<td class="num">{s.deces:,}</td>'
            f"</tr>\n"
        )

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<style>
  @page {{ size: A4 landscape; margin: 1.5cm; }}
  body   {{ font-family: Arial, sans-serif; font-size: 9pt; color: #1a1a1a; margin: 0; }}
  h1     {{ color: #1B5E20; font-size: 15pt; margin: 0 0 2px; }}
  h2     {{ color: #2E7D32; font-size: 10pt; margin: 0 0 6px; }}
  .meta  {{ color: #555; font-size: 7.5pt; margin-bottom: 10px; }}
  .logo  {{ float: right; color: #1B5E20; font-size: 20pt; font-weight: bold; }}
  table  {{ width: 100%; border-collapse: collapse; margin-top: 8px; }}
  th     {{ background: #1B5E20; color: #fff; padding: 5px 7px; font-size: 8.5pt; text-align: left; }}
  td     {{ padding: 4px 7px; border-bottom: 1px solid #c8e6c9; font-size: 8pt; }}
  .num   {{ text-align: right; }}
  .bold  {{ font-weight: bold; }}
  tfoot td {{ background: #fffde7; font-weight: bold; border-top: 2px solid #1B5E20; }}
</style>
</head>
<body>
<div class="logo">EEC</div>
<h1>Statistiques Annuelles {annee}</h1>
<h2>Église Évangélique du Cameroun — Plateforme de Géolocalisation</h2>
<div class="meta">
  Généré le {date.today().strftime('%d/%m/%Y')} &nbsp;·&nbsp;
  {len(qs)} paroisses &nbsp;·&nbsp;
  Total fidèles : <strong>{tot_com + tot_non:,}</strong>
</div>
<table>
<thead>
  <tr>
    <th>Paroisse</th><th>District</th><th>Région</th>
    <th>Communiants</th><th>Non-Comm.</th><th>Total Fidèles</th>
    <th>Baptêmes</th><th>Mariages</th><th>Décès</th>
  </tr>
</thead>
<tbody>
{rows_html}</tbody>
<tfoot>
  <tr>
    <td colspan="3">TOTAUX</td>
    <td class="num">{tot_com:,}</td>
    <td class="num">{tot_non:,}</td>
    <td class="num bold">{tot_com + tot_non:,}</td>
    <td class="num">{tot_bap:,}</td>
    <td class="num">{tot_mar:,}</td>
    <td class="num">{tot_dec:,}</td>
  </tr>
</tfoot>
</table>
</body>
</html>"""

    pdf_bytes = WeasyHTML(string=html).write_pdf()
    log_action(request, "EXPORT", "statistique", description=f"Export PDF statistiques {annee}")

    resp = HttpResponse(pdf_bytes, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="EEC_statistiques_{annee}.pdf"'
    return resp


# ===========================================================================
# GABARITS (templates vierges à télécharger avant import)
# ===========================================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def template_paroisses(request):
    """GET /api/exports/templates/paroisses/"""
    from openpyxl.styles import PatternFill as PF
    from openpyxl.comments import Comment

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Gabarit Paroisses EEC"

    # --- En-têtes -----------------------------------------------------------
    headers = [
        "Niveau",
        "Région Synodale *",
        "District",
        "Nom de la Paroisse *",
        "Quartier / Adresse",
        "Communiants",
        "Non-Communiants",
        "Nombre Ouvriers",
        "Coord. X (Longitude)",
        "Coord. Y (Latitude)",
        "Altitude (m)",
    ]
    ws.append(headers)
    _apply_header(ws, 1, len(headers))

    # --- Ligne d'exemple ----------------------------------------------------
    ws.append([
        "PAROISSE",
        "WOURI CENTRE",
        "WOURI",
        "Paroisse de Bonanjo",
        "Quartier Bonanjo, Douala",
        1200,
        430,
        3,
        "9.7000",
        "4.0500",
        12,
    ])
    _apply_row(ws, 2, len(headers))

    # --- Ligne d'explication ------------------------------------------------
    ws.append([
        "PAROISSE / STATION / ANNEXE",
        "Nom exact de la région synodiale",
        "Nom exact du district (optionnel si région fournie)",
        "Obligatoire",
        "Optionnel",
        "Entier ≥ 0",
        "Entier ≥ 0",
        "Entier ≥ 0",
        "Décimal ex: 9.7000",
        "Décimal ex: 4.0500",
        "En mètres (optionnel)",
    ])
    row3_fill = PF("solid", fgColor="FFF9C4")
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=3, column=col)
        cell.fill = row3_fill
        cell.font = Font(italic=True, color="555555", size=9)

    # --- Note globale -------------------------------------------------------
    note = ws.cell(row=5, column=1,
        value=(
            "RÈGLES D'IMPORT :  "
            "* = champ obligatoire  |  "
            "Région Synodale et Nom de la Paroisse sont les seuls champs OBLIGATOIRES.  |  "
            "Le District est recommandé mais optionnel (la première correspondance dans la région sera utilisée).  |  "
            "Niveau par défaut : PAROISSE  |  "
            "Coord. X = Longitude, Coord. Y = Latitude (système WGS-84, décimales, point comme séparateur).  |  "
            "Les communiants et non-communiants créent automatiquement une statistique annuelle pour l'année en cours."
        )
    )
    note.font = Font(italic=True, color="1B5E20", size=9, bold=False)
    ws.merge_cells(start_row=5, start_column=1, end_row=5, end_column=len(headers))

    _set_col_widths(ws, [18, 28, 22, 36, 32, 14, 16, 16, 20, 20, 14])
    ws.freeze_panes = "A2"
    ws.row_dimensions[1].height = 30
    ws.row_dimensions[5].height = 50

    return _excel_response(wb, "gabarit_paroisses_EEC.xlsx")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def template_oeuvres(request):
    """GET /api/exports/templates/oeuvres/"""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Gabarit Oeuvres"

    headers = [
        "Nom de l'Œuvre *",
        "Type * (SCOLAIRE|MEDICALE|AGROPASTORALE|UNIVERSITAIRE|IMMEUBLE|TERRAIN|AUTRE)",
        "Paroisse", "District", "Région",
        "Adresse", "Latitude", "Longitude", "Capacité",
    ]
    ws.append(headers)
    _apply_header(ws, 1, len(headers))
    ws.append(["École Primaire de Bonanjo", "SCOLAIRE", "Paroisse de Bonanjo", "", "", "Bonanjo, Douala", "4.0500", "9.7000", "500"])
    _apply_row(ws, 2, len(headers))
    note = ws.cell(row=4, column=1, value="* = obligatoire  |  Renseigner Paroisse OU District OU Région (un seul des trois)")
    note.font = Font(italic=True, color="666666", size=9)

    _set_col_widths(ws, [35, 50, 35, 25, 30, 35, 12, 12, 10])
    return _excel_response(wb, "gabarit_oeuvres.xlsx")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def template_ouvriers(request):
    """GET /api/exports/templates/ouvriers/"""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Gabarit Ouvriers"

    headers = [
        "Nom *", "Prénom *", "Sexe * (M/F)",
        "Grade (nom exact)",
        "Paroisse * (nom exact)",
        "Statut (ACTIF|RETRAITE|SUSPENDU|DECEDE)",
        "Téléphone",
    ]
    ws.append(headers)
    _apply_header(ws, 1, len(headers))
    ws.append(["MBELE", "Jean Pierre", "M", "Pasteur", "Paroisse de Bonanjo", "ACTIF", "699000000"])
    _apply_row(ws, 2, len(headers))
    note = ws.cell(row=4, column=1, value="* = obligatoire  |  Grade et Paroisse doivent correspondre exactement aux noms en base")
    note.font = Font(italic=True, color="666666", size=9)

    _set_col_widths(ws, [20, 25, 8, 20, 35, 30, 15])
    return _excel_response(wb, "gabarit_ouvriers.xlsx")


# ===========================================================================
# IMPORTS
# ===========================================================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_paroisses(request):
    """
    POST /api/imports/paroisses/
    Body : multipart/form-data, champ « file » (.xlsx)

    Colonnes (ligne 1 = en-tête ignorée) :
      A  Niveau              (optionnel : PAROISSE/STATION/ANNEXE, défaut PAROISSE)
      B  Région Synodale     (OBLIGATOIRE)
      C  District            (optionnel — fallback : premier district de la région)
      D  Nom de la Paroisse  (OBLIGATOIRE)
      E  Quartier/Adresse    (optionnel)
      F  Communiants         (optionnel — crée/met à jour StatistiqueAnnuelle année courante)
      G  Non-Communiants     (optionnel)
      H  Nombre Ouvriers     (optionnel — informatif uniquement)
      I  Coord. X (Longitude)(optionnel)
      J  Coord. Y (Latitude) (optionnel)
      K  Altitude            (optionnel — non stocké)
    """
    from apps.audit.utils import log_action
    from datetime import date as _date

    if request.user.role not in ("SUPER", "REGION", "DISTRICT"):
        return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "Champ 'file' manquant."}, status=status.HTTP_400_BAD_REQUEST)
    if not file_obj.name.lower().endswith((".xlsx", ".xls")):
        return Response({"detail": "Format non supporté. Utilisez .xlsx"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        wb = openpyxl.load_workbook(file_obj, read_only=True, data_only=True)
        ws = wb.active
    except Exception as exc:
        return Response({"detail": f"Impossible de lire le fichier : {exc}"}, status=status.HTTP_400_BAD_REQUEST)

    # Caches pour éviter N+1 queries
    regions_cache   = {r.nom.strip().upper(): r for r in RegionSynodale.objects.all()}
    districts_cache = {(d.nom.strip().upper(), d.region_id): d
                       for d in District.objects.select_related("region")}
    # Index districts par région : region_id → [district, ...]
    from collections import defaultdict
    districts_by_region: dict = defaultdict(list)
    for (dnom, rid), d in districts_cache.items():
        districts_by_region[rid].append(d)

    NIVEAUX_VALIDES = {"PAROISSE", "STATION", "ANNEXE"}
    annee_courante  = _date.today().year

    def _str(val, default=""):
        return str(val).strip() if val not in (None, "") else default

    def _int_or_none(val):
        try:
            return max(0, int(float(str(val).replace(",", ".").strip())))
        except (ValueError, TypeError):
            return None

    created = updated = 0
    errors  = []
    rows    = list(ws.iter_rows(min_row=2, values_only=True))
    preview = []  # lignes importées pour l'aperçu

    for i, row in enumerate(rows, start=2):
        if not row or all(v is None or str(v).strip() == "" for v in row):
            continue

        # --- Lecture des colonnes -------------------------------------------
        niveau_raw   = _str(row[0] if len(row) > 0 else None)
        nom_region   = _str(row[1] if len(row) > 1 else None)
        nom_district = _str(row[2] if len(row) > 2 else None)
        nom_paroisse = _str(row[3] if len(row) > 3 else None)
        adresse      = _str(row[4] if len(row) > 4 else None)
        communiants  = _int_or_none(row[5] if len(row) > 5 else None)
        non_comm     = _int_or_none(row[6] if len(row) > 6 else None)
        # ouvriers (col H) = informatif, non importé
        lon_raw      = row[8] if len(row) > 8 else None
        lat_raw      = row[9] if len(row) > 9 else None
        # altitude (col K) = non stockée

        # --- Validation des champs obligatoires ----------------------------
        if not nom_paroisse:
            errors.append({"ligne": i, "erreur": "Nom de paroisse vide (colonne D obligatoire)"}); continue
        if not nom_region:
            errors.append({"ligne": i, "erreur": "Région synodiale vide (colonne B obligatoire)"}); continue

        # --- Résolution de la région ---------------------------------------
        region = regions_cache.get(nom_region.upper())
        if not region:
            errors.append({"ligne": i, "erreur": f"Région '{nom_region}' introuvable en base"}); continue

        # RBAC région
        if request.user.role == "REGION" and region.id != request.user.region_id:
            errors.append({"ligne": i, "erreur": f"Région '{nom_region}' hors de votre périmètre"}); continue

        # --- Résolution du district ----------------------------------------
        district = None
        if nom_district:
            district = districts_cache.get((nom_district.upper(), region.id))
            if not district:
                # Tolérance : chercher par nom seul dans toute la région
                for (dn, rid), d in districts_cache.items():
                    if dn == nom_district.upper() and rid == region.id:
                        district = d; break
            if not district:
                errors.append({"ligne": i, "erreur": f"District '{nom_district}' introuvable dans la région '{nom_region}'"}); continue
        else:
            # Fallback : premier district alphabétique de la région
            candidats = sorted(districts_by_region.get(region.id, []), key=lambda d: d.nom)
            if not candidats:
                errors.append({"ligne": i, "erreur": f"Aucun district trouvé dans la région '{nom_region}'"}); continue
            district = candidats[0]

        # RBAC district
        if request.user.role == "DISTRICT" and district.id != request.user.district_id:
            errors.append({"ligne": i, "erreur": f"District hors de votre périmètre"}); continue

        # --- Niveau --------------------------------------------------------
        niveau = niveau_raw.upper() if niveau_raw.upper() in NIVEAUX_VALIDES else "PAROISSE"

        # --- GPS -----------------------------------------------------------
        position = _parse_gps(lat_raw, lon_raw)

        # --- Création / mise à jour Paroisse -------------------------------
        paroisse, was_created = Paroisse.objects.get_or_create(
            nom__iexact=nom_paroisse,
            district=district,
            defaults={
                "nom":      nom_paroisse,
                "adresse":  adresse,
                "niveau":   niveau,
                "position": position,
                "est_active": True,
            },
        )

        if was_created:
            created += 1
        else:
            changed = []
            if adresse  and not paroisse.adresse:   paroisse.adresse  = adresse;  changed.append("adresse")
            if position and not paroisse.position:  paroisse.position = position; changed.append("position")
            if niveau   and paroisse.niveau != niveau: paroisse.niveau = niveau;  changed.append("niveau")
            if changed:
                paroisse.save(update_fields=changed)
                updated += 1

        # --- Statistiques annuelles (si communiants fournis) ---------------
        if communiants is not None or non_comm is not None:
            stat, _ = StatistiqueAnnuelle.objects.get_or_create(
                paroisse=paroisse, annee=annee_courante,
                defaults={
                    "communiants":     communiants or 0,
                    "non_communiants": non_comm    or 0,
                },
            )
            if not _:  # existait déjà → mise à jour si plus complet
                changed = False
                if communiants is not None and stat.communiants == 0:
                    stat.communiants = communiants; changed = True
                if non_comm is not None and stat.non_communiants == 0:
                    stat.non_communiants = non_comm; changed = True
                if changed:
                    stat.save(update_fields=["communiants", "non_communiants"])

        # --- Aperçu --------------------------------------------------------
        preview.append({
            "nom":      paroisse.nom,
            "niveau":   paroisse.niveau,
            "region":   region.nom,
            "district": district.nom,
            "adresse":  paroisse.adresse or "",
            "gps":      position is not None,
            "communiants": communiants or 0,
            "non_communiants": non_comm or 0,
            "statut":   "Créé" if was_created else "Mis à jour",
        })

    log_action(
        request, "IMPORT", "paroisse",
        description=f"Import paroisses — {created} créées, {updated} mises à jour, {len(errors)} erreurs",
    )
    return Response({
        "created":      created,
        "updated":      updated,
        "errors_count": len(errors),
        "errors":       errors[:50],
        "total_lignes": len(rows),
        "preview":      preview[:100],  # Aperçu des 100 premières lignes importées
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_oeuvres(request):
    """
    POST /api/imports/oeuvres/
    Body : multipart/form-data, champ « file » (.xlsx)

    Colonnes :
      A  Nom de l'œuvre  (obligatoire)
      B  Type            (SCOLAIRE|MEDICALE|AGROPASTORALE|UNIVERSITAIRE|IMMEUBLE|TERRAIN|AUTRE)
      C  Paroisse        (nom exact, optionnel)
      D  District        (nom exact, optionnel)
      E  Région          (nom exact, optionnel)
      F  Adresse
      G  Latitude
      H  Longitude
      I  Capacité        (entier)
    """
    from apps.audit.utils import log_action

    if request.user.role not in ("SUPER", "REGION", "DISTRICT"):
        return Response({"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN)

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "Champ 'file' manquant."}, status=status.HTTP_400_BAD_REQUEST)
    if not file_obj.name.lower().endswith((".xlsx", ".xls")):
        return Response({"detail": "Format non supporté. Utilisez .xlsx"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        wb = openpyxl.load_workbook(file_obj, read_only=True, data_only=True)
        ws = wb.active
    except Exception as exc:
        return Response({"detail": f"Impossible de lire le fichier : {exc}"}, status=status.HTTP_400_BAD_REQUEST)

    TYPES_VALIDES   = {"SCOLAIRE", "MEDICALE", "AGROPASTORALE", "UNIVERSITAIRE", "IMMEUBLE", "TERRAIN", "AUTRE"}
    types_cache     = {t.nom.upper(): t           for t in TypeOeuvre.objects.all()}
    paroisses_cache = {p.nom.strip().upper(): p   for p in Paroisse.objects.all()}
    districts_cache = {d.nom.strip().upper(): d   for d in District.objects.all()}
    regions_cache   = {r.nom.strip().upper(): r   for r in RegionSynodale.objects.all()}

    created = updated = 0
    errors  = []
    rows    = list(ws.iter_rows(min_row=2, values_only=True))

    for i, row in enumerate(rows, start=2):
        if not row or not row[0]:
            continue

        nom      = str(row[0]).strip()                          if row[0]                   else ""
        type_str = str(row[1]).strip().upper()                  if len(row) > 1 and row[1]  else ""
        par_nom  = str(row[2]).strip()                          if len(row) > 2 and row[2]  else ""
        dis_nom  = str(row[3]).strip()                          if len(row) > 3 and row[3]  else ""
        reg_nom  = str(row[4]).strip()                          if len(row) > 4 and row[4]  else ""
        adresse  = str(row[5]).strip()                          if len(row) > 5 and row[5]  else ""
        lat_raw  = row[6]                                        if len(row) > 6             else None
        lon_raw  = row[7]                                        if len(row) > 7             else None
        cap_raw  = row[8]                                        if len(row) > 8             else None

        if not nom:
            errors.append({"ligne": i, "erreur": "Nom d'œuvre vide"}); continue
        if type_str not in TYPES_VALIDES:
            errors.append({"ligne": i, "erreur": f"Type '{type_str}' invalide. Valeurs acceptées : {', '.join(sorted(TYPES_VALIDES))}"}); continue

        type_oeuvre = types_cache.get(type_str)
        if not type_oeuvre:
            errors.append({"ligne": i, "erreur": f"Type '{type_str}' introuvable en base"}); continue

        paroisse = district = region = None
        if par_nom:
            paroisse = paroisses_cache.get(par_nom.upper())
            if not paroisse:
                errors.append({"ligne": i, "erreur": f"Paroisse '{par_nom}' introuvable"}); continue
        elif dis_nom:
            district = districts_cache.get(dis_nom.upper())
            if not district:
                errors.append({"ligne": i, "erreur": f"District '{dis_nom}' introuvable"}); continue
        elif reg_nom:
            region = regions_cache.get(reg_nom.upper())
            if not region:
                errors.append({"ligne": i, "erreur": f"Région '{reg_nom}' introuvable"}); continue
        else:
            errors.append({"ligne": i, "erreur": "Renseigner Paroisse, District ou Région"}); continue

        position = _parse_gps(lat_raw, lon_raw)
        capacite = None
        try:
            capacite = int(cap_raw) if cap_raw else None
        except (ValueError, TypeError):
            pass

        oeuvre, was_created = Oeuvre.objects.get_or_create(
            nom=nom, type_oeuvre=type_oeuvre,
            paroisse=paroisse, district=district, region=region,
            defaults={"adresse": adresse, "position": position, "capacite": capacite},
        )

        if was_created:
            created += 1
        else:
            changed = False
            if adresse  and not oeuvre.adresse:  oeuvre.adresse  = adresse;  changed = True
            if position and not oeuvre.position: oeuvre.position = position; changed = True
            if capacite and not oeuvre.capacite: oeuvre.capacite = capacite; changed = True
            if changed:
                oeuvre.save(); updated += 1

    log_action(
        request, "IMPORT", "oeuvre",
        description=f"Import œuvres — {created} créées, {updated} mises à jour, {len(errors)} erreurs",
    )
    return Response({
        "created": created, "updated": updated,
        "errors_count": len(errors), "errors": errors[:50], "total_lignes": len(rows),
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_ouvriers(request):
    """
    POST /api/imports/ouvriers/
    Body : multipart/form-data, champ « file » (.xlsx)

    Colonnes :
      A  Nom       (obligatoire)
      B  Prénom    (obligatoire)
      C  Sexe      (M/F)
      D  Grade     (nom exact en base, optionnel)
      E  Paroisse  (nom exact en base, obligatoire)
      F  Statut    (ACTIF|RETRAITE|SUSPENDU|DECEDE — défaut : ACTIF)
      G  Téléphone (optionnel)
    """
    from apps.audit.utils import log_action

    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "Champ 'file' manquant."}, status=status.HTTP_400_BAD_REQUEST)
    if not file_obj.name.lower().endswith((".xlsx", ".xls")):
        return Response({"detail": "Format non supporté. Utilisez .xlsx"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        wb = openpyxl.load_workbook(file_obj, read_only=True, data_only=True)
        ws = wb.active
    except Exception as exc:
        return Response({"detail": f"Impossible de lire le fichier : {exc}"}, status=status.HTTP_400_BAD_REQUEST)

    STATUTS_VALIDES = {"ACTIF", "RETRAITE", "SUSPENDU", "DECEDE"}
    grades_cache    = {g.nom.strip().upper(): g for g in Grade.objects.all()}
    paroisses_cache = {p.nom.strip().upper(): p for p in Paroisse.objects.select_related("district__region")}

    created = updated = 0
    errors  = []
    rows    = list(ws.iter_rows(min_row=2, values_only=True))

    for i, row in enumerate(rows, start=2):
        if not row or not row[0]:
            continue

        nom       = str(row[0]).strip().upper() if row[0]                          else ""
        prenom    = str(row[1]).strip()         if len(row) > 1 and row[1]         else ""
        sexe      = str(row[2]).strip().upper() if len(row) > 2 and row[2]         else "M"
        grade_str = str(row[3]).strip().upper() if len(row) > 3 and row[3]         else ""
        par_nom   = str(row[4]).strip()         if len(row) > 4 and row[4]         else ""
        statut    = str(row[5]).strip().upper() if len(row) > 5 and row[5]         else "ACTIF"
        telephone = str(row[6]).strip()         if len(row) > 6 and row[6]         else ""

        if not nom:   errors.append({"ligne": i, "erreur": "Nom vide"});    continue
        if not prenom: errors.append({"ligne": i, "erreur": "Prénom vide"}); continue
        if not par_nom: errors.append({"ligne": i, "erreur": "Paroisse vide"}); continue
        if sexe not in ("M", "F"):
            errors.append({"ligne": i, "erreur": f"Sexe '{sexe}' invalide (M ou F)"}); continue
        if statut not in STATUTS_VALIDES:
            statut = "ACTIF"

        paroisse = paroisses_cache.get(par_nom.upper())
        if not paroisse:
            errors.append({"ligne": i, "erreur": f"Paroisse '{par_nom}' introuvable"}); continue

        # RBAC
        if request.user.role == "REGION" and paroisse.district.region_id != request.user.region_id:
            errors.append({"ligne": i, "erreur": "Paroisse hors de votre scope régional"}); continue
        if request.user.role == "DISTRICT" and paroisse.district_id != request.user.district_id:
            errors.append({"ligne": i, "erreur": "Paroisse hors de votre scope district"}); continue
        if request.user.role == "PAROISSE" and paroisse.id != request.user.paroisse_id:
            errors.append({"ligne": i, "erreur": "Paroisse hors de votre scope"}); continue

        grade = grades_cache.get(grade_str) if grade_str else None

        ouvrier, was_created = Ouvrier.objects.get_or_create(
            nom=nom, prenom=prenom, paroisse=paroisse,
            defaults={"sexe": sexe, "grade": grade, "statut": statut, "telephone": telephone},
        )

        if was_created:
            created += 1
        else:
            changed = False
            if telephone and not ouvrier.telephone: ouvrier.telephone = telephone; changed = True
            if grade      and not ouvrier.grade:    ouvrier.grade     = grade;     changed = True
            if changed:
                ouvrier.save(); updated += 1

    log_action(
        request, "IMPORT", "ouvrier",
        description=f"Import ouvriers — {created} créés, {updated} mis à jour, {len(errors)} erreurs",
    )
    return Response({
        "created": created, "updated": updated,
        "errors_count": len(errors), "errors": errors[:50], "total_lignes": len(rows),
    })
