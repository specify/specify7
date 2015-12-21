"use strict";

var $ = require('jquery');

var UIPlugin = require('./uiplugin.js');
var template = require('./templates/gmapplugin.html');

module.exports =  UIPlugin.extend({
        __name__: "GoogleMapsPlugin",
        events: {
            'click': 'click'
        },
        render: function() {
            this.$el.attr('value', 'Google Map').prop('disabled', false);
            return this;
        },
        click: function(evt) {
            evt.preventDefault();
            var lat = this.model.get('latitude1');
            var long = this.model.get('longitude1');
            if (lat != null && long != null) {
                var query = '' + lat + ',' + long;
                $('<div>').append(template({query: query})).dialog({
                    width: 800,
                    height: 600,
                    title: this.model.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); }
                }).css({ overflow: 'hidden' });
            } else {
                $('<div title="No coordinates"><p>Locality must have coordinates to be mapped.</p></div>')
                    .dialog({close: function() { $(this).remove(); }});
            }
        }
    }, { pluginsProvided: ['LocalityGoogleEarth'] });

