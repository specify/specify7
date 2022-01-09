/**
 * Imports Leaflet, adds plugins along with new controls and reexports it
 *
 * @module
 */

// eslint-disable-next-line simple-import-sort/imports
import $ from 'jquery';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';
// Marker Clustering
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
// Create sub-layers to selectively toggle markers in clusters
import 'leaflet.featuregroup.subgroup';

import localityText from './localization/locality';
import { legacyNonJsxIcons } from './components/icons';

/* This code is needed to properly load the images in the Leaflet's CSS */
// @ts-expect-error
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/* Create a "full screen" button */
// @ts-expect-error
L.Control.FullScreen = L.Control.extend({
  onAdd(map: Readonly<L.Map>) {
    const button = L.DomUtil.create('button') as HTMLImageElement;
    button.title = localityText('toggleFullScreen');
    button.classList.add('button', 'bg-black', 'p-2', '!cursor-pointer');
    button.innerHTML = `<img class="w-6" src="/static/img/full_screen.svg" alt="${localityText(
      'toggleFullScreen'
    )}">`;

    let isFullScreen = false;
    L.DomEvent.on(button, 'click', (event) => {
      L.DomEvent.stopPropagation(event);
      L.DomEvent.preventDefault(event);
      toggleFullScreen(map);
      isFullScreen = !isFullScreen;
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
      'button',
      'leaflet-print-map',
      'px-2',
      'bg-black',
      // Hidden by default, until map enters the full-screen mode
      'hidden'
    );
    button.innerHTML = legacyNonJsxIcons.printer;

    L.DomEvent.on(button, 'click', (event) => {
      L.DomEvent.stopPropagation(event);
      L.DomEvent.preventDefault(event);
      window.print();
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

const DEFAULT_MAP_SIZE_X = 900;
const DEFAULT_MAP_SIZE_Y = 600;

function toggleFullScreen(
  map: Readonly<L.Map>,
  stateOverwrite: boolean | undefined = undefined
): void {
  // @ts-expect-error
  const dialog = $(map._container.closest('.ui-dialog-content'));
  const newState =
    typeof stateOverwrite === 'boolean'
      ? stateOverwrite
      : dialog[0].parentElement.style.top !== '0px';
  const [width, height] = newState
    ? [window.innerWidth, window.innerHeight]
    : [DEFAULT_MAP_SIZE_X, DEFAULT_MAP_SIZE_Y];
  dialog.dialog('option', 'width', width);
  dialog.dialog('option', 'height', height);
  map.invalidateSize();

  const container = map.getContainer();
  if (newState) container.classList.add('leaflet-map-full-screen');
  else container.classList.remove('leaflet-map-full-screen');
}

export { default } from 'leaflet';
