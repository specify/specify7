define([
    'jquery', 'underscore', 'backbone', 'schema', 'navigation'
], function($, _, Backbone, schema, navigation) {
    "use strict";
    var datamodelview = {};

    var NavView = Backbone.View.extend({
        events: {
            'click a': 'nav'
        },
        nav: function(evt) {
            evt.preventDefault();
            navigation.go($(evt.currentTarget).prop('href'));
        }
    });

    function attrsToDl(node) {
        var dl = $('<dl class="specify-datamodel-attrs">');
        _(node.attributes).each(function(attr) {
            $('<dt>').text(attr.nodeName).appendTo(dl);
            $('<dd>').text(attr.nodeValue).appendTo(dl);
        });
        return dl;
    }


    datamodelview.SchemaView = NavView.extend({
        render: function() {
            var self = this;
            self.$el.append('<h2>Specify Schema</h2>')
            var table = $('<table>').appendTo(self.el);
            _(schema.models).each(function(model) {
                table.append('<tr><td><a href="' + model.name.toLowerCase() + '/">' + model.name + '</a></td></tr>');
            });
            return this;
        }
    });

    datamodelview.DataModelView = NavView.extend({
        render: function() {
            var self = this, model = schema.getModel(self.options.model);
            self.$el.append('<h2>' + model.name + '</h2>');
            self.$el.append(attrsToDl(model.node.get(0)));
            var table = $('<table>').appendTo(self.el);
            _(model.getAllFields()).each(function(field) {
                var tr = $('<tr>');
                tr.append('<td>' + field.name + '</td>');
                tr.append('<td>' + field.type + '</td>');
                if (field.isRelationship) {
                    var related = field.getRelatedModel();
                    tr.append('<td><a href="../' + related.name.toLowerCase() + '/">' + related.name + '</a></td>');
                } else tr.append('<td>');
                $('<td>').append(attrsToDl(field.node.get(0))).appendTo(tr);
                table.append(tr);
            });
            return this;
        }
    });

    return datamodelview;
});