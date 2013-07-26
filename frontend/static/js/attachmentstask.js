define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'attachments',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, api, attachments) {
    "use strict";

    var win = $(window);
    var doc = $(document);

    var AttachmentsView = Backbone.View.extend({
        initialize: function() {
            var self = this;
            self.fetching = false;
            self.attachments = new (api.Collection.forModel('attachment'))();
            self.index = 0;
        },
        fetchMore: function() {
            var self = this;
            self.fetching = true;
            return self.attachments.fetch({ at: self.index }).done(function() { self.fetching = false; });
        },
        renderAvailable: function() {
            var self = this;
            while (self.index < self.attachments.length) {
                var attachment = self.attachments.at(self.index);
                if (_.isUndefined(attachment)) return;
                self.$el.append(self.makeThumbnail(attachment));
                self.index++;
            }
        },
        makeThumbnail: function(attachment) {
            var filename = attachment.get('attachmentlocation');
            var cell = $('<div>');
            attachments.getThumbnail(attachment, 123).done(function(img) {
                cell.append(img);
            });
            return cell;
        },
        fillPage: function() {
            var self = this;
            if (self.attachments.populated && self.index >= self.attachments.length) return;
            if (!self.fetching && win.scrollTop() + win.height() + 100 > doc.height()) {
                self.fetchMore().done(function () {
                    self.renderAvailable();
                    self.fillPage();
                });
            }
        },
        render: function() {
            var self = this;
            self.$el.addClass('specify-attachment-browser');
            win.scroll(function() { self.fillPage(); });
            self.fillPage();
        }
    });

    return function(app) {
        app.router.route('attachments/', 'attachments', function () {
            app.setCurrentView(new AttachmentsView());
        });
    };
});
