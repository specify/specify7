/*
 * Imports Leaflet, adds plugins along with new controls and reexports it
 */

'use strict';

import L from 'leaflet';
import $ from 'jquery';
import 'leaflet/dist/leaflet.css';
// Marker Clustering
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster/dist/leaflet.markercluster.js';
// Create sub-layers to selectively toggle markers in clusters
import 'leaflet.featuregroup.subgroup';

/* This code is needed to properly load the images in the Leaflet CSS */
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
    img.style.cursor = 'pointer';
    img.style.background = '#fffa';
    img.classList.add('full-screen');

    L.DomEvent.on(img, 'click', L.DomEvent.stopPropagation)
      .on(img, 'click', L.DomEvent.preventDefault)
      .on(img, 'click', () => toggleFullScreen(map));

    img.src = '/static/img/full_screen.png';
    img.style.width = '50px';

    // @ts-expect-error
    this.img = img;

    return img;
  },

  onRemove: () => {},
});

const DEFAULT_MAP_SIZE_X = 900;
const DEFAULT_MAP_SIZE_Y = 600;

function toggleFullScreen(map: Readonly<L.Map>): void {
  // @ts-expect-error
  const dialog = $(map._container.closest('.ui-dialog-content'));
  const [width, height] =
    dialog[0].parentElement.style.top === '0px'
      ? [DEFAULT_MAP_SIZE_X, DEFAULT_MAP_SIZE_Y]
      : [window.innerWidth, window.innerHeight];
  dialog.dialog('option', 'width', width);
  dialog.dialog('option', 'height', height);
  map.invalidateSize();
}

// @ts-expect-error
L.Control.Details = L.Control.extend({
  onAdd: () => {
    const details = L.DomUtil.create('details');
    details.classList.add('details-container');
    details.setAttribute('open', 'open');
    details.style.background = '#000c';
    details.style.padding = '10px';
    details.style.maxWidth = '50%';
    details.style.minWidth = '92px';
    details.innerHTML = `
      <summary style="font-size:1rem">Details</summaryi>
      <span></span>
    `;

    return details;
  },

  onRemove: () => {},
});

export default L;
