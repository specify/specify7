define([
    'jquery', 'underscore', 'backbone',
], function($, _, Backbone) {
    "use strict";

    return Backbone.View.extend({
        events: {
            'click a': 'clicked'
        },
        render: function() {
            var self = this;
            self.$el.empty();
            self.$el.append("<p>The requested resource cannot be viewed while logged into the current collection. Select one of the following collections:</p>");
            var ul = $('<ul>').appendTo(self.el);

            _.each(self.options.collections, function(collection) {
                var li = $('<li>').append(
                    $('<a>').data('collection-id', collection.id)
                        .text(collection.get('collectionname')));
                ul.append(li);
            });
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
