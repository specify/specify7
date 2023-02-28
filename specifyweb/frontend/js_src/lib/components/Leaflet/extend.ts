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
import 'leaflet.markercluster/dist/leaflet.markercluster';
// Create sub-layers to selectively toggle markers in clusters
import 'leaflet.featuregroup.subgroup';
import GestureHandling from 'leaflet-gesture-handling';

import { localityText } from '../../localization/locality';
import { legacyNonJsxIcons } from '../Atoms/Icons';
import { className } from '../Atoms/className';

/* This code is needed to properly load the images in the Leaflet's CSS */
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

/* Create a "full screen" button */
// @ts-expect-error
L.Control.FullScreen = L.Control.extend({
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
    button.innerHTML = legacyNonJsxIcons.arrowsExpand;

    let isFullScreen = false;
    L.DomEvent.on(button, 'click', (event) => {
      L.DomEvent.stopPropagation(event);
      L.DomEvent.preventDefault(event);
      isFullScreen = !isFullScreen;
      // @ts-expect-error GestureHandling plugin has no type definitions
      map.gestureHandling[isFullScreen ? 'enable' : 'disable']();
      (
        this as unknown as {
          readonly options: { readonly callback: (isEnabled: boolean) => void };
        }
      ).options.callback(isFullScreen);
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
});

/* Adds a printer icon to print the map */
// @ts-expect-error
L.Control.PrintMap = L.Control.extend({
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
    button.innerHTML = legacyNonJsxIcons.printer;

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
});

export { default } from 'leaflet';
