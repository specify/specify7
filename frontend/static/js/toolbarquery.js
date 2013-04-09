define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi', 'navigation', 'jquery-ui'
], function($, _, Backbone, schema, api, navigation) {
    "use strict";
    var title = "Query";

    var dialog;

    var dialogEntry = _.template('<li><a href="/specify/stored_query/<%= id %>/"><img src="<%= icon %>"><%= name %></a></li>');

    var dialogView = Backbone.View.extend({
        className: "stored-queries-dialog list-dialog",
        events: {'click a': 'selected'},
        render: function() {
            var ul = $('<ul>');
            this.options.queries.each(function(query) {
                var icon = schema.getModelById(query.get('contexttableid')).getIcon();
                ul.append(dialogEntry({ icon: icon, id: query.id, name: query.get('name') }));
            });
            this.$el.append(ul);
            this.$el.dialog({
                title: title,
                maxHeight: 400,
                close: function() { dialog = null; $(this).remove(); },
                buttons: [
                    {text: 'New'},
                    {text: 'Cancel', click: function() { $(this).dialog('close'); }}
                ]
            });
            return this;
        },
        selected: function(evt) {
            evt.preventDefault();
            var index = this.$('a').index(evt.currentTarget);
            var queryId = this.options.queries.at(index).id;
            navigation.go('/stored_query/' + queryId + '/');
        }
    });

    return {
        title: title,
        icon: '/images/Query32x32.png',
        execute: function() {
            if (dialog) return;
            var queries = new (api.Collection.forModel('spquery'))();
            queries.fetch().done(function() {
                dialog = new dialogView({ queries: queries });
                $('body').append(dialog.el);
                dialog.render();
            });
        }
    };
});