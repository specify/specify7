define(['jquery', 'underscore', 'backbone', 'schema'
], function($, _, Backbone, schema) {
    "use strict";
    var trees = ['geography', 'geologictimeperiod', 'lithostrat', 'storage', 'taxon'];

    var TreeListDialog = Backbone.View.extend({
        __name__: "TreeListDialog",
        className: "table-list-dialog",
        render: function() {
            var entries = _.map(trees, this.dialogEntry, this);
            var table = $('<table>').append(entries).appendTo(this.el);
            this.$el.dialog({
                title: 'Trees',
                modal: true,
                close: function() { $(this).remove(); },
                buttons: [{ text: 'Cancel', click: function() { $(this).dialog('close'); } }]
            });
            return this;
        },
        dialogEntry: function(tree) {
            var model = schema.getModel(tree);
            var img = $('<img>', { src: model.getIcon() });
            var link = $('<a>', {href: '/specify/tree/' + tree + '/'})
                    .addClass("intercept-navigation")
                    .text(model.getLocalizedName());
            return $('<tr>').append($('<td>').append(img), $('<td>').append(link))[0];
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
