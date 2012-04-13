define([
    'jquery', 'underscore', 'backbone', 'schema'
], function($, _, Backbone, schema) {
    "use strict";
    var datamodelview = {};

    var NavView = Backbone.View.extend({
        events: {
            'click a': 'nav'
        },
        nav: function(evt) {
            evt.preventDefault();
            var url = $(evt.currentTarget).prop('href').replace(/^.*\/specify/, '');
            Backbone.history.navigate(url, true);
        }
    });

    datamodelview.SchemaView = NavView.extend({
        tagName: 'table',
        render: function() {
            var self = this;
            self.$el.append('<h2>Specify Schema</h2>')
            _(schema.models).each(function(model) {
                self.$el.append('<tr><td><a href="' + model.name.toLowerCase() + '/">' + model.name + '</a></td></tr>');
            });
            return this;
        }
    });

    datamodelview.DataModelView = NavView.extend({
        tagName: 'table',
        render: function() {
            var self = this, model = schema.getModel(self.options.model);
            self.$el.append('<h2>' + model.name + '</h2>')
            _(model.getAllFields()).each(function(field) {
                var tr = $('<tr>');
                tr.append('<td>' + field.name + '</td>');
                tr.append('<td>' + field.type + '</td>');
                if (field.isRelationship) {
                    var related = field.getRelatedModel();
                    tr.append('<td><a href="../' + related.name.toLowerCase() + '/">' + related.name + '</a></td>');
                }
                self.$el.append(tr);
            });
            return this;
        }
    })

    return datamodelview;
});