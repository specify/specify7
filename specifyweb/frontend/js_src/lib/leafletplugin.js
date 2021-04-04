'use strict';

const $ = require('jquery');

const LeafletUtils = require('./leafletutils.ts');
const Leaflet = require('./leaflet.ts');
const UIPlugin = require('./uiplugin.js');

module.exports = UIPlugin.extend({
  __name__: 'GoogleMapsPlugin',
  events: {
    'click': 'click',
  },
  render: function() {
    this.$el.attr('value', 'Leaflet Map').prop('disabled', false);
    return this;
  },
  click: function(evt) {
    evt.preventDefault();

    const lat = this.model.get('latitude1');
    const long = this.model.get('longitude1');

    if (lat == null || long == null)
      return $(`<div title="No coordinates">
        Locality must have coordinates to be mapped.
      </div>`).dialog({
        close: function() {
          $(this).remove();
        },
        buttons: {
          'close': function(){
            $(this).remove();
          }
        }
      });

    LeafletUtils.getLocalityDataFromLocalityResource(
      this.model
    ).then(localityData =>
      Leaflet.showLeafletMap({
        localityPoints: [localityData],
      }),
    );
  },
}, {pluginsProvided: ['LocalityGoogleEarth']});

