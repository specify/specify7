/*
* Imports Leaflet, adds new controls and reexports it
* */

'use strict';

import L   from 'leaflet';
import'leaflet/dist/leaflet.css';

/* This code is needed to properly load the images in the Leaflet CSS */
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

//create a "full screen" button
// @ts-ignore
L.Control.FullScreen = L.Control.extend({
  onAdd: function(map:L.Map) {
    const img = L.DomUtil.create('img') as HTMLImageElement;
    img.style.cursor = 'pointer';
    img.classList.add('full-screen');

    L.DomEvent.on(
      img, 'click', L.DomEvent.stopPropagation,
    ).on(
      img, 'click', L.DomEvent.preventDefault,
    ).on(
      img, 'click', () => toggleFullScreen(map),
    );

    img.src = '/static/img/full_screen.png';
    img.style.width = '50px';

    // @ts-ignore
    this.img = img;

    return img;
  },

  onRemove: () => {
  },
});

function toggleFullScreen(map:L.Map) {
  // @ts-ignore
  const dialog = $(map._container.closest('.ui-dialog-content'));
  const [width, height] = dialog[0].parentElement.style.top === '0px' ?
    [900, 600] :
    [window.innerWidth, window.innerHeight];
  dialog.dialog('option', 'width', width);
  dialog.dialog('option', 'height', height);
  map.invalidateSize();
}

// @ts-ignore
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

  onRemove: () => {
  },
});

export default L;
