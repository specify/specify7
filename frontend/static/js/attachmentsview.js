define([
    'jquery', 'underscore', 'backbone', 'specifyapi',
    'jquery-ui', 'jquery-bbq'
], function($, _, Backbone, api) {
    "use strict";

    var win = $(window);
    var doc = $(document);

    return Backbone.View.extend({
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
            var filename = attachment.get('attachmentlocation').split('.');
            filename.pop();
            filename.push('png');
            var src = '/static/attachment_thumbs/' + filename.join('.');
            var cell = $('<div>');
            $('<img>', {src: src}).appendTo(cell);
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
});
