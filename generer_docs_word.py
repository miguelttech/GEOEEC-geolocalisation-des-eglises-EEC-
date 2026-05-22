"""
Génère les documents Word du projet EEC Géolocalisation.
Lance avec : python generer_docs_word.py
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# ─── COULEURS EEC ────────────────────────────────────────────────────────────
VERT_FONCE   = RGBColor(0x16, 0x65, 0x34)   # #166534
VERT_MOYEN   = RGBColor(0x15, 0x80, 0x3D)   # #15803D
VERT_CLAIR   = RGBColor(0x16, 0xA3, 0x4A)   # #16A34A
VERT_PALE    = RGBColor(0xDC, 0xFC, 0xE7)   # #DCFCE7
OR_PRINCIPAL = RGBColor(0xEA, 0xB3, 0x08)   # #EAB308
OR_PALE      = RGBColor(0xFE, 0xF9, 0xC3)   # #FEF9C3
GRIS_CLAIR   = RGBColor(0xF1, 0xF5, 0xF9)   # #F1F5F9
GRIS_MOYEN   = RGBColor(0xE2, 0xE8, 0xF0)   # #E2E8F0
TEXTE_FONCE  = RGBColor(0x0F, 0x17, 0x2A)   # #0F172A
BLANC        = RGBColor(0xFF, 0xFF, 0xFF)


def hex_to_rgb_str(hex_str):
    h = hex_str.lstrip('#')
    return h.upper()


def set_cell_background(cell, hex_color):
    """Définit la couleur de fond d'une cellule."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color.lstrip('#').upper())
    tcPr.append(shd)


def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    """Définit les bordures d'une cellule."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for side, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        if val:
            border = OxmlElement(f'w:{side}')
            border.set(qn('w:val'), 'single')
            border.set(qn('w:sz'), '4')
            border.set(qn('w:space'), '0')
            border.set(qn('w:color'), val.lstrip('#').upper())
            tcBorders.append(border)
    tcPr.append(tcBorders)


def configure_styles(doc):
    """Configure les styles du document."""
    styles = doc.styles

    # Style Normal
    normal = styles['Normal']
    normal.font.name = 'Calibri'
    normal.font.size = Pt(11)
    normal.font.color.rgb = TEXTE_FONCE
    normal.paragraph_format.space_after = Pt(6)

    # Heading 1
    h1 = styles['Heading 1']
    h1.font.name = 'Calibri'
    h1.font.size = Pt(20)
    h1.font.bold = True
    h1.font.color.rgb = VERT_FONCE
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(8)
    h1.paragraph_format.keep_with_next = True

    # Heading 2
    h2 = styles['Heading 2']
    h2.font.name = 'Calibri'
    h2.font.size = Pt(15)
    h2.font.bold = True
    h2.font.color.rgb = VERT_MOYEN
    h2.paragraph_format.space_before = Pt(14)
    h2.paragraph_format.space_after = Pt(6)
    h2.paragraph_format.keep_with_next = True

    # Heading 3
    h3 = styles['Heading 3']
    h3.font.name = 'Calibri'
    h3.font.size = Pt(13)
    h3.font.bold = True
    h3.font.color.rgb = TEXTE_FONCE
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(4)
    h3.paragraph_format.keep_with_next = True

    # Heading 4
    try:
        h4 = styles['Heading 4']
    except Exception:
        h4 = styles.add_style('Heading 4', 1)
    h4.font.name = 'Calibri'
    h4.font.size = Pt(11)
    h4.font.bold = True
    h4.font.italic = True
    h4.font.color.rgb = VERT_MOYEN
    h4.paragraph_format.space_before = Pt(8)
    h4.paragraph_format.space_after = Pt(4)

    # Code
    try:
        code_style = styles['Code']
    except Exception:
        code_style = styles.add_style('Code', 1)
    code_style.font.name = 'Courier New'
    code_style.font.size = Pt(9)
    code_style.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)
    code_style.paragraph_format.space_after = Pt(0)
    code_style.paragraph_format.left_indent = Cm(0.5)


def add_title_block(doc, titre, sous_titre, date, version):
    """Ajoute le bloc de titre stylisé en début de document."""
    # Bordure haute verte
    para = doc.add_paragraph()
    run = para.add_run('─' * 80)
    run.font.color.rgb = VERT_MOYEN
    run.font.size = Pt(8)
    para.paragraph_format.space_after = Pt(4)

    # Titre principal
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(titre)
    run.font.name = 'Calibri'
    run.font.size = Pt(22)
    run.font.bold = True
    run.font.color.rgb = VERT_FONCE
    p.paragraph_format.space_after = Pt(4)

    # Sous-titre
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run(sous_titre)
    run2.font.name = 'Calibri'
    run2.font.size = Pt(13)
    run2.font.color.rgb = VERT_MOYEN
    run2.font.italic = True
    p2.paragraph_format.space_after = Pt(4)

    # Méta
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run3 = p3.add_run(f'{date}  ·  {version}  ·  Confidentiel EEC')
    run3.font.name = 'Calibri'
    run3.font.size = Pt(10)
    run3.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    p3.paragraph_format.space_after = Pt(4)

    # Bordure basse verte
    para2 = doc.add_paragraph()
    run4 = para2.add_run('─' * 80)
    run4.font.color.rgb = VERT_MOYEN
    run4.font.size = Pt(8)
    para2.paragraph_format.space_after = Pt(16)


def add_heading(doc, text, level=1):
    """Ajoute un titre avec style EEC."""
    return doc.add_heading(text, level=level)


def add_body(doc, text):
    """Ajoute un paragraphe de texte avec gestion du gras et de l'italique."""
    para = doc.add_paragraph()
    para.style = doc.styles['Normal']
    _parse_inline(para, text)
    return para


def _parse_inline(para, text):
    """Parse le texte inline avec ** pour gras et ⚠️ mis en évidence."""
    import re
    parts = re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = para.add_run(part[2:-2])
            run.bold = True
        elif part.startswith('`') and part.endswith('`'):
            run = para.add_run(part[1:-1])
            run.font.name = 'Courier New'
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0x9D, 0x17, 0x4D)
        else:
            para.add_run(part)


def add_bullet(doc, text, level=0):
    """Ajoute un élément de liste à puces."""
    para = doc.add_paragraph(style='List Bullet')
    para.paragraph_format.left_indent = Cm(0.5 + level * 0.5)
    para.paragraph_format.space_after = Pt(3)
    _parse_inline(para, text)
    return para


def add_numbered(doc, text, number):
    """Ajoute un élément de liste numérotée."""
    para = doc.add_paragraph(style='List Number')
    para.paragraph_format.space_after = Pt(3)
    _parse_inline(para, text)
    return para


def add_code_block(doc, code_lines, language=''):
    """Ajoute un bloc de code avec fond gris."""
    # Cadre gris
    table = doc.add_table(rows=1, cols=1)
    table.style = 'Table Grid'
    cell = table.rows[0].cells[0]
    set_cell_background(cell, '#F1F5F9')

    for i, line in enumerate(code_lines.split('\n')):
        if i == 0:
            p = cell.paragraphs[0]
        else:
            p = cell.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        run = p.add_run(line)
        run.font.name = 'Courier New'
        run.font.size = Pt(9)
        run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)


def add_info_box(doc, text, color_hex='#DCFCE7', icon='ℹ'):
    """Ajoute une boîte d'information colorée."""
    table = doc.add_table(rows=1, cols=1)
    table.style = 'Table Grid'
    cell = table.rows[0].cells[0]
    set_cell_background(cell, color_hex)
    p = cell.paragraphs[0]
    run = p.add_run(f'{icon}  {text}')
    run.font.name = 'Calibri'
    run.font.size = Pt(10)
    doc.add_paragraph().paragraph_format.space_after = Pt(4)


def add_table(doc, headers, rows, header_bg='#166534', header_fg='#FFFFFF',
              alt_row_bg='#F0FDF4'):
    """Ajoute un tableau stylisé avec en-tête coloré."""
    col_count = len(headers)
    row_count = len(rows)
    table = doc.add_table(rows=1 + row_count, cols=col_count)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.LEFT

    # En-tête
    header_row = table.rows[0]
    for i, h in enumerate(headers):
        cell = header_row.cells[i]
        set_cell_background(cell, header_bg)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(h)
        run.font.name = 'Calibri'
        run.font.size = Pt(10)
        run.font.bold = True
        run.font.color.rgb = BLANC
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    # Données
    for r_idx, row_data in enumerate(rows):
        row = table.rows[r_idx + 1]
        bg = alt_row_bg if r_idx % 2 == 0 else '#FFFFFF'
        for c_idx, cell_text in enumerate(row_data):
            cell = row.cells[c_idx]
            set_cell_background(cell, bg)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            _parse_inline(p, str(cell_text))
            for run in p.runs:
                run.font.name = 'Calibri'
                run.font.size = Pt(10)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return table


def add_separator(doc):
    """Ajoute une ligne séparatrice."""
    para = doc.add_paragraph()
    run = para.add_run('─' * 80)
    run.font.color.rgb = VERT_CLAIR
    run.font.size = Pt(8)
    para.paragraph_format.space_after = Pt(8)
    para.paragraph_format.space_before = Pt(8)


# ════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 1 — MASTER PROMPT v3
# ════════════════════════════════════════════════════════════════════════════

def generer_master_prompt():
    doc = Document()

    # Format page
    section = doc.sections[0]
    section.page_width  = Cm(21)
    section.page_height = Cm(29.7)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)
    section.top_margin    = Cm(2.5)
    section.bottom_margin = Cm(2)

    configure_styles(doc)

    # ── TITRE
    add_title_block(doc,
        'MASTER PROMPT v3',
        'Plateforme Web de Géolocalisation des Paroisses et Œuvres de l\'EEC',
        '21 mai 2026',
        'Version 3 — Référence définitive')

    add_info_box(doc,
        'Ce document est la source de vérité absolue du projet. À copier intégralement '
        'comme prompt initial dans Antigravity ou tout autre modèle agentique. '
        'Il intègre toutes les fonctionnalités de l\'ancienne version et le modèle '
        'd\'accès mis à jour.',
        '#FEF9C3', '⭐')

    # ── 1. RÔLE
    add_heading(doc, '1. Rôle attendu du modèle IA', 1)
    add_body(doc, 'Tu es un **ingénieur logiciel full-stack senior (10+ ans)** spécialisé en :')
    for item in [
        'SIG web : PostGIS, GeoDjango, GeoServer, Leaflet, GeoJSON, WMS / WFS / WMTS, EPSG, SLD',
        'Backend Python : Django 5, Django REST Framework, DRF-GIS',
        'Frontend moderne : Next.js 14+ App Router, TypeScript, Tailwind CSS, shadcn/ui',
        'Conteneurisation : Docker, Docker Compose multi-services',
        'Sécurité applicative : OWASP Top 10, RBAC, audit trail, hardening Java (GeoServer)',
        'Accessibilité : WCAG 2.1 niveau AA, ergonomie pour personnes âgées',
    ]:
        add_bullet(doc, item)

    add_body(doc,
        'Tu es également un **pédagogue rigoureux**. Tu expliques chaque concept SIG inconnu '
        'au premier emploi, chaque commande shell avant exécution, chaque choix d\'architecture '
        'en 2 phrases. Tu travailles dans **Antigravity** et ne fais JAMAIS une étape sans avoir '
        'vérifié que la précédente fonctionne réellement.')

    # ── 2. CONTEXTE
    add_heading(doc, '2. Contexte non négociable du projet', 1)
    add_body(doc,
        'Tu construis la **plateforme web officielle de géolocalisation nationale des paroisses '
        'et œuvres de l\'Église Évangélique du Cameroun (EEC)**, commanditée directement par '
        'la Direction Nationale de l\'EEC.')

    add_table(doc,
        ['Caractéristique', 'Détail'],
        [
            ['Type de projet', 'Institutionnel réel, sérieux, sensible, confidentiel'],
            ['Public cible', 'Inclut des personnes âgées (pasteurs, anciens, dirigeants)'],
            ['Qualité', 'Professionnelle irréprochable. Aucun TODO silencieux.'],
            ['Sécurité', 'Maximale — données sensibles : fidèles, contacts, géolocalisation'],
            ['Langue', 'Interface et documentation en français. Code en anglais.'],
            ['Régions synodales', '22 polygones'],
            ['Districts', '134'],
            ['Paroisses', '693 (dont 255 sans GPS)'],
            ['Ouvriers', '708 (pasteurs, évangélistes, diacres permanents…)'],
            ['Œuvres', 'Plusieurs centaines (scolaires, médicales, agropastorales, immeubles…)'],
        ]
    )

    # ── 3. MODÈLE D'ACCÈS
    add_heading(doc, '3. Modèle d\'accès utilisateur (mis à jour v3)', 1)

    add_heading(doc, '3.1 Deux catégories d\'accès', 2)

    add_heading(doc, 'Visiteurs — aucun compte requis (accès public)', 3)
    for item in [
        'Consultation de la carte interactive publique',
        'Visualisation des régions, paroisses, districts, œuvres sur la carte',
        'Popups d\'informations au clic sur les entités',
        'Statistiques publiques par région',
        'Recherche multicritère (par nom, région, district, type)',
        'Page d\'accueil institutionnelle',
    ]:
        add_bullet(doc, item)

    add_heading(doc, 'Administrateurs — compte obligatoire (4 niveaux RBAC)', 3)
    add_table(doc,
        ['Rôle', 'Code', 'Périmètre d\'accès'],
        [
            ['Super Administrateur National', 'SUPER', 'Accès total à tout'],
            ['Administrateur Régional',       'REGION',  'Sa région uniquement'],
            ['Administrateur District',        'DISTRICT', 'Son district uniquement'],
            ['Administrateur Paroissial',      'PAROISSE', 'Sa paroisse uniquement'],
        ]
    )

    add_heading(doc, '3.2 Ce qu\'on ne fait PAS pour l\'instant', 3)
    add_info_box(doc,
        'Il n\'y a PAS de compte pour les utilisateurs lambda (fidèles ordinaires). '
        'Ce type de compte pourra être ajouté dans une version ultérieure si l\'EEC le demande. '
        'Pour l\'instant : soit visiteur anonyme, soit administrateur avec compte.',
        '#FEF9C3', '⚠️')

    # ── 4. RESSOURCES
    add_heading(doc, '4. Ressources disponibles dans le projet', 1)

    add_heading(doc, '4.1 Données métier à importer', 2)
    add_table(doc,
        ['Fichier', 'Contenu', 'Points critiques'],
        [
            ['Recap_paroisses_…xlsx', '693 paroisses × 23 colonnes',
             '⚠️ Coord_x = LATITUDE, Coord_y = LONGITUDE (inversion !) → Point(Coord_y, Coord_x)'],
            ['OUVRIERS.xlsx', '708 ouvriers × 24 colonnes',
             'Grades à normaliser : Ev, EV, Évangéliste → table Grade'],
            ['Recap_oeuvres_EEC_2025.xlsx', '3 feuilles pivot',
             'Dépivoter : Oeuvres_regionales + Oeuvres_districts + Oeuvres_paroissialles'],
            ['Region_synodale_ok2.shp', '22 polygones EPSG:4326',
             '5 incohérences de noms DBF ↔ Excel (voir tableau ci-dessous)'],
        ]
    )

    add_heading(doc, '4.2 Incohérences de noms de régions — Table de correspondance', 3)
    add_info_box(doc,
        'Ces 5 incohérences DOIVENT être résolues dans les commandes d\'import. '
        'Ne jamais stocker le mauvais nom en base.',
        '#FEF9C3', '⚠️')
    add_table(doc,
        ['Shapefile DBF (source)', 'Excel (cible à normaliser)'],
        [
            ['HAUT-NKAM',              'HAUT NKAM'],
            ['HAUTS-PLATEAUX',         'HAUTS PLATEAUX'],
            ['MOUNGO SUD ET MEME',     'MOUNGO SUD & MEME'],
            ['NDE & MBAM ET INOUBOU',  'NDE MBAM ET INOUBOU'],
            ['NORD & EXTREME NORD',    'NORD & EXTREME-NORD'],
        ],
        header_bg='#CA8A04'
    )

    add_heading(doc, '4.3 Assets Bureau National', 3)
    add_body(doc, 'Photos récupérées depuis `geoeec_ancienne_version/` à copier dans `frontend/public/bureau_national/` :')
    for item in [
        'logoEEC.png — Logo officiel EEC',
        'president.png — Président de l\'EEC',
        'vp.png, vp2.png, vp3.png — Vice-Présidents',
        'se.png, se2.png, se3.png, se4.png — Secrétaires',
        'tre.png — Trésorier',
        'cameroon-outline.svg — Contour du Cameroun',
    ]:
        add_bullet(doc, item)

    # ── 5. STACK
    add_heading(doc, '5. Stack technique — Tranchée, ne pas remettre en question', 1)
    add_table(doc,
        ['Couche', 'Technologie', 'Version', 'Rôle'],
        [
            ['Frontend',       'Next.js + App Router + TypeScript', '14.2+',     'SSR/SSG, dashboards admin'],
            ['Styling',        'Tailwind CSS + shadcn/ui',          'Tailwind 3.4+', 'UI institutionnelle accessible'],
            ['Carte',          'Leaflet + react-leaflet',           '1.9+',      'Carte interactive, consomme WMS/WFS GeoServer'],
            ['Backend API',    'Django + GeoDjango + DRF + DRF-GIS','Django 5.0 LTS', 'Auth, RBAC, CRUD, audit, imports, exports'],
            ['Auth',           'Sessions Django',                   'natif',     'HttpOnly + Secure + SameSite=Strict'],
            ['Base spatiale',  'PostgreSQL + PostGIS',              '16 + 3.4',  'Source de vérité données spatiales'],
            ['Serveur carto',  'GeoServer',                         '2.26+',     'Publication WMS/WFS/WMTS standardisée OGC'],
            ['Cache',          'Redis',                             '7+',        'Cache réponses Django, sessions partagées'],
            ['Conteneurs',     'Docker + Docker Compose',           'récent',    'Iso-environnement, 5 services'],
            ['2FA',            'django-otp',                        'récent',    'TOTP obligatoire SUPER et REGION'],
            ['Tests backend',  'pytest + pytest-django',            'récents',   'Standard industrie'],
            ['Tests frontend', 'Vitest + Playwright',               'récents',   'Tests E2E'],
        ]
    )

    # ── 6. IDENTITÉ VISUELLE
    add_heading(doc, '6. Identité visuelle EEC', 1)
    add_table(doc,
        ['Couleur', 'Code hex', 'Usage'],
        [
            ['Vert foncé',   '#166534', 'Header, sidebar admin, titres principaux'],
            ['Vert moyen',   '#15803D', 'Boutons primaires, régions carte (contour)'],
            ['Vert clair',   '#16A34A', 'Paroisses carte (remplissage), éléments actifs'],
            ['Or principal', '#EAB308', 'Accent : hover, badges statistiques, œuvres carte'],
            ['Blanc',        '#FFFFFF', 'Fond principal de page'],
            ['Texte foncé',  '#0F172A', 'Corps de texte principal'],
        ]
    )
    add_body(doc, '**Typographie :** Inter (Google Fonts), taille de base 17 px, `leading-relaxed` sur paragraphes.')
    add_body(doc, '**Composants :** shadcn/ui, boutons hauteur min 44 px, icônes lucide-react uniquement.')
    add_body(doc, '**Accessibilité WCAG 2.1 AA (non négociable) :** contraste ≥ 4.5:1, zones cliquables ≥ 44×44 px, `lang="fr"` sur `<html>`.')

    # ── 7. MODÈLES DJANGO
    add_heading(doc, '7. Modèles Django — Liste complète (14 modèles)', 1)

    add_heading(doc, '7.1 App accounts', 2)
    add_table(doc, ['Champ', 'Type', 'Description'],
        [
            ['role',      'CharField (choices)', 'SUPER / REGION / DISTRICT / PAROISSE'],
            ['region',    'FK RegionSynodale',  'Périmètre géographique de l\'admin'],
            ['district',  'FK District',        'Périmètre district (si role=DISTRICT)'],
            ['paroisse',  'FK Paroisse',        'Périmètre paroisse (si role=PAROISSE)'],
        ])

    add_heading(doc, '7.2 App geo', 2)
    add_table(doc, ['Modèle', 'Champs clés', 'Géométrie'],
        [
            ['RegionSynodale', 'nom, nom_normalise, code, description', 'MultiPolygonField (EPSG:4326)'],
            ['District',       'nom, code, FK region',                  'PointField centroid (optionnel)'],
            ['Paroisse',       'nom, quartier, niveau, communiants, non_communiants, has_gps', 'PointField (EPSG:4326, null=True)'],
            ['ZoneInfluence',  'FK paroisse (OneToOne), rayon_km, population_estimee', 'PolygonField (EPSG:4326)'],
            ['Itineraire',     'FK paroisse_depart, FK paroisse_arrivee, distance_km, duree_minutes, type_transport, difficulte', 'LineStringField (EPSG:4326, null=True)'],
        ])

    add_heading(doc, '7.3 App ouvriers', 2)
    add_table(doc, ['Modèle', 'Champs clés'],
        [
            ['Grade',   'nom (unique), niveau (int), description, abreviations (Ev, EV, Dp…)'],
            ['Ouvrier', 'nom, prenom, FK grade, FK paroisse, statut (actif/retraité/suspendu/décédé), telephone, email, localisation'],
        ])

    add_heading(doc, '7.4 App oeuvres', 2)
    add_table(doc, ['Modèle', 'Champs clés'],
        [
            ['TypeOeuvre', 'nom (SCOLAIRE / UNIVERSITAIRE / MEDICALE / AGROPASTORALE / IMMEUBLE / TERRAIN / AUTRE), icone, couleur'],
            ['Oeuvre',     'nom, FK type_oeuvre, niveau (paroissial/district/régional/national), FK paroisse/district/region, capacite, budget_annuel, statut, localisation'],
        ])

    add_heading(doc, '7.5 App statistiques', 2)
    add_table(doc, ['Modèle', 'Champs clés'],
        [
            ['StatistiqueAnnuelle', 'FK paroisse, annee, communiants, non_communiants, baptemes, confirmations, mariages, deces, offrandes, dimes, validee'],
        ])

    add_heading(doc, '7.6 App audit', 2)
    add_table(doc, ['Modèle', 'Champs clés'],
        [
            ['LogActivite',      'FK utilisateur, action (CREATE/UPDATE/DELETE), modele, objet_id, details (JSON), adresse_ip, date'],
            ['HistoriquePosition', 'type_objet (paroisse/ouvrier/oeuvre), objet_id, ancienne_position, nouvelle_position, raison_changement, FK utilisateur'],
        ])

    # ── 8. FONCTIONNALITÉS
    add_heading(doc, '8. Fonctionnalités complètes à implémenter', 1)

    add_heading(doc, '8.1 Carte publique (visiteur — aucun compte)', 2)
    for item in [
        'Fond de carte OSM + couche WMS régions synodales (polygones colorés vert EEC)',
        'Couche WFS paroisses (marqueurs verts cliquables, clustering)',
        'Couche WFS œuvres (marqueurs colorés par type : scolaire jaune, médical rouge…)',
        'Couche WFS zones d\'influence (polygones semi-transparents)',
        'Couche WFS itinéraires (lignes entre paroisses)',
        'Popup riche au clic paroisse : nom, district, région, communiants, ouvriers rattachés',
        'Popup riche au clic œuvre : nom, type, niveau, statut, capacité',
        'Popup riche au clic ouvrier : nom, grade, statut, paroisse',
        'Légende dynamique (icônes, couleurs, types)',
        'Contrôles de couches (activer/désactiver)',
        'Filtres multicritères : région, district, type œuvre, niveau paroisse',
        'Recherche par nom (paroisse, district, région)',
        'Statistiques au clic sur région',
        'Hiérarchie : National → Région → District → Paroisse (fil d\'Ariane)',
    ]:
        add_bullet(doc, item)

    add_heading(doc, '8.2 Page d\'accueil institutionnelle', 2)
    for item in [
        'Header : logo EEC officiel + titre de la plateforme',
        'Hero : présentation de la plateforme',
        'Section Bureau National : photos du Président, Vice-Présidents, Secrétaires, Trésorier',
        'Statistiques globales (nb régions, districts, paroisses, ouvriers)',
        'Carte dynamique intégrée (composant Leaflet)',
        'Footer : mentions légales EEC',
    ]:
        add_bullet(doc, item)

    add_heading(doc, '8.3 Espace administrateur (login requis)', 2)
    for item in [
        'Dashboard : statistiques globales, Top 10 paroisses, alertes paroisses sans GPS',
        'CRUD Paroisses avec carte de saisie GPS + historique des positions',
        'CRUD Œuvres : tous les 7 types + statut + capacité + budget',
        'CRUD Ouvriers : grade + statut + contact + rattachement',
        'Statistiques annuelles : saisie baptêmes, mariages, décès, offrandes, dîmes par paroisse/année',
        'Zones d\'influence : créer/modifier le polygone d\'influence d\'une paroisse',
        'Itinéraires : créer des routes entre paroisses (distance, durée, type transport)',
        'Import Excel : paroisses, ouvriers, œuvres (avec rapport créés/erreurs)',
        'Export Excel filtré : paroisses, ouvriers, œuvres',
        'Export PDF : fiche paroisse, rapport statistique par région',
        'Gestion utilisateurs admins (SUPER uniquement)',
        'Journal d\'audit : qui a modifié quoi et quand (SUPER uniquement)',
    ]:
        add_bullet(doc, item)

    add_heading(doc, '8.4 Statistiques avancées', 2)
    for item in [
        'Statistiques globales en temps réel (totaux nationaux)',
        'Top 10 paroisses par nombre de fidèles',
        'Top 10 paroisses par nombre d\'œuvres',
        'Score de performance par région (pondéré : fidèles + œuvres + ouvriers)',
        'Évolution par année (StatistiqueAnnuelle)',
        'Export PDF du rapport statistique',
    ]:
        add_bullet(doc, item)

    # ── 9. GEOSERVER
    add_heading(doc, '9. GeoServer — Couches à publier', 1)
    add_table(doc,
        ['Couche GeoServer', 'Table PostGIS', 'Type géométrie', 'Style SLD'],
        [
            ['eec:regions_synodales',      'geo_regionsynodale',  'MultiPolygon', 'Vert semi-transparent, contour vert foncé'],
            ['eec:districts',              'geo_district',        'Point',        'Point vert petit'],
            ['eec:paroisses',              'geo_paroisse',        'Point',        'Cercle vert plein'],
            ['eec:oeuvres_scolaires',      'oeuvres_oeuvre',      'Point',        'Carré jaune (type=SCOLAIRE)'],
            ['eec:oeuvres_medicales',      'oeuvres_oeuvre',      'Point',        'Croix rouge (type=MEDICALE)'],
            ['eec:oeuvres_agropastorales', 'oeuvres_oeuvre',      'Point',        'Feuille verte (type=AGROPASTORALE)'],
            ['eec:zones_influence',        'geo_zoneinfluence',   'Polygon',      'Vert très transparent'],
            ['eec:itineraires',            'geo_itineraire',      'LineString',   'Ligne verte tiretée'],
        ]
    )

    # ── 10. SÉCURITÉ
    add_heading(doc, '10. Règles de sécurité non négociables', 1)

    add_heading(doc, '10.1 Sécurité applicative (OWASP Top 10)', 2)
    for item in [
        'Sessions Django HttpOnly + Secure + SameSite=Strict (jamais JWT)',
        'Argon2 pour les mots de passe (argon2-cffi)',
        '2FA TOTP obligatoire pour SUPER et REGION',
        'Rate limiting : /api/v1/auth/login/ → 5 req/min/IP',
        'Protection CSRF active (X-CSRFToken sur POST/PUT/DELETE)',
        'RBAC strict : chaque queryset filtré par périmètre du rôle',
        'Audit trail : LogActivite créé sur chaque écriture via signals Django',
        'Jamais de commit .env, node_modules/, pg_data/, geoserver_data/',
    ]:
        add_bullet(doc, item)

    add_heading(doc, '10.2 Sécurité GeoServer (CRITIQUE)', 2)
    add_info_box(doc,
        'CVE-2024-36401 : exécution de code à distance via OGC filter eval, score CVSS 9.8. '
        'Patchée dans GeoServer ≥ 2.25.1. Notre version 2.26.2 est sûre.',
        '#FEF9C3', '🛡️')
    items_geoserver = [
        'Changer le mot de passe admin GeoServer immédiatement au premier démarrage (jamais admin/geoserver)',
        'Ne JAMAIS exposer /geoserver/web/ et /geoserver/rest/ publiquement',
        'Désactiver WCS et WPS (services inutilisés)',
        'WFS Transactions désactivées (Django écrit, GeoServer lit seulement)',
        'Mettre à jour GeoServer à chaque release stable (vérifier CVE)',
        'Logs activés, conservation 30 jours',
    ]
    for i, item in enumerate(items_geoserver, 1):
        add_numbered(doc, item, i)

    # ── 11. CE QUE TU NE DOIS PAS FAIRE
    add_heading(doc, '11. Ce que le modèle IA ne doit PAS faire', 1)
    add_table(doc,
        ['Interdit', 'Raison'],
        [
            ['Proposer une autre stack technique',               'Tranchée définitivement (section 5)'],
            ['Utiliser JWT à la place des sessions',             'Sécurité inférieure pour mono-domaine'],
            ['Ajouter le chatbot IA',                           'Hors périmètre 12 jours, non demandé dans le cahier des charges'],
            ['Créer des comptes utilisateurs lambda',            'Non dans le scope actuel'],
            ['Inventer le contenu des fichiers Excel/Shapefile', 'Lire les fichiers réellement'],
            ['Committer .env, node_modules/, geoserver_data/',  'Sécurité des secrets'],
            ['Garder le mot de passe GeoServer par défaut',     'Faille critique connue'],
            ['Exposer /geoserver/web/ ou /geoserver/rest/ publiquement', 'Surface d\'attaque'],
            ['Valider une phase soi-même',                      'C\'est le développeur qui valide'],
        ],
        header_bg='#991B1B'
    )

    add_separator(doc)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('Master Prompt v3 — Propriété exclusive de l\'Église Évangélique du Cameroun — Confidentiel')
    run.font.name = 'Calibri'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    run.font.italic = True

    doc.save('MASTER_PROMPT_EEC_v3.docx')
    print("[OK]  MASTER_PROMPT_EEC_v3.docx cree avec succes.")


# ════════════════════════════════════════════════════════════════════════════
#  DOCUMENT 2 — ROADMAP
# ════════════════════════════════════════════════════════════════════════════

def generer_roadmap():
    doc = Document()

    section = doc.sections[0]
    section.page_width    = Cm(29.7)   # paysage pour les tableaux larges
    section.page_height   = Cm(21)
    section.left_margin   = Cm(1.5)
    section.right_margin  = Cm(1.5)
    section.top_margin    = Cm(2)
    section.bottom_margin = Cm(1.5)

    configure_styles(doc)

    # ── TITRE
    add_title_block(doc,
        'FEUILLE DE ROUTE — Plateforme EEC Géolocalisation',
        'Roadmap technique complète — Équipe de 6 développeurs — 12 jours',
        '21 mai 2026',
        'Version 2 — Fonctionnalités complètes intégrées')

    add_info_box(doc,
        'Objectif local : 01 juin 2026. Déploiement production : phase distincte après validation locale. '
        'Chef de projet et Lead Dev : Miguel. Commanditaire : Église Évangélique du Cameroun — Direction Nationale.',
        '#DCFCE7', '🎯')

    # ── 1. ÉQUIPE
    add_heading(doc, '1. Équipe et rôles', 1)
    add_table(doc,
        ['Membre', 'Rôle dans le projet', 'Branche Git'],
        [
            ['Miguel', 'Chef de projet, Lead Dev backend, architecture, GeoServer, sécurité, intégration, code review TOUT le monde', 'miguel/backend-core'],
            ['Fred',   'Développeur backend — API REST, serializers, imports, exports, tests API', 'fred/backend-api'],
            ['Igor',   'Développeur frontend — structure Next.js, auth, routing, pages admin CRUD', 'igor/frontend-auth'],
            ['Torres', 'Développeur frontend carte — Leaflet, WMS/WFS GeoServer, popups, légende, zones, itinéraires', 'torres/frontend-map'],
            ['Kuso',   'Développeur frontend UI — shadcn/ui, dashboard stats, recherche, landing page', 'kuso/frontend-ui'],
            ['Fredy',  'Développeur frontend + rédacteur — exports UI, responsive, rapport d\'analyse et conception', 'fredy/rapport-exports'],
        ]
    )

    # ── 2. RÈGLES GIT
    add_heading(doc, '2. Règles Git — Non négociables', 1)
    add_table(doc,
        ['Règle', 'Détail'],
        [
            ['JAMAIS de push sur main',      'main = production uniquement, en fin de projet'],
            ['JAMAIS de push direct sur develop', 'On merge via Pull Request validée par Miguel'],
            ['Chacun sur sa branche',        'Branche personnelle uniquement'],
            ['PR obligatoire',               'Quand une fonctionnalité est terminée → PR vers develop → Miguel review → merge'],
            ['Format des commits',           'type(scope): description — Ex: feat(geo): modèle Paroisse PostGIS'],
        ]
    )

    add_heading(doc, 'Commande de démarrage pour chaque membre (une seule fois)', 3)
    add_code_block(doc,
        'git clone <url_repo>\n'
        'git checkout prenom/sa-branche\n'
        'docker compose up -d\n'
        'docker compose ps   # vérifier 5 services healthy'
    )

    # ── 3. ÉTAT ACTUEL
    add_heading(doc, '3. État actuel — Phase 0 terminée ✅', 1)
    add_table(doc,
        ['Service', 'URL', 'Port', 'État'],
        [
            ['Django 5.0.14',    'http://localhost:8000', '8000', '✅ Opérationnel'],
            ['Next.js 16.2.6',   'http://localhost:3000', '3000', '✅ Opérationnel'],
            ['GeoServer 2.26.2', 'http://localhost:8080/geoserver', '8080', '✅ Opérationnel'],
            ['PostGIS 16-3.4',   '—', '5432', '✅ Opérationnel'],
            ['Redis 7',          '—', '6379', '✅ Opérationnel'],
        ]
    )

    # ── 4. CHECKLIST FONCTIONNALITÉS
    add_heading(doc, '4. Fonctionnalités complètes à livrer (checklist J12)', 1)

    add_heading(doc, '4.1 Carte publique (visiteur sans compte)', 2)
    for item in [
        'Fond de carte OSM + WMS régions synodales (22 polygones vert EEC)',
        'WFS paroisses (693 marqueurs verts, clustering automatique)',
        'WFS œuvres (marqueurs colorés par type : SCOLAIRE, MEDICALE, AGROPASTORALE, UNIVERSITAIRE, IMMEUBLE, TERRAIN, AUTRE)',
        'WFS zones d\'influence (polygones semi-transparents autour des paroisses)',
        'WFS itinéraires (lignes entre paroisses)',
        'Popup paroisse : nom, district, région, communiants, non-communiants, ouvriers rattachés',
        'Popup œuvre : nom, type, niveau, statut, capacité, date inauguration',
        'Popup ouvrier : nom, grade, statut, paroisse',
        'Légende dynamique + Contrôle de couches (activer/désactiver)',
        'Filtres multicritères + Recherche par nom',
        'Statistiques au clic sur région + Fil d\'Ariane hiérarchique',
        'Responsive mobile et tablette',
    ]:
        add_bullet(doc, item)

    add_heading(doc, '4.2 Page d\'accueil + Espace administrateur', 2)
    for item in [
        'Landing page : logo EEC, hero, photos Bureau National (président, VP, secrétaires, trésorier)',
        'Dashboard admin : stats globales, Top 10, alertes paroisses sans GPS',
        'CRUD complet : Paroisses, Districts, Œuvres (7 types), Ouvriers, Zones d\'influence, Itinéraires',
        'Statistiques annuelles : saisie baptêmes, mariages, décès, offrandes, dîmes',
        'Import Excel : paroisses, ouvriers, œuvres (avec rapport créés/erreurs)',
        'Export Excel + Export PDF (rapport statistique région)',
        'Gestion utilisateurs admins + Journal d\'audit',
    ]:
        add_bullet(doc, item)

    # ── 5. ROADMAP 12 JOURS
    add_heading(doc, '5. Roadmap détaillée — 12 jours', 1)

    jours = [
        {
            'jour': 'J1 — 21 mai',
            'objectif': 'Audit des données sources + Setup Git équipe + Copie assets',
            'tasks': [
                ('Miguel', 'Audit données (audit_data.py)', 'Lancer le script d\'audit, analyser les résultats, créer docs/colonnes_excel.md avec les colonnes confirmées'),
                ('Miguel', 'Branches Git équipe',          'Créer et pousser les 6 branches, envoyer les instructions de démarrage à chaque membre'),
                ('Miguel', 'Assets Bureau National',       'Copier les photos depuis geoeec_ancienne_version/ vers frontend/public/bureau_national/'),
                ('Fred',   'Setup + Admin accounts',       'Lire les 3 documents de référence. Configurer Django Admin pour le modèle User.'),
                ('Igor',   'Setup + Lecture docs',         'Lire ROADMAP, Master Prompt v3, Analyse ancienne version. Réfléchir à l\'arborescence Next.js.'),
                ('Torres', 'Setup + Install Leaflet',      'npm install react-leaflet leaflet @types/leaflet leaflet.markercluster. Tester un exemple basique.'),
                ('Kuso',   'Setup + Install shadcn/ui',    'npx shadcn@latest init (style Default, TypeScript, CSS variables). Configurer palette EEC Tailwind.'),
                ('Fredy',  'Début rapport',                'Page de garde, résumé exécutif, contexte EEC, problématique, objectifs de la plateforme.'),
            ]
        },
        {
            'jour': 'J2 — 22 mai',
            'objectif': 'Tous les modèles Django créés et migrés',
            'tasks': [
                ('Miguel', '14 modèles Django + Migrations', 'RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire, Grade, Ouvrier, TypeOeuvre, Oeuvre, StatistiqueAnnuelle, LogActivite, HistoriquePosition. makemigrations + migrate.'),
                ('Miguel', 'Signals audit automatique',      'post_save/post_delete → LogActivite. Signal HistoriquePosition au changement de GPS.'),
                ('Fred',   'Admin Django tous modèles',      'GISModelAdmin pour Paroisse, admin standard pour les autres. list_display, list_filter, search_fields pertinents pour chaque modèle.'),
                ('Igor',   'Arborescence pages Next.js',     'Créer tous les fichiers page.tsx et layout.tsx. Layout admin avec sidebar de navigation couleurs EEC.'),
                ('Torres', 'Composant LeafletMap.tsx',       'MapContainer centré Cameroun (4.5°N, 12°E), zoom 6. Import dynamique OBLIGATOIRE : dynamic(() => import(...), { ssr: false }).'),
                ('Kuso',   'StatCard + Composants shadcn',   'npx shadcn add button card badge input select table dialog. Créer StatCard.tsx (icône + valeur + libellé).'),
                ('Fredy',  'Rapport § Architecture',         'Stack technique, justification des choix (GeoServer, PostGIS, sessions), schéma ASCII des 5 services Docker.'),
            ]
        },
        {
            'jour': 'J3 — 23 mai',
            'objectif': 'Toutes les données EEC importées dans PostGIS',
            'tasks': [
                ('Miguel', 'Import régions synodales',       'import_regions.py : lire Shapefile avec GDAL, table correspondance 5 noms, upsert. Vérifier 22 régions dans admin.'),
                ('Miguel', 'Import paroisses Excel',         'import_paroisses.py : CRITIQUE Point(Coord_y, Coord_x) — Coord_x=latitude, Coord_y=longitude. 255 paroisses sans GPS → has_gps=False.'),
                ('Fred',   'Import ouvriers Excel',          'import_ouvriers.py : normaliser grades (Ev/EV/Évangéliste → table Grade). Rattacher à la paroisse par nom.'),
                ('Fred',   'Import œuvres Excel',            'import_oeuvres.py : dépivoter 3 feuilles (regionales, districts, paroissialles). Créer 7 TypeOeuvre.'),
                ('Igor',   'Page login + auth.ts',           'Formulaire username/password → POST /api/v1/auth/login/ → cookie session → redirect /admin. Gestion erreurs.'),
                ('Torres', 'WMS couche régions synodales',   'WMSTileLayer → GeoServer eec:regions_synodales. Variable NEXT_PUBLIC_GEOSERVER_URL.'),
                ('Kuso',   'SearchBar + HierarchyBreadcrumb', 'SearchBar avec filtres déroulants région/district/type. HierarchyBreadcrumb : National > Région > District > Paroisse.'),
                ('Fredy',  'Rapport § Données sources',      'Analyse des 3 Excel + Shapefile. Problèmes identifiés : inversion GPS, noms incohérents, 255 sans GPS.'),
            ]
        },
        {
            'jour': 'J4 — 24 mai',
            'objectif': 'GeoServer configuré — 8 couches publiées avec styles EEC',
            'tasks': [
                ('Miguel', 'GeoServer workspace + DataStore', 'Créer workspace "eec". DataStore PostGIS (host: db, port 5432, database: eec_db). NE PAS utiliser localhost.'),
                ('Miguel', 'GeoServer : 8 couches + styles SLD', 'Publier 8 couches (régions, districts, paroisses, 3 types oeuvres, zones, itinéraires). Uploader SLD couleurs EEC. Tester WMS GetMap.'),
                ('Miguel', 'GeoServer sécurité',              'Désactiver WCS, WPS, WFS-Transactions. Vérifier mot de passe admin changé. Services inutiles désactivés.'),
                ('Fred',   'Serializers DRF base',            'GeoFeatureModelSerializer pour geo + ouvriers. Serializers CRUD pour toutes les apps.'),
                ('Igor',   'Middleware protection routes',     'middleware.ts : /admin sans cookie session → redirect /login.'),
                ('Torres', 'WFS marqueurs paroisses',          'Fetch GeoServer WFS eec:paroisses → GeoJSON → cercles verts cliquables. Clustering leaflet.markercluster.'),
                ('Kuso',   'Dashboard layout + StatCards',     'Grille 4 StatCards branchées sur GET /api/v1/stats/global/. Sidebar navigation admin.'),
                ('Fredy',  'Rapport § Modèles de données',    'Diagramme entité-association, description des 14 modèles, hiérarchie géographique, modèle d\'accès.'),
            ]
        },
        {
            'jour': 'J5 — 25 mai',
            'objectif': 'API REST core — Auth + Permissions + ViewSets GEO',
            'tasks': [
                ('Miguel', 'RBAC Permissions',               'EstSuperAdmin, EstAdminRegional, EstAdminDistrict, EstAdminParoissial. Filtrage queryset par périmètre.'),
                ('Miguel', 'API Auth (login/logout/me)',      'Sessions Django + Rate limiting 5 req/min/IP. CSRF actif.'),
                ('Miguel', 'ViewSets GEO + action geojson()', 'RegionSynodaleViewSet, DistrictViewSet, ParoisseViewSet. Action geojson() pour la carte.'),
                ('Fred',   'ViewSets Ouvriers + Œuvres',     'CRUD complet avec filtres (grade, statut, région, type oeuvre). Action geojson().'),
                ('Fred',   'URL routing complet',             'Enregistrer tous les ViewSets dans urls.py avec le router DRF.'),
                ('Torres', 'WFS œuvres + Popups (3 types)',   'Marqueurs colorés par type. ParoissePopup, OeuvrePopup, OuvrierPopup — appel Django API au clic pour enrichir.'),
                ('Kuso',   'RegionPanel.tsx',                 'Panneau latéral : nom région, nb paroisses, ouvriers, œuvres. S\'ouvre au clic sur région.'),
                ('Igor',   'Pages CRUD Paroisses',            'Liste paginée avec filtres. Formulaire création/édition avec carte pour saisir GPS.'),
                ('Fredy',  'Rapport § API et sécurité',       'Endpoints, auth sessions, RBAC, OWASP checklist.'),
            ]
        },
        {
            'jour': 'J6 — 26 mai',
            'objectif': 'Statistiques avancées + Zones + Itinéraires + Exports',
            'tasks': [
                ('Miguel', 'Endpoints statistiques avancées', 'GlobalStatsView, TopParoissesFidelesView, TopOeuvresView, PerformanceRegionsView (score pondéré).'),
                ('Fred',   'Export Excel (openpyxl)',         'GET /api/v1/exports/paroisses/excel/?region=X → fichier .xlsx filtré selon périmètre du rôle.'),
                ('Fred',   'Export PDF (WeasyPrint)',          'GET /api/v1/exports/stats/pdf/?region=X → rapport statistique région en PDF.'),
                ('Torres', 'Zones d\'influence + Itinéraires', 'WFS eec:zones_influence (polygones verts transparents). WFS eec:itineraires (lignes jaunes tiretées). Popup distance/durée.'),
                ('Torres', 'MapLegend.tsx',                   'Légende complète : toutes les icônes et couleurs de la carte.'),
                ('Igor',   'Pages CRUD Œuvres + Ouvriers',   'Listes filtrées + formulaires. Statistiques annuelles : sélecteur paroisse + année + formulaire saisie.'),
                ('Kuso',   'Dashboard statistiques avancées', 'Top 10 paroisses fidèles + Top 10 oeuvres + tableau scores performance régions.'),
                ('Fredy',  'Rapport § Fonctionnalités',       'Carte, admin, statistiques avancées, zones, itinéraires, comparaison ancienne version.'),
            ]
        },
        {
            'jour': 'J7 — 27 mai',
            'objectif': 'Intégration complète Frontend ↔ Backend',
            'tasks': [
                ('Miguel', 'CORS + CSRF + api.ts',            'CORS_ALLOW_CREDENTIALS=True. CSRF cookie lisible par JS. Écrire frontend/src/lib/api.ts avec toutes les fonctions d\'appel API.'),
                ('Miguel', 'Fix bugs d\'intégration',         'Prendre en charge TOUS les problèmes qui apparaissent lors de la connexion frontend ↔ backend.'),
                ('Fred',   'Endpoints import Excel via API',  'POST /api/v1/imports/paroisses/ (multipart/form-data). Rapport JSON : crees, mis_a_jour, erreurs.'),
                ('Torres', 'Carte connectée à Django API',    'Au clic sur paroisse → GET /api/v1/geo/paroisses/{id}/ → popup enrichi avec ouvriers rattachés.'),
                ('Kuso',   'Recherche connectée API',         'SearchBar → onChange (debounce 300ms) → GET /api/v1/geo/paroisses/?search=X. Résultats en liste + surlignés carte.'),
                ('Igor',   'Interface import Excel frontend', 'Page admin/imports : upload .xlsx → barre de progression → rapport (X créées, Y mises à jour, Z erreurs).'),
                ('Fredy',  'Rapport § GeoServer',             'WMS/WFS expliqués, workspace, couches publiées, styles SLD, scripts d\'init.'),
            ]
        },
        {
            'jour': 'J8 — 28 mai',
            'objectif': 'Landing page + Admin avancé + 2FA + Code review',
            'tasks': [
                ('Miguel', '2FA TOTP SUPER + REGION',         'django-otp : Setup2FAView (QR code), Verify2FAView (code TOTP). Obligatoire pour ces 2 rôles.'),
                ('Miguel', 'API journal d\'audit',             'LogActiviteViewSet (SUPER seulement), filtres date/utilisateur/action, ordering -date.'),
                ('Miguel', 'CODE REVIEW toutes les branches', 'Review et merge des PR de Fred, Igor, Torres, Kuso. Identifier les non-conformités.'),
                ('Fred',   'Tests pytest complets',           'Un test par endpoint minimum : liste, créer, permissions. Admin régional ne voit pas les autres régions.'),
                ('Torres', 'LayersControl.tsx',               'Checkboxes activer/désactiver chaque couche indépendamment. CQL_FILTER GeoServer selon sélection.'),
                ('Kuso',   'Landing page complète',           'Header logo + Hero + StatCards globals + Bureau National (photos président, VP, secrétaires, trésorier) + Footer.'),
                ('Igor',   'Page gestion utilisateurs',       'SUPER seulement : liste admins, créer/modifier/désactiver compte, assigner rôle + périmètre.'),
                ('Fredy',  'Rapport § Tests',                 'Stratégie de tests, scénarios (visiteur/super admin/admin régional), résultats attendus.'),
            ]
        },
        {
            'jour': 'J9 — 29 mai',
            'objectif': 'Statistiques annuelles + Exports finaux + Responsive',
            'tasks': [
                ('Miguel', 'Optimisation Redis cache',        'cache.set("paroisses_geojson", data, 300) pour les endpoints GeoJSON rarement modifiés. Vue PostGIS simplifiée.'),
                ('Fred',   'StatistiqueAnnuelle ViewSet',     'CRUD filtré par périmètre rôle (PAROISSE voit sa paroisse, REGION voit sa région…)'),
                ('Fred',   'Template PDF exports stats',      'templates/exports/rapport_region.html → WeasyPrint → PDF avec statistiques EEC mise en forme.'),
                ('Torres', 'Responsive carte mobile',         'height: 100dvh mobile. Popups en bottom-sheet. Filtres dans un drawer. Légende réduite à icône flottante.'),
                ('Igor',   'Boutons export dans admin',       'Boutons Export Excel + Export PDF dans les pages paroisses et oeuvres. Déclencher téléchargement.'),
                ('Kuso',   'Composants finals + Toast',       'HierarchyBreadcrumb dynamique. Toast notifications (succès/erreur). RegionPanel fermable.'),
                ('Fredy',  'Responsive toutes pages + Rapport', 'Tester + corriger responsive 375px/768px/1920px sur toutes les pages admin. Rapport § plan de déploiement.'),
            ]
        },
        {
            'jour': 'J10 — 30 mai',
            'objectif': 'Tests fonctionnels complets — tout doit passer',
            'tasks': [
                ('Miguel', 'Tests de sécurité OWASP',         'Checklist : cookies HttpOnly, permissions RBAC, SQL injection bloqué, XSS bloqué, GeoServer hardened, WFS-Transactions off.'),
                ('Fred',   'Couverture tests ≥ 70%',          'pytest --cov=apps --cov-report=html. Corriger les tests qui échouent.'),
                ('Igor',   'Tests scénarios utilisateur',     'Scénario visiteur anonyme + Super Admin (CRUD, import, export, audit) + Admin Régional (voit seulement sa région).'),
                ('Torres', 'Tests carte complets',            'Zoom niveaux 4-16, clustering, basculer couches ON/OFF, CQL_FILTER, popups mobile, WMS GetCapabilities.'),
                ('Kuso',   'Tests UI + WCAG',                 'axe DevTools Chrome : contraste ≥ 4.5:1, zones ≥ 44px, focus visible, alt sur toutes les images.'),
                ('Fredy',  'Tests responsive + Rapport',      'Tester TOUTES les pages sur mobile/tablette/desktop. Compléter les sections manquantes du rapport.'),
            ]
        },
        {
            'jour': 'J11 — 31 mai',
            'objectif': 'Corrections + Merge final dans develop',
            'tasks': [
                ('Miguel', 'Fix bugs critiques',              'Prendre en charge TOUS les bugs bloquants trouvés en J10.'),
                ('Miguel', 'Merge branches → develop',        'Ordre : miguel → fred → igor → torres → kuso → fredy. Résoudre les conflits.'),
                ('Fred',   'Fix bugs API et exports',         'Corriger les bugs de sa branche identifiés en J10. Rebaser sur develop avant PR finale.'),
                ('Igor',   'Fix bugs auth + routing',         'Corriger les problèmes de navigation, auth, CRUD forms.'),
                ('Torres', 'Fix bugs carte',                  'Corriger les problèmes Leaflet, WMS/WFS, popups, responsive.'),
                ('Kuso',   'Fix bugs UI',                     'Corriger les incohérences visuelles, contraste, animations.'),
                ('Fredy',  'Rapport finalisation',            'Compléter toutes les sections. Mise en page finale. Livrer à Miguel pour relecture.'),
            ]
        },
        {
            'jour': 'J12 — 01 juin',
            'objectif': 'Validation finale — Local OK ✅',
            'tasks': [
                ('Miguel', 'Validation finale checklist',     'Parcourir la checklist complète (section 6). Chaque case doit être cochée.'),
                ('Miguel', 'Validation rapport',              'Relire le rapport de Fredy. Valider ou demander corrections.'),
                ('Tous',   'Corrections de dernière minute',  'Chacun corrige les derniers bugs signalés par Miguel.'),
                ('Fredy',  'Livraison rapport validé',        'Livrer la version finale validée par Miguel.'),
            ]
        },
    ]

    for jour_data in jours:
        add_separator(doc)
        add_heading(doc, jour_data['jour'], 2)
        add_info_box(doc, f"Objectif : {jour_data['objectif']}", '#DCFCE7', '🎯')
        add_table(doc,
            ['Membre', 'Tâche', 'Description détaillée'],
            [[t[0], t[1], t[2]] for t in jour_data['tasks']],
            header_bg='#15803D',
            alt_row_bg='#F0FDF4'
        )

    # ── 6. CHECKLIST FINALE
    add_heading(doc, '6. Checklist de validation finale — Jour 12', 1)

    add_heading(doc, 'Infrastructure', 2)
    for item in ['docker compose ps → 5 services healthy', 'http://localhost:8000/admin → Django Admin fonctionnel',
                 'http://localhost:8000/api/docs/ → OpenAPI documentation', 'http://localhost:8080/geoserver/web → GeoServer accessible']:
        add_bullet(doc, f'☐  {item}')

    add_heading(doc, 'Backend (données + API)', 2)
    for item in ['22 régions synodales en base', '134 districts en base', '693 paroisses (438 GPS + 255 sans GPS)',
                 '708 ouvriers importés', 'Toutes les œuvres (7 types)',
                 'Permissions RBAC : admin régional ne voit pas les autres régions',
                 'Import Excel via API fonctionne', 'Export Excel + PDF téléchargeables',
                 'StatistiqueAnnuelle CRUD', 'ZoneInfluence CRUD', 'Itineraire CRUD',
                 'HistoriquePosition créé au changement GPS', 'Journal d\'audit visible (SUPER)',
                 'Tests pytest ≥ 70% couverture', 'GeoServer WFS-Transactions désactivées']:
        add_bullet(doc, f'☐  {item}')

    add_heading(doc, 'GeoServer', 2)
    for item in ['Workspace eec créé', 'DataStore PostGIS connecté (host: db)',
                 '8 couches publiées + styles SLD EEC', 'WMS GetMap → image PNG valide',
                 'WFS GetFeature → GeoJSON valide', 'WCS et WPS désactivés']:
        add_bullet(doc, f'☐  {item}')

    add_heading(doc, 'Frontend', 2)
    for item in ['Page d\'accueil < 5s', 'Logo EEC + Photos Bureau National affichés',
                 'Carte : OSM + WMS régions + WFS paroisses + WFS œuvres',
                 'Zones d\'influence + Itinéraires affichés sur la carte',
                 'Popups riches paroisse + œuvre + ouvrier',
                 'Légende + contrôle couches fonctionnels',
                 'Recherche multicritère fonctionnelle',
                 'Login → dashboard → CRUD → export → logout',
                 'Import Excel dans l\'interface admin',
                 'Statistiques annuelles saisie + affichage',
                 'Responsive mobile OK (375px)', 'Compatible Chrome + Firefox + Edge']:
        add_bullet(doc, f'☐  {item}')

    add_heading(doc, 'Rapport', 2)
    for item in ['Toutes les sections rédigées', 'Relecture Miguel validée', 'Prêt pour remise à l\'EEC']:
        add_bullet(doc, f'☐  {item}')

    # ── 7. RISQUES
    add_heading(doc, '7. Risques identifiés et mitigation', 1)
    add_table(doc,
        ['Risque', 'Probabilité', 'Impact', 'Mitigation'],
        [
            ['Colonnes Excel différentes de ce qu\'on attend',    'Haute',    'Critique', 'Audit J1 OBLIGATOIRE avant tout modèle'],
            ['Inversion Coord_x/Coord_y oubliée',                 'Certaine', 'Critique', 'Commentaire dans le code + test de validation GPS Yaoundé (3.86°N, 11.52°E)'],
            ['5 noms de régions incohérents',                     'Certaine', 'Haut',     'Table de correspondance dans import_regions.py'],
            ['Merge conflict entre branches',                     'Moyenne',  'Moyen',    'Miguel review toutes les PR + rebaser avant merge'],
            ['GeoServer volume Docker corrompu',                  'Faible',   'Haut',     'docker compose down -v geoserver && docker compose up -d geoserver'],
            ['Performance carte 693 points',                      'Moyenne',  'Moyen',    'Clustering Leaflet + cache Redis GeoJSON 5 min'],
            ['Next.js SSR incompatible Leaflet',                  'Certaine', 'Moyen',    'dynamic(() => import(...), { ssr: false }) — OBLIGATOIRE'],
            ['Retard rédaction rapport',                          'Moyenne',  'Haut',     'Fredy commence J1, rédige chaque jour en parallèle du développement'],
        ],
        header_bg='#991B1B'
    )

    # ── 8. TABLEAU RÉCAPITULATIF PAR PERSONNE
    add_heading(doc, '8. Tableau récapitulatif — Tâches par personne', 1)
    add_body(doc, 'Ce tableau permet à chaque membre de voir en un coup d\'œil l\'ensemble de ses responsabilités sur les 12 jours.')

    personnes = [
        {
            'nom': 'MIGUEL — Chef de projet + Lead Dev Backend',
            'couleur_bg': '#166534',
            'taches': [
                ('J1',  'Audit données sources',       'Lancer audit_data.py, analyser résultats, créer docs/colonnes_excel.md'),
                ('J1',  'Branches Git équipe',         'Créer et pousser les 6 branches, envoyer instructions à l\'équipe'),
                ('J1',  'Copie assets Bureau National','Photos depuis ancienne version → frontend/public/bureau_national/'),
                ('J2',  '14 modèles Django',           'RegionSynodale, District, Paroisse, ZoneInfluence, Itineraire, Grade, Ouvrier, TypeOeuvre, Oeuvre, StatistiqueAnnuelle, LogActivite, HistoriquePosition'),
                ('J2',  'Signals audit automatique',   'post_save/delete → LogActivite. Signal HistoriquePosition au changement GPS.'),
                ('J3',  'Import régions shapefile',    'import_regions.py + table correspondance 5 noms incohérents'),
                ('J3',  'Import paroisses Excel',      'import_paroisses.py → Point(Coord_y, Coord_x) — CRITIQUE'),
                ('J4',  'GeoServer complet',           'Workspace eec + DataStore PostGIS + 8 couches + 8 styles SLD + désactiver WCS/WPS/WFS-Transactions'),
                ('J5',  'RBAC Permissions',            'EstSuperAdmin, EstAdminRegional, EstAdminDistrict, EstAdminParoissial'),
                ('J5',  'API Auth (login/logout/me)',  'Sessions + rate limiting 5 req/min. CSRF actif.'),
                ('J5',  'ViewSets GEO + geojson()',    'RegionSynodaleViewSet, DistrictViewSet, ParoisseViewSet'),
                ('J6',  'Statistiques avancées API',   'GlobalStats, Top10Fideles, Top10Oeuvres, PerformanceRegions'),
                ('J7',  'CORS + CSRF + api.ts',        'Débloquer intégration. Écrire lib/api.ts avec toutes les fonctions.'),
                ('J8',  '2FA TOTP',                    'Setup + vérification TOTP pour SUPER et REGION'),
                ('J8',  'API journal d\'audit',         'LogActiviteViewSet (SUPER), filtres date/utilisateur/action'),
                ('J8 continu', 'CODE REVIEW toutes PR', 'Review et merge de tout le travail de l\'équipe'),
                ('J9',  'Optimisation Redis',          'Cache GeoJSON 5 min. Vue PostGIS simplifiée.'),
                ('J10', 'Tests de sécurité',           'OWASP checklist complète'),
                ('J11', 'Fix bugs critiques',          'Prendre en charge TOUS les bugs bloquants'),
                ('J11', 'Merge final branches',        'miguel → fred → igor → torres → kuso → fredy dans develop'),
                ('J12', 'Validation finale',           'Checklist complète. Valider rapport Fredy.'),
            ]
        },
        {
            'nom': 'FRED — Développeur Backend',
            'couleur_bg': '#1D4ED8',
            'taches': [
                ('J1', 'Setup + lecture docs',         'Lire ROADMAP, Master Prompt v3, Analyse ancienne version. Admin Django pour User.'),
                ('J2', 'Admin Django tous modèles',    'GISModelAdmin Paroisse + admin standard pour 13 autres modèles. list_display pertinents.'),
                ('J3', 'Import ouvriers Excel',        'import_ouvriers.py : normaliser grades, rattacher à paroisse'),
                ('J3', 'Import œuvres Excel',          'import_oeuvres.py : dépivoter 3 feuilles, créer 7 TypeOeuvre'),
                ('J4', 'Serializers DRF',              'GeoFeatureModelSerializer geo + serializers CRUD ouvriers/oeuvres'),
                ('J5', 'ViewSets Ouvriers + Œuvres',  'CRUD complet + filtres + action geojson()'),
                ('J5', 'URL routing complet',          'Enregistrer tous les ViewSets dans urls.py'),
                ('J6', 'Export Excel (openpyxl)',      'GET /api/v1/exports/paroisses/excel/ + ouvriers + oeuvres filtrés'),
                ('J6', 'Export PDF (WeasyPrint)',       'GET /api/v1/exports/stats/pdf/?region=X'),
                ('J7', 'Import Excel via API',         'POST /api/v1/imports/paroisses/ (multipart). Rapport JSON.'),
                ('J8', 'Tests pytest complets',        'Liste, créer, permissions, GeoJSON. Admin régional isolé.'),
                ('J9', 'StatistiqueAnnuelle ViewSet',  'CRUD filtré par périmètre rôle'),
                ('J9', 'Template PDF stats',           'templates/exports/rapport_region.html → WeasyPrint'),
                ('J10', 'Couverture tests ≥ 70%',     'pytest --cov=apps. Corriger échecs.'),
                ('J11', 'Fix bugs API/exports',        'Corriger bugs identifiés en J10. Rebaser sur develop.'),
            ]
        },
        {
            'nom': 'IGOR — Développeur Frontend (Auth + Structure + Admin CRUD)',
            'couleur_bg': '#7C3AED',
            'taches': [
                ('J1', 'Setup + lecture docs',         'Lire les 3 docs. Réfléchir à l\'arborescence des pages.'),
                ('J2', 'Arborescence pages Next.js',   'Créer tous les page.tsx et layout.tsx. Layout admin avec sidebar.'),
                ('J3', 'Page login + auth.ts',         'Formulaire → POST API → cookie → redirect. Fonctions login(), logout(), getMe().'),
                ('J4', 'Middleware protection routes', 'middleware.ts : /admin sans cookie → redirect /login'),
                ('J5', 'Pages CRUD Paroisses',         'Liste paginée + formulaire + carte GPS'),
                ('J6', 'Pages CRUD Œuvres + Ouvriers', 'Listes filtrées + formulaires + statistiques annuelles'),
                ('J7', 'Interface import Excel',       'Upload .xlsx → progression → rapport (créées/erreurs)'),
                ('J8', 'Page gestion utilisateurs',   'SUPER seulement : liste, créer, modifier, désactiver'),
                ('J9', 'Boutons export admin',         'Export Excel + PDF dans les pages paroisses et oeuvres'),
                ('J10', 'Tests scénarios utilisateur', 'Visiteur + Super Admin + Admin Régional'),
                ('J11', 'Fix bugs auth + routing',     'Corriger navigation, auth, CRUD forms'),
            ]
        },
        {
            'nom': 'TORRES — Développeur Frontend Carte',
            'couleur_bg': '#065F46',
            'taches': [
                ('J1', 'Install Leaflet + exploration', 'npm install react-leaflet leaflet @types/leaflet leaflet.markercluster'),
                ('J2', 'LeafletMap.tsx de base',       'MapContainer centré Cameroun. Import dynamique SSR:false OBLIGATOIRE.'),
                ('J3', 'WMS régions synodales',        'WMSTileLayer → GeoServer eec:regions_synodales'),
                ('J4', 'WFS paroisses + clustering',   'Fetch GeoServer WFS → GeoJSON → cercles verts. Clustering.'),
                ('J5', 'WFS œuvres + Popups',          'Icônes colorées par type. ParoissePopup, OeuvrePopup, OuvrierPopup.'),
                ('J6', 'Zones d\'influence + Itinéraires', 'Polygones verts transparents + lignes jaunes tiretées. Popup infos.'),
                ('J6', 'MapLegend.tsx',                'Légende complète de toutes les icônes et couleurs'),
                ('J7', 'Carte ↔ Django API',           'Au clic → GET /api/v1/geo/paroisses/{id}/ → popup enrichi'),
                ('J8', 'LayersControl.tsx',            'Checkboxes activer/désactiver chaque couche + CQL_FILTER GeoServer'),
                ('J9', 'Responsive carte mobile',      '100dvh, bottom-sheet popups, drawer filtres, icône flottante légende'),
                ('J10', 'Tests carte',                 'Zoom, clustering, couches, CQL filter, popups mobile'),
                ('J11', 'Fix bugs carte',              'Corriger problèmes Leaflet/WMS/WFS/popups/responsive'),
            ]
        },
        {
            'nom': 'KUSO — Développeur Frontend UI + Dashboard',
            'couleur_bg': '#92400E',
            'taches': [
                ('J1', 'Install shadcn/ui + Tailwind EEC', 'npx shadcn@latest init + configurer palette EEC dans tailwind.config.ts'),
                ('J2', 'StatCard.tsx + composants shadcn', 'npx shadcn add button card badge input select table dialog. StatCard icône+valeur+libellé.'),
                ('J3', 'SearchBar + HierarchyBreadcrumb',  'SearchBar avec filtres déroulants. Breadcrumb National > Région > District > Paroisse.'),
                ('J4', 'Dashboard layout + StatCards API', 'Grille 4 StatCards branchées GET /api/v1/stats/global/. Sidebar navigation admin.'),
                ('J5', 'RegionPanel.tsx',                  'Panneau stats région : nb paroisses, ouvriers, œuvres. S\'ouvre au clic.'),
                ('J6', 'Dashboard statistiques avancées', 'Top 10 fidèles + Top 10 œuvres + tableau scores performance régions.'),
                ('J7', 'Recherche connectée API + Toast',  'Debounce 300ms → GET paroisses/?search=X. Toast notifications.'),
                ('J8', 'Landing page complète',            'Header + Hero + Stats + Bureau National (photos) + Carte + Footer EEC.'),
                ('J9', 'Composants finals',                'Breadcrumb dynamique. RegionPanel fermable. Pages admin finales.'),
                ('J10', 'Tests UI + WCAG',                 'axe DevTools : contraste, zones 44px, focus, alt images'),
                ('J11', 'Fix bugs UI',                     'Corriger incohérences visuelles et contrastes'),
            ]
        },
        {
            'nom': 'FREDY — Frontend Exports + Responsive + Rédacteur Rapport',
            'couleur_bg': '#9D174D',
            'taches': [
                ('J1', 'Rapport — Contexte + Résumé',   'Page de garde, résumé exécutif, contexte EEC, problématique, objectifs'),
                ('J2', 'Rapport § Architecture',         'Stack technique, justification, schéma ASCII des 5 services'),
                ('J3', 'Rapport § Données sources',      'Analyse Excel + Shapefile, problèmes identifiés, solutions'),
                ('J4', 'Rapport § Modèles de données',  'Diagramme entité-association, 14 modèles décrits'),
                ('J5', 'Rapport § API et sécurité',      'Endpoints, auth sessions, RBAC, OWASP'),
                ('J6', 'Rapport § Fonctionnalités',      'Carte, admin, statistiques, zones, itinéraires'),
                ('J7', 'Rapport § GeoServer',            'WMS/WFS, workspace, couches, styles SLD'),
                ('J8', 'Rapport § Tests',                'Stratégie, scénarios, résultats attendus'),
                ('J9', 'Responsive toutes pages',        'Tester + corriger 375px, 768px, 1920px sur toutes les pages admin'),
                ('J9', 'Boutons export admin',           'Intégrer Export Excel + PDF dans les pages admin (avec Igor)'),
                ('J10', 'Tests responsive + Rapport déploiement', 'Tests TOUS les pages mobile/tablette/desktop. Rapport plan de déploiement.'),
                ('J11', 'Rapport finalisation',          'Compléter sections manquantes. Mise en page finale. Livrer à Miguel.'),
                ('J12', 'Livraison rapport validé',      'Version finale validée par Miguel → remise à l\'EEC'),
            ]
        },
    ]

    for personne in personnes:
        add_separator(doc)
        add_heading(doc, personne['nom'], 2)
        add_table(doc,
            ['Jour', 'Tâche', 'Description'],
            [[t[0], t[1], t[2]] for t in personne['taches']],
            header_bg=personne['couleur_bg'],
            alt_row_bg='#F8FAFC'
        )

    # Footer
    add_separator(doc)
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run('FEUILLE DE ROUTE v2 — Propriété exclusive de l\'Église Évangélique du Cameroun — Confidentiel — 21 mai 2026')
    run.font.name = 'Calibri'
    run.font.size = Pt(9)
    run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)
    run.font.italic = True

    doc.save('ROADMAP_EEC.docx')
    print("[OK]  ROADMAP_EEC.docx cree avec succes.")


if __name__ == '__main__':
    print("Génération des documents Word EEC...")
    generer_master_prompt()
    generer_roadmap()
    print("\nTermine. Les deux fichiers .docx sont dans le dossier du projet.")
