# DOCUMENT DE RÉFÉRENCE — BASE DE DONNÉES & FICHIERS SOURCES
**Projet EEC Géolocalisation · Version du 02 juillet 2026**
**Rôle : référence unique pour toute mise à jour future des données. Un nouveau développeur doit pouvoir comprendre la situation complète avec ce seul document.**

---

## 1. Présentation de la base de données actuelle

### 1.1 Architecture
PostgreSQL 16 + PostGIS (conteneur Docker `eec_db_dev`), exploitée par Django/GeoDjango.
5 conteneurs : base de données, backend Django, GeoServer, Redis, (frontend Next.js en local, port 3004).

### 1.2 Volumes actuels (après intégration du 02/07/2026)

| Table | Volume | Remarques |
|---|---|---|
| Régions synodales | **22** | issues des shapefiles `data/gis` (géométries PostGIS) |
| Districts | **159** | 137 réels + **22 « NON PRÉCISÉ »** (1 par région, voir §7.1) |
| Paroisses | **870** | 516 issues de l'enquête (fusion faite) + 354 créées depuis le fichier officiel |
| — dont catégorisées | **669** | catégories officielles A++ → C4 |
| — dont avec GPS | **385** | les 485 autres sont à géolocaliser |
| Œuvres | **311** | écoles, centres médicaux, immeubles, terrains… |
| Ouvriers | **685** | pasteurs, évangélistes… avec grades hiérarchisés |
| Statistiques annuelles | **1 143** | **629 pour 2024** + **514 pour 2025** (deux campagnes distinctes) |

### 1.3 Modèle `Paroisse` (champs principaux)
`nom` · `categorie` (A++, A1, A2, B1, B2, C1, C2, C3, C4 — nullable) · `district` (FK obligatoire) · `position` (Point GPS, nullable) · `adresse` · `nombre_fideles` (= total de l'année statistique la plus récente) · `est_active`.

> ⚠️ L'ancien champ `niveau` (PAROISSE/STATION/ANNEXE) a été **supprimé** le 02/07/2026 (migration `geo.0003`) : il valait « PAROISSE » sur 100 % des lignes, donc ne portait aucune information. Il est remplacé par `categorie` (résolution n° R05/CSG du Conseil Synodal Général, juillet 2024).

### 1.4 Modèle `StatistiqueAnnuelle` — la clé de l'évolutivité
`paroisse` (FK) · **`annee`** · `communiants` · `non_communiants` · `baptemes` · `confirmations` · `mariages` · `deces` · `offrandes` · `dimes` · `validee`.
**Contrainte unique (paroisse, annee)** → chaque paroisse peut avoir une ligne par campagne (2024, 2025, 2026…) sans jamais s'écraser. C'est cette structure qui permet d'intégrer indéfiniment de nouvelles campagnes statistiques.

---

## 2. Présentation des fichiers sources

### 2.1 Les 3 fichiers d'ORIGINE (ont peuplé la BD initiale, mai 2026)

| Fichier | Contenu | Utilisation |
|---|---|---|
| `Recap_paroisses_…_26mai.xlsx` | 694 lignes d'enquête terrain (Kobo, déc. 2024 → mai 2025) : paroisse, district, région, communiants, non-communiants, GPS | Source des 554 paroisses initiales + stats **2025** |
| `Recap_oeuvres_EEC_2025.xlsx` | 3 feuilles (régionales / districts / paroissiales) | Source des 311 œuvres |
| `OUVRIERS.xlsx` | 709 lignes | Source des 685 ouvriers |

### 2.2 Les 4 NOUVEAUX fichiers (superviseur, juin 2026)

| # | Fichier | Nature | Verdict |
|---|---|---|---|
| 1 | `Catégorisation des paroisses EEC-1 02062026.docx` | Liste **nationale officielle** : 707 paroisses en 9 catégories (résolution R05/CSG). A++/A1/A2/B1/B2 en paragraphes, C1-C4 en tableaux. **Ne contient PAS les régions.** | ✅ INTÉGRÉ (source du champ `categorie`) |
| 2 | `Catégorisation par regionEEC-1 010626.docx` | Mêmes catégories, organisées par région (18 tableaux). 701 entrées. | ✅ Utilisé en appui (fournit la région des paroisses du fichier 1 ; départage les homonymes) |
| 3 | `Classification par nombres de fidèle_19_06_2023.docx` | 844 lignes / 827 paroisses uniques, effectifs par région : `nom / total / n1 / n2` (n1+n2 = total sur 100 % des lignes). Campagne **juin 2024** (276 076 fidèles ; ⚠️ le NOM du fichier dit « 2023 » mais le pied de page du document indique « Juin 2024 » — c est la date du document qui fait foi, cohérente avec la catégorisation de juillet 2024). | ✅ INTÉGRÉ comme statistiques **année 2024** (629 paroisses communes) |
| 4 | `Projet_de_géolocalisation_04_02_25.xlsx` | Export ANTÉRIEUR (4 févr. 2025) de la même enquête Kobo que le Recap 26 mai. | ⚠️ Redondant côté paroisses (254/256 déjà connues). Sa feuille Œuvres contient ~50 œuvres candidates (voir §7.4) |

---

## 3. Analyse des correspondances

### 3.1 Fichier catégories ↔ BD (au moment de l'intégration)
- 692 noms officiels uniques → **327 attribués** aux paroisses de l'enquête (262 exacts + ~66 par rapprochement orthographique)
- **354 paroisses officielles créées** (absentes de l'enquête, sans GPS)
- 10 non intégrées (région introuvable — §5.1)

### 3.2 Fichier fidèles ↔ les 3 référentiels (827 paroisses uniques)

| Référentiel | Exactes | Approchées | Introuvables |
|---|---|---|---|
| BD-enquête seule (516) | 271 | 95 | 461 |
| Fichier catégories seul (692) | 524 | 94 | 209 |
| **BD fusionnée (870)** | **537** | **135** | **155** |

→ Le fichier fidèles concorde **bien avec le fichier des catégories** (les deux documents officiels se recoupent à ~75 %) et **mal avec les noms d'enquête** (noms informels).

### 3.3 Détail ligne à ligne
Voir `docs/COMPARAISON_PAROISSES_BD_vs_OFFICIEL.md` : tableau complet des 516 paroisses d'enquête avec leur correspondance officielle, les 354 ajoutées, les doublons du fichier fidèles, l'échantillon de vérification des colonnes.

---

## 4. Analyse des divergences

### 4.1 Les effectifs 2024 ↔ 2025 : DEUX CAMPAGNES DIFFÉRENTES (conclusion argumentée)
Comparaison sur les **350 paroisses** présentes dans les deux sources avec chiffres exploitables :

| Écart entre total 2024 (docx) et total 2025 (BD) | Paroisses | % |
|---|---|---|
| Identiques (0 %) | **0** | 0 % |
| Faible écart (≤ 10 %) | 42 | 12 % |
| Écart modéré (10-25 %) | 85 | 24 % |
| **Totalement différents (> 25 %)** | **223** | **63 %** |

**Conclusion : il s'agit incontestablement de deux campagnes statistiques différentes.**
Arguments : (a) **zéro** valeur identique sur 350 paroisses — impossible si c'était la même campagne recopiée ; (b) le pied de page du document indique **Juin 2024** (le nom du fichier, trompeur, dit 2023) ; (c) les stats de la BD proviennent de l'enquête de géolocalisation menée de **décembre 2024 à mai 2025** ; (d) 63 % d'écarts majeurs reflètent l'évolution réelle des effectifs (et des méthodes de comptage) entre les deux années.
→ **Décision appliquée** : coexistence en base sous `annee=2024` et `annee=2025`, aucun écrasement.

### 4.2 Nomenclature des noms de paroisses
Trois conventions coexistent selon la source :
- Enquête : noms informels, casse variable, préfixes (« Paroisse de… », « EEC… »), annexes (« Mont des oliviers/annexe de Djalingo »)
- Fichier catégories : noms officiels en casse mixte (« Bafou Fodzong »)
- Fichier fidèles (2024) : noms en MAJUSCULES (« MONT DES OLIVIERS »)
→ Traitées par normalisation (suppression accents/préfixes/ponctuation) + rapprochement orthographique (seuil 0,87-0,90) + désambiguïsation par région.

### 4.3 Nomenclature des régions
Variantes selon les fichiers : « BAMBOUTOS ET NORD OUES(T) », « CENTRE ET SUD 2 » vs « CENTRE SUD 2 », « SANANGA » (faute) vs « SANAGA », « NDE & MBAM » vs « NDE MBAM »… → normalisation insensible à l'ordre des mots. Une seule variante reste non résolue : « SANANGA MARITIME » (fidèles) ↛ « SANAGA MARITIME ET OCEAN ».

### 4.4 Colonnes n1/n2 du fichier fidèles (sémantique non documentée)
Le document ne légende que la colonne « total ». Test statistique contre la BD (349 paroisses) : l'hypothèse **n1 = non-communiants, n2 = communiants** l'emporte à **91 %** des cas tranchés (257 contre 25).
**Convention appliquée à l'import : n2 → `communiants`, n1 → `non_communiants`.**
⚠️ À faire confirmer par le superviseur. Si la convention est inverse, la correction tient en une requête :
```sql
UPDATE accounts_statistiqueannuelle
SET communiants = non_communiants, non_communiants = communiants
WHERE annee = 2024;
```

---

## 5. Données manquantes

| Manque | Volume | Détail / action |
|---|---|---|
| 5.1 Paroisses officielles sans région | **10** | Centenaire (Act Fr), Koupgouo, Katen, Njichem, Njiko, Djionghuo, Bagam, Bandjah St, Bandjoun, Galim-Centre — dans aucun fichier avec une région → **demander au superviseur** |
| 5.2 GPS | **485 paroisses** | les 354 créées + ~131 d'enquête sans coordonnées → campagne de géolocalisation à prévoir |
| 5.3 Catégorie | **201 paroisses** | noms d'enquête sans correspondance officielle (annexes, noms locaux) → à rapprocher manuellement via `COMPARAISON_PAROISSES…md` |
| 5.4 District réel | **354 paroisses** | rattachées à « NON PRÉCISÉ » → à réassigner par les admins régionaux |
| 5.5 Statistiques | 870−810 = **60 paroisses** sans aucun chiffre de fidèles | |
| 5.6 Fidèles non importés | **184 paroisses** du fichier fidèles (2024) introuvables en BD (~153 vraiment nouvelles) | liste dans le MD de comparaison — décision superviseur avant création |

---

## 6. Données incohérentes (détectées et corrigées ou signalées)

| Incohérence | Origine | Traitement |
|---|---|---|
| 38 paroisses en doublon (« SOA » / « Paroisse de SOA »…) | double saisie dans l'enquête | ✅ **Fusionnées** (GPS conservé, meilleur nom, stats fusionnées champ à champ, toutes références réassignées) |
| « Collège Évangélique Polyvalent de Balena » enregistré comme paroisse | erreur de saisie du répondant (colonne paroisse = nom du collège) | ✅ **Corrigé** → renommée « Balena », catégorie C2 (le collège reste candidat œuvre) |
| 12 conflits de catégorie entre les fichiers 1 et 2 | divergence entre les deux documents officiels | Fichier 1 (national, plus récent) a fait foi — à confirmer |
| 16 noms répétés dans le fichier fidèles | homonymes inter-régions (légitimes) + vrais doublons même région | homonymes gérés par région ; 31 lignes doublons ignorées à l'import |
| Homonyme « Manjouom » (NOUN NORD / WOURI SUD) | catégorie impossible à attribuer | non catégorisé — à trancher |
| Non-communiants 2025 souvent ≈ 0 (3, 9, 27…) | qualité de saisie de l'enquête terrain | signalé — les chiffres 2024 semblent plus fiables sur ce point |
| « Jourdain de beka hossere » / « Le Jourdain… » (ADAMAOUA) | probable doublon avec article | **non fusionné** (prudence) — à valider visuellement |

---

## 7. Données à compléter

1. **Districts « NON PRÉCISÉ »** (22) : structures temporaires pour accueillir les 354 paroisses officielles ; les admins régionaux devront réaffecter chaque paroisse à son vrai district.
2. **Géolocalisation** des 485 paroisses sans GPS (prochaine campagne terrain).
3. **Catégorisation** des 201 paroisses d'enquête non rapprochées.
4. **Œuvres candidates** : ~50 œuvres de la feuille « Oeuvres » du fichier 04_02_25 (`backend/data_audit/out_oeuvres_manquantes.json`) — import après nettoyage manuel (noms génériques, 1 ligne erronée avec des noms de personnes).
5. **Les 2 paroisses** du fichier 04_02_25 : Tsegweu (BANGOU) et Bantoum 3 (TONGA) — à créer si confirmées.

---

## 8. Recommandations

1. **Ne plus jamais importer en écrasant** : toute nouvelle campagne statistique = nouvelles lignes `StatistiqueAnnuelle(annee=N)`. La structure le garantit déjà.
2. **Faire confirmer par le superviseur** : (a) le sens des colonnes n1/n2 (§4.4) ; (b) les 10 paroisses sans région (§5.1) ; (c) les 12 conflits de catégorie ; (d) la création ou non des ~153 paroisses présentes uniquement dans le fichier fidèles.
3. **Nommage** : faire adopter les noms officiels du fichier de catégorisation comme référence unique ; l'admin peut renommer progressivement les noms d'enquête restants.
4. **Gel de la BD** : après validation des points ci-dessus, considérer la BD comme stable et passer aux modules applicatifs (RBAC, espaces admin).
5. Conserver `backend/data_audit/` (scripts + JSON) : toute la chaîne d'audit est **reproductible**.

## 9. Actions réalisées / restantes

| ✅ Fait (02/07/2026) | ⏳ Reste (décision requise) |
|---|---|
| Champ `categorie` créé, `niveau` supprimé (BD + API + frontend complet) | Confirmer n1/n2 (sinon 1 UPDATE de correction) |
| 38 doublons fusionnés + cas Balena corrigé | Placer les 10 paroisses sans région |
| 669 paroisses catégorisées ; 354 paroisses officielles créées | Réaffecter les districts « NON PRÉCISÉ » |
| 629 statistiques 2024 importées (coexistence avec les 514 de 2025) | Créer (ou non) les ~153 paroisses du fichier fidèles |
| `nombre_fideles` recalculé (année la plus récente) : 810/870 paroisses | Importer les ~50 œuvres candidates après nettoyage |
| 2 documents d'audit produits (`AUDIT_NOUVEAUX_FICHIERS…`, `COMPARAISON_PAROISSES…`) | Géolocaliser les 485 paroisses sans GPS |
