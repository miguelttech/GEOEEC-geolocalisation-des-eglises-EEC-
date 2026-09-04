/**
 * Garde-fou contre un bug de l'instrumentation React Server Components (dev).
 *
 * Dans react-server-dom-turbopack-client.browser.development.js, la fonction
 * flushComponentPerformance initialise `childrenEndTime = -Infinity` et s'en
 * sert comme maximum courant sur les enfants. Quand un Server Component n'a
 * aucun enfant horodaté, la valeur reste -Infinity et part telle quelle :
 *
 *     performance.measure(nom, {
 *       start: 0 > startTime ? 0 : startTime,   // borné
 *       end:   childrenEndTime,                 // PAS borné → -Infinity
 *     });
 *
 * Firefox rejette alors l'appel :
 *     TypeError: Performance.measure: Given attribute end cannot be negative
 *
 * Vérifié présent à l'identique dans Next 16.2.11 ET 16.3.4 (dernière version) :
 * la mise à jour ne corrige pas. On borne donc l'argument nous-mêmes.
 *
 * Uniquement en développement : le build de production de ce module React ne
 * contient aucun appel à performance.measure.
 */
export const PERFORMANCE_MEASURE_GUARD = `(function () {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') return;
  if (performance.measure.__eecGuarded) return;

  var original = performance.measure.bind(performance);

  // Un nombre est utilisable comme borne s'il est fini et positif.
  function invalid(v) { return typeof v === 'number' && !(isFinite(v) && v >= 0); }

  function guarded(name, startOrOptions, endMark) {
    if (startOrOptions !== null && typeof startOrOptions === 'object') {
      var o = startOrOptions, patched = null;

      // 'start' hors bornes → 0
      if (invalid(o.start)) { patched = Object.assign({}, o); patched.start = 0; }

      // 'end' hors bornes → on retombe sur le start (mesure de durée nulle),
      // jamais sur une valeur inventée. On ne touche 'end' que s'il existe,
      // pour ne pas entrer en conflit avec la forme { start, duration }.
      if ('end' in o && invalid(o.end)) {
        patched = patched || Object.assign({}, o);
        patched.end = (typeof patched.start === 'number' && !invalid(patched.start))
          ? patched.start
          : 0;
      }
      return original(name, patched || o);
    }
    // Formes historiques : measure(nom), measure(nom, markDébut, markFin)
    return arguments.length > 2
      ? original(name, startOrOptions, endMark)
      : (arguments.length > 1 ? original(name, startOrOptions) : original(name));
  }

  guarded.__eecGuarded = true;
  performance.measure = guarded;
})();`;
