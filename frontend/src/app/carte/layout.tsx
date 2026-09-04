import type { Viewport } from 'next';

/**
 * La carte est une application plein écran, pas un document : le zoom de page
 * du navigateur y est nuisible. Sans cette déclaration, un pincement dont un
 * doigt tombe sur une surcouche (barre de recherche, puces de filtre, bouton
 * hamburger, mention d'attribution) échappe à Leaflet et agrandit TOUTE la
 * page — l'interface se retrouve décalée et le zoom à deux doigts paraît
 * capricieux. Le zoom de la carte elle-même reste évidemment disponible :
 * pincement sur la carte, et boutons +/−.
 *
 * `viewportFit: 'cover'` étend le rendu sous les encoches et barres système
 * des téléphones récents.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0D1A0F',
};

export default function CarteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
