"use strict";

var $ = require('jquery');

var Leaflet = require('./leaflet.js');
var UIPlugin = require('./uiplugin.js');

module.exports =  UIPlugin.extend({
        __name__: "GoogleMapsPlugin",
        events: {
            'click': 'click'
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
                return $('<div title="No coordinates"><p>Locality must have coordinates to be mapped.</p></div>')
                    .dialog({
                        close: function(){
                            $(this).remove();
                        }
                    });

            Leaflet.getLocalityDataFromLocalityResource(this.model).then(locality_data=>
                Leaflet.showLeafletMap({
                    locality_points:[locality_data]
                })
            );
        }
    }, { pluginsProvided: ['LocalityGoogleEarth'] });

