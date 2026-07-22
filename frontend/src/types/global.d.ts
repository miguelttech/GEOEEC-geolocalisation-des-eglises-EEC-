export {};

// Pont de communication simple entre AdminShell (source de vérité du thème)
// et Topbar/paramètres (déclencheurs du changement) — évite un cast "as any"
// sur `window` à chaque usage.
declare global {
  interface Window {
    __setEECTheme?: (theme: 'dark' | 'light') => void;
  }
}
