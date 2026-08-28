"""
=============================================================================
FICHIER : apps/geo/docx.py
RÔLE    : Lire les tableaux des documents Word de complétion de données

CONTEXTE
--------
Les compléments de données de l'EEC (coordonnées GPS, catégories de paroisses)
arrivent sous forme de documents Word contenant un tableau unique. Ce module
centralise leur lecture, utilisée par plusieurs commandes d'import.

POURQUOI PAS python-docx
------------------------
Un .docx est une archive ZIP contenant du XML. Le besoin se limite à lire un
tableau : `zipfile` et `ElementTree` de la bibliothèque standard suffisent, et
évitent d'ajouter une dépendance au projet pour si peu.

PIÈGE DU TEXTE DÉCOUPÉ
----------------------
Word fragmente un libellé en plusieurs <w:t> dès qu'un caractère change de
style, porte une marque de révision ou déclenche un correcteur. Lire le premier
<w:t> d'une cellule ne donnerait donc qu'un morceau du texte : il faut
concaténer tous les <w:t> descendants.
=============================================================================
"""

import xml.etree.ElementTree as ET
import zipfile

# Espace de noms WordprocessingML, préfixé à chaque balise du document.
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


class DocxIllisible(Exception):
    """Le fichier n'est pas un .docx exploitable, ou ne contient pas de tableau."""


def texte(element):
    """Concatène tous les fragments de texte sous un nœud Word."""
    return "".join(n.text or "" for n in element.iter() if n.tag == W + "t").strip()


def normaliser(nom):
    """Compare deux libellés en ignorant la casse et les espaces multiples.

    Les documents de l'EEC diffèrent régulièrement de la base par un double
    espace (« Kountcha  bahouan ») ou une capitalisation ; ce n'est pas une
    divergence d'identité.
    """
    return " ".join((nom or "").split()).casefold()


def lire_tableau(chemin, colonnes_min=2):
    """Retourne les lignes du premier tableau du document, en-tête compris.

    Chaque ligne est une liste de chaînes, une par cellule. Les lignes
    comptant moins de `colonnes_min` cellules sont ignorées (lignes de
    séparation ou de titre insérées par Word).
    """
    try:
        archive = zipfile.ZipFile(chemin)
        racine = ET.fromstring(archive.read("word/document.xml"))
    except (OSError, KeyError, zipfile.BadZipFile, ET.ParseError) as exc:
        raise DocxIllisible(f"Impossible de lire {chemin} : {exc}") from exc

    tableaux = racine.findall(f".//{W}tbl")
    if not tableaux:
        raise DocxIllisible(f"Aucun tableau trouve dans {chemin}.")

    lignes = []
    for tr in tableaux[0].findall(f"{W}tr"):
        cellules = [texte(tc) for tc in tr.findall(f"{W}tc")]
        if len(cellules) >= colonnes_min:
            lignes.append(cellules)
    return lignes


def lignes_donnees(chemin, colonnes_min=2):
    """Comme `lire_tableau`, mais ne garde que les lignes dont la première
    cellule est un identifiant numérique — ce qui écarte l'en-tête sans
    dépendre de son libellé exact."""
    return [l for l in lire_tableau(chemin, colonnes_min) if l and l[0].strip().isdigit()]


def flottant(cellule):
    """Convertit une cellule en nombre, en tolérant la virgule décimale."""
    return float(cellule.strip().replace(",", "."))
