define(['jquery', 'underscore', 'backbone', 'schema'
], function($, _, Backbone, schema) {
    "use strict";
    var trees = ['geography', 'geologictimeperiod', 'lithostrat', 'storage', 'taxon'];

    var TreeListDialog = Backbone.View.extend({
        __name__: "TreeListDialog",
        className: "list-dialog",
        render: function() {
            var ul = $('<ul>').appendTo(this.el);
            _.each(trees, function(tree) {
                var model = schema.getModel(tree);
                $('<a class="intercept-navigation">').attr('href', '/specify/tree/' + tree + '/')
                    .text(model.getLocalizedName())
                    .prepend($('<img>').attr('src', model.getIcon()))
                    .appendTo($('<li>').appendTo(ul));
            });
            this.$el.dialog({
                title: 'Trees',
                modal: true,
                close: function() { $(this).remove(); }
            });
            return this;
        }
    });

    return {
        task: 'tree',
        title: 'Trees',
        icon: '/images/Tree32x32.png',
        execute: function() {
            new TreeListDialog().render();
        }
    };
});
