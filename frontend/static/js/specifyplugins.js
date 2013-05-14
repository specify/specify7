define([
    'jquery', 'underscore', 'specifyapi', 'latlongui', 'partialdateui',
    'collectionrelonetomanyplugin', 'collectionrelonetooneplugin',
    'uiplugin', 'geolocateplugin', 'weblinkbutton', 'templates'
], function($, _, api, LatLonUI, PartialDateUI, collectionrelonetomanyplugin,
            collectionrelonetooneplugin, UIPlugin, GeoLocatePlugin, WebLinkButton, templates) {
    "use strict";

    return {
        ColRelTypePlugin: collectionrelonetooneplugin,
        CollectionRelOneToManyPlugin: collectionrelonetomanyplugin,
        PartialDateUI: PartialDateUI,
        LatLonUI: LatLonUI,
        LocalityGeoRef: GeoLocatePlugin,
        WebLinkButton: WebLinkButton,
        LocalityGoogleEarth: UIPlugin.extend({
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
                    width: 455,
                    title: self.model.specifyModel.getLocalizedName(),
                    close: function() { $(this).remove(); }
                });
            }
        }),
        AttachmentPlugin: UIPlugin.extend({
            render: function() {
                var self = this;
                var control = $('<div class="specify-attachment-container">');
                self.$el.replaceWith(control);
                self.setElement(control);

                $('<div class="specify-attachment-display">').appendTo(self.el);

                if (!self.model.isNew()) {
                    self.model.rget('attachment', true).done(function(attachment) {
                        self.displayAttachment(attachment);
                    });
                }
                return this;
            },
            displayAttachment: function(attachment) {
                var self = this;

                function dsp(src) {
                    if (/^image/.exec(attachment.get('mimetype'))) {
                        $('<img>', {src: src, style: 'vertical-align: middle'})
                            .appendTo(self.$('.specify-attachment-display'));
                    }
                    var url = "http://anza.nhm.ku.edu/specifyassets/Ichthyology/originals/"
                        + attachment.get('attachmentlocation');
                    $('<a>', {href: url, 'class': 'specify-attachment-original'})
                        .text('Original').appendTo(self.el).click(function(evt) {
                            evt.preventDefault();
                            window.open(url);
                        });
                }

                if (attachment.src) {
                    dsp(attachment.src);
                    return;
                }

                var location = attachment.get('attachmentlocation');
                $.ajax({
                    url: "http://anza.nhm.ku.edu/getfileref.php",
                    data: {
                        coll: "KUFishvoucher",
                        type: 0,
                        filename: location,
                        scale: 500
                    },
                    success: function(src) {
                        attachment.src = src;
                        dsp(src);
                    }
                });
            }
        })
    };
});
