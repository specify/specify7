/**
 * Using Node.js --import API to resolve CSS, PNG, and SVG imports into
 * empty objects. This is a workaround to avoid errors:
 * TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".css"/.png"/.svg"
 *
 * The imports are there for webpack, and should be ignored
 * by Node.js
 *
 * See https://nodejs.org/api/module.html#hooks
 */

export const resolve = (specifier, context, nextResolve) =>
  nextResolve(
    /*
     * Do not import these modules as they rely on Leaflet's L
     * global variable
     */
    specifier.includes('leaflet.markercluster') ||
      specifier.includes('leaflet-gesture-handling') ||
      // Fake resolve CSS imports
      specifier.endsWith('.css') ||
      // Fake resolve PNG imports
      specifier.endsWith('.png') ||
      // Fake resolve SVG imports
      specifier.endsWith('.svg')
      ? new URL('__mocks__/fileMock.ts', import.meta.url).href
      : specifier,
    context
  );
