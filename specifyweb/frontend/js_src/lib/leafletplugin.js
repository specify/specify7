'use strict';

import $ from 'jquery';

import { getLocalityDataFromLocalityResource } from './localityrecorddataextractor';
import { showLeafletMap, formatLocalityData } from './leaflet';
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
      this.$el.attr('value', localityText('showMap')).prop('disabled', false);
      return this;
    },
    click(event_) {
      event_.preventDefault();

      const lat = this.model.get('latitude1');
      const long = this.model.get('longitude1');

      if (lat == undefined || long == undefined)
        return $(`<div>
        ${localityText('notEnoughInformationToMap')}
      </div>`).dialog({
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

      let fullLocalityData = undefined;

      getLocalityDataFromLocalityResource(
        this.model,
        true
      ).then((localityData) =>
        showLeafletMap({
          localityPoints: [localityData],
          leafletMapContainer: 'leaflet-plugin',
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
    },
  },
  { pluginsProvided: ['LocalityGoogleEarth'] }
);
