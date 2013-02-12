define([
    'jquery', 'underscore', 'specifyapi', 'latlongui', 'partialdateui', 'uiplugin', 'geolocateplugin', 'templates'
], function($, _, api, LatLonUI, PartialDateUI, UIPlugin, GeoLocatePlugin, templates) {
    "use strict";

    return {
        PartialDateUI: PartialDateUI,
        LatLonUI: LatLonUI,
        WebLinkButton: UIPlugin.extend({
            render: function() {
                var self = this;
                var init = self.init;
                var form = self.$el.closest('.specify-view-content');
                var watched = form.find(
                    '#' + 'specify-field-' + form.prop('id').split('-').pop() + '-' + init.watch);
                switch(init.weblink) {
                case 'MailTo':
                    self.$el.click(function() {
                        var addr = watched.val();
                        addr && window.open('mailto:' + addr);
                    });
                    self.$el.attr('value', 'EMail');
                    break;
                }
                self.$el.prop('disabled', false);
                return self;
            }
        }),
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
        LocalityGeoRef: GeoLocatePlugin,
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
