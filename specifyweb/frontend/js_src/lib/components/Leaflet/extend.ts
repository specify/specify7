/**
 * Imports Leaflet, adds plugins along with new controls and reexports it
 *
 * @module
 */

// eslint-disable-next-line simple-import-sort/imports
import 'leaflet/dist/leaflet.css';
// This must preceded leaflet.markercluster imports
import L from 'leaflet';
// Marker Clustering
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
// Create sub-layers to selectively toggle markers in clusters
import 'leaflet.featuregroup.subgroup';
import GestureHandling from 'leaflet-gesture-handling';

import { localityText } from '../../localization/locality';
import { renderToStaticMarkup } from 'react-dom/server';
import { icons } from '../Atoms/Icons';
import { className } from '../Atoms/className';
// @ts-expect-error Path to non-ts file
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
// @ts-expect-error Path to non-ts file
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// @ts-expect-error Path to non-ts file
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

/* This code is needed to properly load the images in the Leaflet's CSS */
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

/** Create a "full screen" button */
export const leafletControls = {
  FullScreen: (handleChange: (isEnabled: boolean) => void) =>
    L.Control.extend({
      onAdd(map: Readonly<L.Map>) {
        const button = L.DomUtil.create('button') as HTMLButtonElement;
        button.title = localityText.toggleFullScreen();
        button.ariaLabel = localityText.toggleFullScreen();
        button.classList.add(
          className.button,
          'bg-white',
          'dark:bg-black',
          'p-2',
          '!cursor-pointer',
          'rounded'
        );
        button.innerHTML = renderToStaticMarkup(icons.arrowsExpand);

        let isFullScreen = false;
        L.DomEvent.on(button, 'click', (event) => {
          L.DomEvent.stopPropagation(event);
          L.DomEvent.preventDefault(event);
          isFullScreen = !isFullScreen;
          // @ts-expect-error GestureHandling plugin has no type definitions
          map.gestureHandling[isFullScreen ? 'disable' : 'enable']();
          handleChange(isFullScreen);
          button.parentElement
            ?.getElementsByClassName('leaflet-print-map')[0]
            ?.classList[isFullScreen ? 'remove' : 'add']('hidden');
        });

        // @ts-expect-error
        this.button = button;

        return button;
      },

      onRemove() {
        // @ts-expect-error Somebody did a really poor job of typing Leaflet
        L.DomEvent.off(this.button);
      },
    }),
  /** Adds a printer icon to print the map */
  PrintMap: L.Control.extend({
    onAdd() {
      const button = L.DomUtil.create('button') as HTMLSpanElement;
      button.classList.add(
        className.button,
        'leaflet-print-map',
        'p-2',
        'bg-white',
        'dark:bg-black',
        '!cursor-pointer',
        'rounded',
        // Hidden by default, until map enters the full-screen mode
        'hidden'
      );
      button.innerHTML = renderToStaticMarkup(icons.document)

      L.DomEvent.on(button, 'click', (event) => {
        L.DomEvent.stopPropagation(event);
        L.DomEvent.preventDefault(event);
        globalThis.print();
      });

      // @ts-expect-error
      this.button = button;

      return button;
    },
    onRemove() {
      // @ts-expect-error Somebody did a really poor job of typing Leaflet
      L.DomEvent.off(this.button);
    },
  }),
} as const;

export { default } from 'leaflet';
