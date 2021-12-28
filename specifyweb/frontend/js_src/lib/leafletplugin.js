'use strict';

import $ from 'jquery';

import {
  getLocalityDataFromLocalityResource
} from './localityrecorddataextractor';
import {formatLocalityData, showLeafletMap} from './leaflet';
import UIPlugin from './uiplugin';
import localityText from './localization/locality';
import commonText from './localization/common';

export default UIPlugin.extend(
  {
    __name__: 'GoogleMapsPlugin',
    events: {
      click: 'click',
    },
    render() {
      this.el.textContent = localityText('showMap');
      this.geoMapDialog = undefined;
      return this;
    },
    click(event_) {
      if (typeof this.geoMapDialog !== 'undefined') {
        this.geoMapDialog.dialog('close');
        return;
      }

      event_.preventDefault();

      const lat = this.model.get('latitude1');
      const long = this.model.get('longitude1');

      if (lat == undefined || long == undefined) {
        this.geoMapDialog = $(`<p>
        ${localityText('notEnoughInformationToMap')}
      </p>`).dialog({
          title: localityText('noCoordinates'),
          close() {
            $(this).remove();
          },
          buttons: {
            [commonText('close')]() {
              $(this).remove();
            },
          },
        });
        return;
      }

      this.el.ariaPressed = true;
      let fullLocalityData = undefined;
      const dialog = document.createElement('div');

      getLocalityDataFromLocalityResource(
        this.model,
        true
      ).then((localityData) =>
        showLeafletMap({
          localityPoints: [localityData],
          leafletMapContainer: dialog,
          markerClickCallback: (_, { target: marker }) =>
            (typeof fullLocalityData === 'undefined'
              ? getLocalityDataFromLocalityResource(
                  this.model
                )
              : Promise.resolve(fullLocalityData)
            ).then((localityData) => {
              fullLocalityData = localityData;
              marker
                .getPopup()
                .setContent(
                  formatLocalityData(localityData, undefined, true)
                );
            }),
        })
      );

      this.geoMapDialog = $(dialog);
      this.geoMapDialog.on('dialogbeforeclose', () => {
        this.el.ariaPressed = false;
        this.geoMapDialog = undefined;
      });
    },
  },
  { pluginsProvided: ['LocalityGoogleEarth'] }
);
