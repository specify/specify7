define([
    'jquery', 'underscore', 'specifyapi', 'latlongui', 'partialdateui',
    'collectionrelonetomanyplugin', 'collectionrelonetooneplugin',
    'uiplugin', 'geolocateplugin', 'weblinkbutton', 'attachmentplugin', 'templates'
], function($, _, api, LatLonUI, PartialDateUI, collectionrelonetomanyplugin,
            collectionrelonetooneplugin, UIPlugin, GeoLocatePlugin, WebLinkButton,
            AttachmentPlugin, templates) {
    "use strict";

    return {
        ColRelTypePlugin: collectionrelonetooneplugin,
        CollectionRelOneToManyPlugin: collectionrelonetomanyplugin,
        PartialDateUI: PartialDateUI,
        LatLonUI: LatLonUI,
        LocalityGeoRef: GeoLocatePlugin,
        WebLinkButton: WebLinkButton,
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
                var self = this;
                evt.preventDefault();
                $('<div>').append(templates.gmapplugin(self.model.toJSON())).dialog({
                    width: 800,
                    height: 600,
                    title: self.model.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); }
                }).css({ overflow: 'hidden' });
            }
        }),
        AttachmentPlugin: AttachmentPlugin
    };
});
