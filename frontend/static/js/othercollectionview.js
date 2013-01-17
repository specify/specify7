define([
    'jquery', 'underscore', 'backbone', 'templates', 'jquery-ui'
], function($, _, Backbone, templates) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'click a': 'clicked'
        },
        render: function() {
            var self = this;
            var collections = self.options.collections;
            self.$el.empty();
            if (collections.length > 1) {
                self.$el.html(templates.othercollections());
                var ul = self.$('ul');
                var li = ul.find('li').detach();
                _.each(collections, function(collection) {
                    li.clone().appendTo(ul).find('a')
                        .text(collection.get('collectionname'))
                        .data('collection-id', collection.id)
                        .button();
                });
            } else {
                self.$el.html(templates.othercollection());
                self.$('a').data('collection-id', collections[0].id).button();
                self.$('span.collection-name').text(collections[0].get('collectionname'));
            }
            return self;
        },
        clicked: function(evt) {
            evt.preventDefault();
            var collectionId = $(evt.currentTarget).data('collection-id');
            var request = $.ajax({
                url: '/context/collection/',
                type: 'POST',
                data: collectionId,
                processData: false});

            request.done(function() { window.location.reload(); });
        }
    });
});
