/**
 * Imports Leaflet, adds plugins along with new controls and reexports it
 *
 * @module
 */

// eslint-disable-next-line simple-import-sort/imports
import $ from 'jquery';
import L from 'leaflet';

import '../css/leaflet.css';
import 'leaflet/dist/leaflet.css';
// Marker Clustering
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster';
// Create sub-layers to selectively toggle markers in clusters
import 'leaflet.featuregroup.subgroup';

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
    const img = L.DomUtil.create('img') as HTMLImageElement;
    img.classList.add('leaflet-full-screen-toggle');
    img.src = '/static/img/full_screen.svg';

    L.DomEvent.on(img, 'click', (event) => {
      L.DomEvent.stopPropagation(event);
      L.DomEvent.preventDefault(event);
      toggleFullScreen(map);
    });

    // @ts-expect-error
    this.img = img;

    return img;
  },

  onRemove() {
    // @ts-expect-error Somebody did a really poor job of typing Leaflet
    L.DomEvent.off(this.img);
  },
});

/* Adds a printer icon to print the map */
// @ts-expect-error
L.Control.PrintMap = L.Control.extend({
  onAdd() {
    const button = L.DomUtil.create('span') as HTMLSpanElement;
    button.classList.add('leaflet-print-map');
    button.textContent = '🖨️';

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

// @ts-expect-error
L.Control.Details = L.Control.extend({
  onAdd: () => {
    const details = L.DomUtil.create('details');
    details.classList.add('leaflet-details-container');
    details.setAttribute('open', 'open');
    details.innerHTML = `
      <summary style="font-size:1rem"></summary>
      <span></span>
    `;

    return details;
  },
});

export default L;
