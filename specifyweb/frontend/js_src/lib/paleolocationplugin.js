"use strict";

var $ = require('jquery');

var UIPlugin = require('./uiplugin.js');
var template = require('./templates/pmapplugin.html');
const Q = require('q');
const schema = require('./schema.js');

module.exports =  UIPlugin.extend({
        __name__: "PaleolocationMapPlugin",
        events: {
            'click': 'click'
        },
        render: function() {
            this.$el.attr('value', 'Paleo Map').prop('disabled', false);
            return this;
        },
        click: function(evt) {
            evt.preventDefault();
            var lat = this.model.get('latitude1');
            var lng = this.model.get('longitude1');
            var start_ma = Q(this.model.rget('paleocontext', true))
                  .then(pc => pc == null ? '' : pc.get('chronosstratid'))
                  .Q(this.model.rget('geologictimeperiod', true))
                  .then(gtp => gtp == null ? '' : gtp.get('startperiod'));
            if (lat != null && lng != null && start_ma != null) {
                $('<div>').append(template({lat: lat, lng: lng, ma: start_ma})).dialog({
                    width: 800,
                    height: 600,
                    title: this.model.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); }
                }).css({ overflow: 'hidden' });
            } else {
                $('<div title="No coordinates"><p>Locality must have coordinates and paleo context to be mapped.</p></div>')
                    .dialog({close: function() { $(this).remove(); }});
            }
        }
    }, { pluginsProvided: ['LocalityPaleoMap'] });

