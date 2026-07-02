
# AUDIT DES NOUVEAUX FICHIERS DU SUPERVISEUR
**Date : 02 juillet 2026 · Phase : amélioration de la base de données**
**Statut : RAPPORT D'AUDIT — aucune modification de la BD n'a été effectuée**

---

## 1. État actuel de la base de données (référence)

| Table | Volume | Source d'origine |
|---|---|---|
| Régions synodales | 22 | Shapefiles `data/gis` |
| Districts | 137 | Recap_paroisses (26 mai 2025) |
| Paroisses | **554** | Recap_paroisses (26 mai 2025) |
| Œuvres | 311 | Recap_oeuvres_EEC_2025 |
| Ouvriers | 685 | OUVRIERS.xlsx |
| Statistiques annuelles | 546 lignes (546 paroisses) | Recap_paroisses |

**Modèle `Paroisse`** : id, nom, code, niveau, district, position (GPS), adresse, téléphone, email, année_création, est_active, nombre_fideles.
→ **Aucun champ `categorie` n'existe** : ce sera un nouvel attribut.

⚠️ **Problème de qualité détecté dans la BD elle-même** : **41 noms de paroisse en doublon** après normalisation. Exemples de vrais doublons à fusionner : « SOA » / « Paroisse de SOA » (même région), « AKAK » / « Paroisse d'Akak », « EEC (Elig edzoa) » / « ELIG-EDZOA », « Nkozoa » / « EEC paroisse de Nkozoa ». Certains sont des homonymes légitimes (« Banock » existe en BAMBOUTOS et en MENOUA).

---

## 2. Fichier n°1 — Catégorisation des paroisses EEC-1 (02/06/2026)

**Nature** : liste **nationale officielle** des catégories de paroisses, approuvée par la **résolution n° R05/CSG du Conseil Synodal Général de juillet 2024**.

**Contenu extrait (extraction 100 % vérifiée)** :
| Catégorie | Nb paroisses | Support dans le document |
|---|---|---|
| A++ | 4 | paragraphes (Cinquantenaire, Messa-Mokolo, Biyem-Assi, Nlongkak) |
| A1 | 16 | paragraphes |
| A2 | 4 | paragraphes |
| B1 | 16 | paragraphes |
| B2 | 2 | paragraphes (Famgo, Nkomo) |
| C1 | 232 | tableau |
| C2 | 231 | tableau |
| C3 | 126 | tableau |
| C4 | 76 | tableau |
| **Total** | **707** (692 noms uniques) | |

**Croisement avec la BD (554 paroisses)** :
- Correspondance exacte : **262**
- Correspondance approchée fiable (fautes d'orthographe : « Maképè Tonnere »→« Makepe tonnerre », « Bafou Fozong »→« Bafou Fodzong »…) : **+66** → **328 au total (47 %)**
- **364 paroisses catégorisées INTROUVABLES en BD** → le document officiel couvre ~707 paroisses alors que la BD n'en connaît que 554 (celles remontées par l'enquête de géolocalisation).
- **266 paroisses de la BD SANS catégorie** dans le document.

**Verdict : ✅ À INTÉGRER** — c'est LA source officielle du nouvel attribut `categorie`.

---

## 3. Fichier n°2 — Catégorisation par région EEC-1 (01/06/2026)

**Nature** : les MÊMES catégories, mais organisées par région synodale (18 tableaux catégorie × région). 701 entrées extraites, 679 noms uniques, mêmes 9 catégories.

**Croisement fichier n°1 ↔ fichier n°2** : **12 conflits de catégorie** entre la liste nationale et la liste par région (une paroisse classée différemment selon le document). Liste détaillée disponible — à trancher avec le superviseur.

**Verdict : ✅ À UTILISER EN APPUI** — il n'apporte pas de donnée nouvelle mais donne la **région de chaque paroisse catégorisée**, ce qui est précieux pour désambiguïser les homonymes lors de l'intégration (le fichier n°1 ne donne que les noms). Ne pas l'utiliser comme source primaire.

---

## 4. Fichier n°3 — Classification par nombre de fidèles (19/06/2023)

**Nature** : effectifs de fidèles par paroisse, par région synodale (19 tableaux, un par région, avec tranches d'effectifs).

**Contenu extrait** :
- **844 lignes → 827 paroisses uniques** (la BD n'en a que 554, et ses statistiques n'en couvrent que 546) → **ce fichier est effectivement beaucoup plus complet**, comme annoncé par le superviseur.
- Structure par ligne : `nom | total | n1 | n2` — **vérification arithmétique : n1 + n2 = total sur 100 % des lignes (0 anomalie)**.
- Somme des totaux : **277 218 fidèles** (le document annonce 276 076 — écart de 0,4 %, probablement des lignes de sous-totaux du document original ; à vérifier lors de l'import).
- Les 22 régions synodales sont toutes présentes ✔.

⚠️ **POINT BLOQUANT À CONFIRMER PAR LE SUPERVISEUR** : le document ne dit pas ce que sont les colonnes 3 et 4 (seule la colonne 2 « total » est légendée). Test statistique contre la BD (363 paroisses comparées) : l'hypothèse **n2 = communiants / n1 = non-communiants** est majoritaire (71 %) mais **contredit l'ordre habituel** et les données 2025 de l'enquête. Il FAUT une confirmation avant import, sinon on inverse communiants/non-communiants pour 827 paroisses.

**Croisement avec la BD** : 270 exactes + 95 approchées = **365 correspondances (44 %)** ; **462 paroisses du document absentes de la BD** ; 241 paroisses BD absentes du document.

**Verdict : ✅ À INTÉGRER comme statistiques année 2023** (nouvelle ligne `StatistiqueAnnuelle(annee=2023)` — sans écraser les données 2025 existantes) + mise à jour de `Paroisse.nombre_fideles`.

---

## 5. Fichier n°4 — Projet_de_géolocalisation_04_02_25.xlsx

**Nature** : export de la MÊME enquête Kobo que le Recap du 26 mai 2025, mais daté du **4 février 2025** — donc ANTÉRIEUR à la source de la BD. 3 feuilles : export brut (645 lignes × 639 colonnes), « Paroisses » (299 lignes), « Œuvres » (174 lignes).

**Croisement feuille Paroisses (256 noms uniques)** :
- **254 / 256 déjà dans le Recap 26 mai ET dans la BD** → redondance quasi totale.
- Seulement **2 paroisses réellement nouvelles** : **Tsegweu** (district BANGOU, HAUTS PLATEAUX) et **Bantoum 3** (district TONGA, NDE MBAM ET INOUBOU).

**Croisement feuille Œuvres (129 noms uniques)** :
- 73 déjà en BD ; **~50 œuvres INTROUVABLES en BD** (majoritairement des écoles : « École EEC Bataki », « École Maternelle Évangélique Bilingue de Makepe Tonnerre », « École CEPCA de Banka »…).
- ⚠️ Qualité inégale : noms génériques (« École cepca » ×2), doublons internes, et au moins **1 ligne erronée** (des noms de personnes dans la colonne œuvre).

**Verdict : ⚠️ PARTIELLEMENT UTILE — il N'EMBROUILLE PAS mais n'apporte presque rien côté paroisses.**
- Feuille Paroisses : **ne pas l'utiliser** comme source (le Recap 26 mai, déjà en BD, est plus récent et plus complet). Récupérer uniquement les 2 paroisses nouvelles.
- Feuille Œuvres : **à exploiter** après nettoyage manuel (~30-50 œuvres nouvelles candidates, listées dans `backend/data_audit/out_oeuvres_manquantes.json`).
- Feuille brute : ignorer (export Kobo non consolidé).

---

## 6. Constat structurel majeur

Les fichiers du superviseur décrivent **~830 paroisses** ; la BD n'en connaît que **554**. L'écart (~280 paroisses) correspond aux paroisses jamais remontées par l'enquête de géolocalisation (donc **sans coordonnées GPS**). Le modèle `Paroisse` accepte `position = NULL` et l'application gère déjà les paroisses sans GPS.

**Décision à prendre** : créer ces paroisses manquantes en BD (avec catégorie + fidèles, sans GPS, à géolocaliser plus tard) — recommandé pour que la plateforme reflète la réalité complète de l'EEC — ou se limiter aux 554 existantes.

---

## 7. Plan d'intégration proposé (à VALIDER avant exécution)

| # | Action | Détail |
|---|---|---|
| 0 | **Nettoyage BD** | Fusionner les vrais doublons parmi les 41 détectés (validation manuelle des homonymes) |
| 1 | **Migration `categorie`** | Nouveau champ sur `Paroisse` : choix A++, A1, A2, B1, B2, C1, C2, C3, C4 (nullable) |
| 2 | **Import catégories** | Source = fichier n°1 (national) ; fichier n°2 en appui pour les régions ; matching exact + approché + **table de correspondance CSV soumise à validation humaine** ; trancher les 12 conflits |
| 3 | **Import fidèles 2023** | `StatistiqueAnnuelle(annee=2023)` pour ~827 paroisses + màj `nombre_fideles` — **APRÈS confirmation du sens des colonnes n1/n2** |
| 4 | **Paroisses manquantes** | Si validé : création de ~280-460 paroisses sans GPS (nom + district/région + catégorie + fidèles) |
| 5 | **Œuvres nouvelles** | Intégration des ~50 œuvres du fichier n°4 après nettoyage manuel de la liste |
| 6 | **Non-intégration** | Feuille Paroisses et export brut du fichier n°4 (redondants) |

**Questions ouvertes pour le superviseur :**
1. Colonnes 3-4 du fichier fidèles : communiants et non-communiants — dans quel ordre ?
2. Les 12 conflits de catégorie entre les deux documents : quelle source fait foi ? (proposition : le fichier national 02/06/2026, plus récent)
3. Créer les paroisses absentes de la BD (sans GPS) : oui / non ?

---

*Extractions reproductibles : scripts et JSON dans `backend/data_audit/` (inspect_all.py, extract_docx.py, db_match.py, refine.py).*
