define([
    'jquery', 'underscore',
    'text!/static/resources/specify_datamodel.xml'
], function($, _, xml) {
    "use strict";

    var Model = function(node) {
        this.node = $(node);
        this.name = this.node.attr('classname').split('.').pop();
        this.view = this.node.find('display').attr('view');
    };
    _.extend(Model.prototype, {
        getField: function(name) {
            name = name.toLowerCase();
            return _(this.getAllFields()).find(function(field) { return field.name.toLowerCase() === name; });
        },
        getAllFields: function () {
            this.fields = this.fields || _.toArray(
                this.node.find('field, relationship').map(function() { return new Field(this); })
            );
            return this.fields;
        },
    });

    var Field = function(node) {
        this.node = $(node);
        this.name = this.node.attr('name') || this.node.attr('relationshipname');
        this.isRelationship = this.node.is('relationship');
        this.isRequired = this.node.attr('required') === 'true';
        this.type = this.node.attr('type');
        if (this.isRelationship) this.otherSideName = this.node.attr('othersidename');
    };
    _.extend(Field.prototype, {
        getRelatedModel: function() {
            if (!this.isRelationship) return undefined;
            return schema.getModel(this.node.attr('classname').split('.').pop());
        }
    });

    var schema = {
        models: {},
        getModel: function(name) {
            name = name.toLowerCase();
            return _(this.models).find(function(model) { return model.name.toLowerCase() === name; });
        }
    };

    $('table', $.parseXML(xml)).each(function() {
        var model = new Model(this);
        schema.models[model.name] = model;
    });

    return schema;
});