define([
    'jquery', 'underscore', 'backbone', 'datamodel'
], function($, _, Backbone, datamodel) {
    "use strict";
    var datamodelview = {};

    datamodelview.SchemaView = Backbone.View.extend({
        tagName: 'table',
        render: function() {
            var self = this;
            self.$el.append('<h2>Specify Schema</h2>')
            _(datamodel.getAllModels()).each(function(model) {
                self.$el.append('<tr><td><a href="' + model.toLowerCase() + '/">' + model + '</a></td></tr>');
            });
            return this;
        }
    });

    datamodelview.DataModelView = Backbone.View.extend({
        tagName: 'table',
        render: function() {
            var self = this, modelName = self.options.model;
            self.$el.append('<h2>' + datamodel.getCannonicalNameForModel(modelName) + '</h2>')
            _(datamodel.getAllFields(modelName)).each(function(field) {
                var tr = $('<tr>');
                tr.append('<td>' + field + '</td>');
                tr.append('<td>' + datamodel.getFieldType(modelName, field) + '</td>');
                if (datamodel.isRelatedField(modelName, field)) {
                    var related = datamodel.getRelatedModelForField(modelName, field);
                    tr.append('<td><a href="../' + related.toLowerCase() + '/">' + related + '</a></td>');
                }
                self.$el.append(tr);
            });
            return this;
        }
    })

    return datamodelview;
});