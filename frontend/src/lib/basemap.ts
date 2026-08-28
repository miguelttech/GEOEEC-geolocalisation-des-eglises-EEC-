/**
 * =============================================================================
 * Fonds de carte du projet — source unique
 * =============================================================================
 *
 * POURQUOI CE FICHIER ?
 *   Toutes les cartes de l'application utilisaient les tuiles gratuites de
 *   CARTO (basemaps.cartocdn.com). Ce service a fermé : il répond désormais
 *   HTTP 200 avec une tuile filigranée « API KEY REQUIRED » au lieu d'une
 *   erreur. Aucun code ne pouvait donc détecter la panne — les cartes se
 *   dégradaient en silence, et le filigrane n'apparaissait qu'à l'écran.
 *
 *   Les cinq cartes du projet déclaraient chacune leur URL de tuiles en dur.
 *   Centraliser ici évite qu'une prochaine fermeture de service oblige à
 *   repasser sur cinq fichiers — et qu'on en oublie un.
 *
 * FOURNISSEUR RETENU : OpenFreeMap (tiles.openfreemap.org)
 *   · mêmes données OpenStreetMap que l'ancien CARTO Voyager ;
 *   · gratuit, sans clé d'API ni quota annoncé ;
 *   · déjà la source de la vue 3D (NavMap3D) et des points d'intérêt de la
 *     carte principale — un seul fournisseur à surveiller ;
 *   · auto-hébergeable si le service venait à fermer à son tour.
 *
 *   OpenFreeMap sert du VECTORIEL : le rendu passe par MapLibre GL, greffé
 *   dans Leaflet via @maplibre/maplibre-gl-leaflet. D'où `addBasemap()`
 *   plutôt qu'une simple constante d'URL.
 *
 * POURQUOI PAS LES TUILES RASTER D'OPENSTREETMAP ?
 *   tile.openstreetmap.org donne le meilleur rendu sur le Cameroun et tenait
 *   en une ligne, mais la politique d'usage de la fondation OSM proscrit les
 *   applications à fort trafic et l'IP du serveur peut être bloquée sans
 *   préavis — ce qui couperait le fond de carte d'un coup en production.
 * =============================================================================
 */

import L from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';

/** Styles OpenFreeMap utilisés dans l'application. */
export const BASEMAP_STYLES = {
  /** Rendu complet type « plan » : voirie, quartiers, POI. */
  liberty:  'https://tiles.openfreemap.org/styles/liberty',
  /** Variante sombre — remplace l'ancien CARTO « dark_all ». */
  dark:     'https://tiles.openfreemap.org/styles/dark',
  /** Gris clair et discret, pour un fond qui ne doit pas concurrencer les données. */
  positron: 'https://tiles.openfreemap.org/styles/positron',
} as const;

export type BasemapStyle = keyof typeof BASEMAP_STYLES;

export const BASEMAP_ATTRIBUTION = '© OpenStreetMap, © OpenFreeMap';

/**
 * Imagerie satellite (Esri). Inchangée : ce service fonctionne toujours et
 * couvre correctement le Cameroun.
 */
export const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
export const SATELLITE_ATTRIBUTION = '© Esri, Maxar';

/**
 * Frontières et toponymes à superposer au satellite.
 *
 * L'ancien overlay CARTO (voyager_only_labels) est mort en même temps que le
 * fond : il renvoyait une tuile transparente de 116 octets. Celui-ci vient du
 * serveur qui fournit déjà l'imagerie, donc sans nouveau fournisseur. Sa
 * densité de noms reste faible sur le Cameroun — c'est le défaut connu du
 * catalogue Esri sur l'Afrique centrale.
 */
export const SATELLITE_LABELS_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

/**
 * Ajoute le fond vectoriel OpenFreeMap à une carte Leaflet et renvoie la
 * couche créée (pour pouvoir la retirer ensuite).
 *
 * `interactive: false` est ESSENTIEL : sans lui, le canvas WebGL capte les
 * clics et Leaflet ne reçoit plus rien — marqueurs, popups et sélection
 * deviennent inertes.
 */
export function addBasemap(map: L.Map, style: BasemapStyle = 'liberty'): L.Layer {
  // Le plugin s'enregistre sur l'objet L au moment de l'import ; il n'est pas
  // décrit par les types de Leaflet, d'où la conversion.
  return (L as unknown as {
    maplibreGL: (o: Record<string, unknown>) => L.Layer;
  }).maplibreGL({
    style: BASEMAP_STYLES[style],
    attribution: BASEMAP_ATTRIBUTION,
    interactive: false,
  }).addTo(map);
}
