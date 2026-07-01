# Comment fonctionne le calcul d'itinéraire — Explication pas à pas

> Plateforme EEC Géolocalisation — fonctionnalité « Parcours »
> Document pédagogique : du clic de l'utilisateur jusqu'au tracé bleu sur la carte.

Ce document explique **tout** ce qui se passe quand on calcule un itinéraire :
les méthodes, les algorithmes, la théorie des graphes et les mathématiques —
en partant de zéro, simplement.

---

## 1. Le problème en une phrase

> « Quel est le chemin **le plus rapide** sur les routes réelles, entre mon point
> de départ A et ma destination B, selon que je suis en voiture, à vélo ou à pied ? »

C'est exactement le problème que résout Google Maps. Nous utilisons **les mêmes
familles d'algorithmes** que lui.

---

## 2. Idée fondamentale : transformer une carte en GRAPHE

Un ordinateur ne « voit » pas une route comme nous. Pour calculer un chemin, on
transforme le réseau routier en une structure mathématique appelée **graphe**.

### 2.1 Qu'est-ce qu'un graphe ?

Un graphe, c'est deux choses :

- des **NŒUDS** (ou *sommets*, *vertices*) — ici : **chaque intersection / carrefour**,
- des **ARÊTES** (ou *liens*, *edges*) — ici : **chaque tronçon de route** qui relie
  deux intersections.

```
      route A→B (arête)
 (A) ───────────────── (B)
  │ intersection        │ intersection
  │ (nœud)              (nœud)
  │
  │ route A→C
 (C)
```

Le réseau routier du Cameroun devient donc un immense graphe :
**des centaines de milliers de nœuds** (carrefours) reliés par des arêtes (routes).

### 2.2 Le POIDS d'une arête (la notion clé)

Chaque arête porte un **poids** = un *coût* pour la parcourir. Ce coût n'est PAS
seulement la distance : c'est surtout le **temps de parcours**.

Le temps d'un tronçon se calcule ainsi :

```
temps = longueur_du_tronçon / vitesse_autorisée_selon_le_mode
```

Exemple pour un tronçon de 1 km :

| Mode      | Vitesse typique | Temps du tronçon |
|-----------|-----------------|------------------|
| Voiture   | 50 km/h         | 1,2 min          |
| Vélo      | 15 km/h         | 4,0 min          |
| À pied    | 5 km/h          | 12,0 min         |

C'est **pour ça** que changer de mode change l'itinéraire ET la durée : le poids
de chaque arête change. Une autoroute est « bon marché » en voiture mais
**interdite** à pied (poids infini → l'arête disparaît du graphe piéton).

> **Mathématiquement** : on cherche le chemin qui **minimise la somme des poids**
> des arêtes traversées. C'est un problème de *plus court chemin* (shortest path).

---

## 3. L'algorithme de base : DIJKSTRA

L'algorithme de **Dijkstra** (1956) trouve le plus court chemin entre un point de
départ et tous les autres points d'un graphe à poids positifs. C'est le socle
historique de tout calcul d'itinéraire.

### 3.1 L'idée intuitive (la « tache d'huile »)

Imaginez que vous versez de l'eau au point de départ A. L'eau se répand dans les
routes à une vitesse inversement proportionnelle au coût. Le moment où l'eau
atteint B pour la première fois → c'est le chemin le plus rapide.

### 3.2 Les étapes précises

On garde pour chaque nœud une **distance provisoire** = le meilleur temps connu
pour l'atteindre depuis A.

```
1.  distance[A] = 0 ; distance[tous les autres] = +∞ (infini)
2.  Mettre tous les nœuds dans une file de priorité (le plus proche d'abord)
3.  Tant que la file n'est pas vide :
4.      u = le nœud non visité avec la plus petite distance
5.      Pour chaque voisin v de u (via une arête de poids w) :
6.          nouvelle = distance[u] + w
7.          si nouvelle < distance[v] :        ← on a trouvé mieux
8.              distance[v] = nouvelle
9.              précédent[v] = u               ← on mémorise d'où on vient
10.     marquer u comme visité (sa distance est définitive)
11. À la fin, on remonte précédent[B] → précédent[...] → A pour reconstruire le chemin
```

L'étape 6-8 s'appelle la **« relaxation »** d'une arête : on tente d'améliorer le
temps d'arrivée chez le voisin.

### 3.3 Pourquoi ça marche (la garantie mathématique)

Quand on retire de la file le nœud `u` de plus petite distance (ligne 4), on a la
**certitude** qu'aucun autre chemin ne pourra faire mieux pour atteindre `u` :
tous les autres chemins passeraient par un nœud encore plus loin (donc plus cher),
car **tous les poids sont positifs**. C'est l'invariant qui rend Dijkstra correct.

### 3.4 Coût en calcul (complexité)

Avec une file de priorité (tas binaire), Dijkstra coûte :

```
O( (N + A) · log N )
```

où `N` = nombre de nœuds, `A` = nombre d'arêtes. Pour un pays entier, `N` se
compte en millions → trop lent si on l'applique naïvement à chaque requête.
D'où les améliorations ci-dessous.

---

## 4. L'amélioration : A* (A-star)

**A\*** est Dijkstra **guidé**. Au lieu d'explorer dans toutes les directions, il
se dirige *vers* la destination grâce à une **heuristique**.

### 4.1 La fonction f = g + h

Pour chaque nœud, A\* calcule :

```
f(n) = g(n) + h(n)
```

- `g(n)` = coût **réel** déjà parcouru depuis A jusqu'à n (comme Dijkstra),
- `h(n)` = **estimation optimiste** du coût restant de n jusqu'à B,
- `f(n)` = estimation du coût total du chemin passant par n.

A\* explore en priorité les nœuds de plus petit `f` → il « vise » la destination.

### 4.2 L'heuristique h : la distance à vol d'oiseau

Pour `h`, on utilise la distance en ligne droite (vol d'oiseau) de n vers B,
divisée par la vitesse maximale. Cette distance se calcule avec la **formule de
Haversine** (voir §6). Elle est **admissible** : elle ne surestime jamais le
vrai coût (en ligne droite ≤ par les routes), ce qui **garantit** qu'A\* trouve
bien le chemin optimal.

> Intuition : Dijkstra explore un grand disque autour du départ ; A\* explore une
> ellipse étirée vers la destination → beaucoup moins de nœuds visités, donc
> beaucoup plus rapide, pour le **même** résultat optimal.

---

## 5. Ce que fait réellement Google Maps (et notre moteur Valhalla)

Sur un pays entier, même A\* est trop lent pour répondre en quelques
millisecondes. Les vrais moteurs (Google, Valhalla, OSRM) ajoutent un
**pré-calcul** :

### 5.1 Contraction Hierarchies (hiérarchies de contraction)

Idée : avant toute requête, on **pré-traite** le graphe une fois pour toutes. On
classe les routes par importance (autoroute > nationale > rue de quartier) et on
crée des **raccourcis** (« shortcuts ») qui résument de longs segments
d'autoroute en une seule arête.

À la requête, le moteur fait un **A\* bidirectionnel** (il cherche en même temps
depuis A *en avant* et depuis B *en arrière*, et les deux recherches se
rejoignent au milieu) sur ce graphe enrichi de raccourcis. Résultat : une réponse
en **millisecondes** sur des millions de nœuds.

> **Notre application utilise Valhalla**, un moteur open-source qui implémente
> exactement cette famille : A\*/Dijkstra bidirectionnel + hiérarchies sur les
> données routières **OpenStreetMap**. C'est la même théorie que Google Maps.

### 5.2 Pourquoi on ne réinvente pas la roue

Construire et maintenir un graphe routier d'un pays (mise à jour des routes, sens
interdits, ponts, vitesses…) est un travail colossal. On délègue donc le calcul
brut à Valhalla (serveur public FOSSGIS, gratuit, données OSM) et on se concentre
sur **l'expérience EEC** : choisir une église/œuvre, afficher le tracé, les
distances, les étapes. Le code est isolé dans
[`backend/apps/visitors/routing.py`](../backend/apps/visitors/routing.py) : si un
jour on héberge notre propre serveur, on change **une seule URL**.

---

## 6. Les mathématiques de la distance : Haversine

Avant même de tracer une route, on a besoin de mesurer la distance « à vol
d'oiseau » entre deux points GPS (pour l'heuristique A\*, et pour le calcul rapide
« distance entre deux éléments »). La Terre étant une sphère, on ne peut pas faire
une simple soustraction : on utilise la **formule de Haversine**.

Pour deux points de latitude/longitude (φ₁, λ₁) et (φ₂, λ₂), en radians :

```
a = sin²(Δφ / 2) + cos(φ₁) · cos(φ₂) · sin²(Δλ / 2)

c = 2 · atan2( √a , √(1 − a) )

distance = R · c
```

où :
- `Δφ = φ₂ − φ₁` (différence de latitude),
- `Δλ = λ₂ − λ₁` (différence de longitude),
- `R = 6371 km` (rayon moyen de la Terre).

C'est exactement la fonction `_haversine_km()` utilisée côté backend pour le
calcul rapide à vol d'oiseau. La distance « réelle sur route » renvoyée par
Valhalla est toujours **un peu plus longue** que cette distance Haversine, ce qui
est normal : les routes contournent les obstacles.

---

## 7. Le trajet d'une requête dans NOTRE application (pas à pas)

Voici la chaîne complète, du clic au tracé bleu :

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. L'utilisateur (visiteur connecté) ouvre l'onglet « Parcours »      │
│                                                                       │
│ 2. Il définit le DÉPART :                                             │
│    • soit « Ma position »  → navigator.geolocation (GPS du navigateur)│
│    • soit un élément       → recherche par nom OU clic sur la carte   │
│                                                                       │
│ 3. Il définit la DESTINATION (église, œuvre, …) de la même façon      │
│                                                                       │
│ 4. Il choisit le MODE : voiture / vélo / à pied                       │
│                                                                       │
│ 5. Clic sur « Calculer »                                              │
│        │                                                              │
│        ▼  POST /api/visitor/itineraires/route/                        │
│           { start_lat, start_lng, end_lat, end_lng, mode }            │
│                                                                       │
│ 6. BACKEND (routing.py) appelle Valhalla :                            │
│        • Valhalla modélise les routes OSM en GRAPHE                    │
│        • applique A*/Dijkstra bidirectionnel + hiérarchies            │
│        • renvoie : distance, durée, tracé encodé, manœuvres           │
│                                                                       │
│ 7. Le backend DÉCODE la polyligne (precision 6) en liste [lat,lng]    │
│        et renvoie le tout au frontend                                 │
│                                                                       │
│ 8. FRONTEND (EECMapApp) dessine sur Leaflet :                         │
│        • un contour sombre (casing) + une ligne colorée               │
│        • des pointillés blancs animés qui défilent                    │
│        • les marqueurs A (vert) et B (rouge)                          │
│        • cadre automatiquement la carte sur le trajet                 │
│        • affiche durée, distance et les étapes virage-par-virage      │
└─────────────────────────────────────────────────────────────────────┘
```

### Les deux types de calcul offerts

1. **Depuis ma position → un élément** : géolocalisation du navigateur comme
   départ, n'importe quelle église/œuvre comme destination.
2. **Entre deux éléments quelconques** : on choisit un élément en A et un autre
   en B (par recherche ou par clic sur la carte) → la distance et le trajet réels
   s'affichent. Idéal pour « combien y a-t-il entre la paroisse X et l'œuvre Y ? ».

---

## 8. Le décodage de la polyligne (détail technique)

Valhalla ne renvoie pas 500 points GPS en clair (ce serait énorme). Il les
**compresse** en une chaîne de caractères (« encoded polyline »). L'astuce :

1. on ne stocke pas chaque coordonnée, mais la **différence** (delta) avec le
   point précédent — les deltas sont petits, donc compressibles ;
2. chaque nombre est codé en blocs de 5 bits en base 64 ;
3. la précision est de 6 décimales (on divise par 1 000 000 à la fin).

La fonction `decode_polyline()` dans `routing.py` inverse ce procédé et reconstruit
la liste `[[lat, lng], …]` que Leaflet dessine directement.

---

## 9. Résumé en une image mentale

| Concept            | Dans notre cas                                  |
|--------------------|-------------------------------------------------|
| Graphe             | Le réseau routier du Cameroun (OSM)             |
| Nœud               | Une intersection                                |
| Arête              | Un tronçon de route                             |
| Poids d'une arête  | Le temps de parcours (selon le mode)            |
| Plus court chemin  | L'itinéraire le plus rapide                     |
| Dijkstra           | L'algorithme de base (explore dans tous les sens)|
| A\*                | Dijkstra guidé vers la destination (heuristique)|
| Heuristique h      | Distance Haversine à vol d'oiseau               |
| Contraction Hier.  | Pré-calcul de raccourcis (rapidité Google Maps) |
| Valhalla           | Le moteur qui exécute tout ça sur les données OSM|

> **En résumé** : on transforme la carte en graphe, on pèse chaque route par son
> temps de parcours, puis on cherche la somme de poids minimale avec A\* (Dijkstra
> guidé) accéléré par des hiérarchies de contraction — la même science que Google
> Maps, appliquée aux églises et œuvres de l'EEC Cameroun.
