/**
 * Leaflet references "window" and other globals on import, and thus throws
 * exceptions when called from a Node.JS environment
 *
 * Define mock objects before importing leaflet and return to previous values
 * afterward (which are likely "undefined")
 *
 * @remarks
 * This may break for future versions of Leaflet
 */
export function leafletStub(): void {
  const previousWindow = globalThis.window;
  globalThis.window = {
    devicePixelRatio: 1,
  } as unknown as typeof window;
  const previousDocument = globalThis.document;
  globalThis.document = {
    documentElement: {
      style: {},
    },
    createElement: () => ({
      getContext: {},
    }),
  } as unknown as typeof document;
  const previousNavigator = globalThis.navigator;
  globalThis.navigator = {
    userAgent: '',
    platform: '',
  } as unknown as typeof navigator;

  require('leaflet');

  globalThis.window = previousWindow;
  globalThis.document = previousDocument;
  globalThis.navigator = previousNavigator;
}
