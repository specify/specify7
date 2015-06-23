define([
    'jquery', 'underscore', 'backbone', 'templates', 'navigation', 'jquery-ui'
], function($, _, Backbone, templates, navigation) {
    "use strict";

    return Backbone.View.extend({
        __name__: "OtherCollectionView",
        events: {
            'click a': 'clicked'
        },
        initialize: function(options) {
            this.resource = options.resource;
            this.collections = options.collections;
        },
        render: function() {
            this.$el.empty();
            if (this.collections.length > 1) {
                this.$el.html(templates.othercollections());
                var ul = this.$('ul');
                var li = ul.find('li').detach();
                _.each(this.collections, function(collection) {
                    li.clone().appendTo(ul).find('a')
                        .text(collection.get('collectionname'))
                        .data('collection-id', collection.id)
                        .button();
                }, this);
            } else {
                this.$el.html(templates.othercollection());
                this.$('a').data('collection-id', this.collections[0].id).button();
                this.$('span.collection-name').text(this.collections[0].get('collectionname'));
            }
            return this;
        },
        clicked: function(evt) {
            evt.preventDefault();
            navigation.switchCollection($(evt.currentTarget).data('collection-id'));
        }
    });
});
