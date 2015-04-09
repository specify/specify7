define([
    'jquery', 'underscore', 'specifyapi', 'latlongui', 'partialdateui',
    'collectionrelonetomanyplugin', 'collectionrelonetooneplugin',
    'uiplugin', 'geolocateplugin', 'weblinkbutton', 'attachmentplugin',
    'hosttaxonplugin', 'templates'
], function($, _, api, LatLonUI, PartialDateUI, collectionrelonetomanyplugin,
            collectionrelonetooneplugin, UIPlugin, GeoLocatePlugin, WebLinkButton,
            AttachmentPlugin, HostTaxonPlugin, templates) {
    "use strict";

    return {
        HostTaxonPlugin: HostTaxonPlugin,
        ColRelTypePlugin: collectionrelonetooneplugin,
        CollectionRelOneToManyPlugin: collectionrelonetomanyplugin,
        PartialDateUI: PartialDateUI,
        LatLonUI: LatLonUI,
        LocalityGeoRef: GeoLocatePlugin,
        WebLinkButton: WebLinkButton,
        AttachmentPlugin: AttachmentPlugin,
        LocalityGoogleEarth: UIPlugin.extend({
            __name__: "LocalityGoogleEarthPlugin",
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
                    $('<div>').append(templates.gmapplugin({query: query})).dialog({
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
        }),
        PluginNotAvailable: UIPlugin.extend({
            __name__: "UnavailablePlugin",
            events: {
                'click': 'click'
            },
            render: function() {
                this.$el.attr('value', 'Plugin N/A').prop('disabled', false);
                return this;
            },
            click: function(evt) {
                evt.preventDefault();
                $('<div title="Plugin Not Available">' +
                 'This plugin in currently unavailable for <i>Specify&nbsp7</i>. ' +
                 'It was probably included on this form from <i>Specify&nbsp6</i> and ' +
                 'may be supported in the future.</div>')
                .append('<dt>Plugin name:</dt>')
                .append($('<dd>').text(this.init.name))
                .dialog({
                    modal: true,
                    close: function() { $(this).remove(); }
                });
            }
        })
    };
});
