define([
    'jquery', 'underscore', 'specifyapi', 'latlongui', 'partialdateui',
    'collectionrelonetomanyplugin', 'collectionrelonetooneplugin',
    'uiplugin', 'geolocateplugin', 'weblinkbutton', 'attachmentplugin',
    'hosttaxonplugin', 'passwordplugin', 'useragentsplugin', 'adminstatusplugin',
    'googlemapsplugin',
    'templates'
], function($, _, api, LatLonUI, PartialDateUI, collectionrelonetomanyplugin,
            collectionrelonetooneplugin, UIPlugin, GeoLocatePlugin, WebLinkButton,
            AttachmentPlugin, HostTaxonPlugin, PasswordPlugin, UserAgentsPlugin,
            AdminStatusPlugin, GoogleMapsPlugin, templates) {
    "use strict";

    return {
        PasswordUI: PasswordPlugin,
        UserAgentsUI: UserAgentsPlugin,
        AdminStatusUI: AdminStatusPlugin,
        HostTaxonPlugin: HostTaxonPlugin,
        ColRelTypePlugin: collectionrelonetooneplugin,
        CollectionRelOneToManyPlugin: collectionrelonetomanyplugin,
        PartialDateUI: PartialDateUI,
        LatLonUI: LatLonUI,
        LocalityGeoRef: GeoLocatePlugin,
        WebLinkButton: WebLinkButton,
        AttachmentPlugin: AttachmentPlugin,
        LocalityGoogleEarth: GoogleMapsPlugin,
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
