'use strict';

const $ = require('jquery');

const LocalityRecordDataExtractor = require('./localityrecorddataextractor.ts');
const Leaflet = require('./leaflet.ts');
const UIPlugin = require('./uiplugin.js');

module.exports = UIPlugin.extend(
  {
    __name__: 'GoogleMapsPlugin',
    events: {
      click: 'click',
    },
    render() {
      this.$el.attr('value', 'Show Map').prop('disabled', false);
      return this;
    },
    click(event_) {
      event_.preventDefault();

      const lat = this.model.get('latitude1');
      const long = this.model.get('longitude1');

      if (lat == undefined || long == undefined)
        return $(`<div title="No coordinates">
        Locality must have coordinates to be mapped.
      </div>`).dialog({
          close() {
            $(this).remove();
          },
          buttons: {
            close() {
              $(this).remove();
            },
          },
        });

      LocalityRecordDataExtractor.getLocalityDataFromLocalityResource(
        this.model
      ).then((localityData) =>
        Leaflet.showLeafletMap({
          localityPoints: [localityData],
          leafletMapContainer: 'leaflet-plugin',
        })
      );
    },
  },
  { pluginsProvided: ['LocalityGoogleEarth'] }
);
