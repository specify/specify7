define([
    'jquery', 'underscore', 'specifyapi', 'latlongui', 'partialdateui', 'uiplugin', 'templates'
], function($, _, api, LatLonUI, PartialDateUI, UIPlugin, templates) {
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
                return self;
            }
        }),
        LocalityGoogleEarth: UIPlugin.extend({
            render: function() {
                var self = this;
                self.model.fetchIfNotPopulated().done(function() {
                    var ui = templates.gmapplugin(self.model.toJSON());
                    self.$el.replaceWith(ui);
                    self.setElement(ui);
                });
                return this;
            }
        })
    };
});
