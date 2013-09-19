define([
    'jquery', 'underscore', 'uiformatters', 'schemabase', 'assert'
], function($, _, uiformatters, schema, assert) {
    "use strict";

    schema.Field = function(model, fieldDef) {
        this.model = model;
        this.isRelationship = false;

        if (!fieldDef) return;
        this.name = fieldDef.name;

        this.isRequired = fieldDef.required;
        this.type = fieldDef.type;
        this.length = fieldDef.length;

        this._localization = this.model._localization &&
            this.model._localization.items[this.name.toLowerCase()];
    };

    _.extend(schema.Field.prototype, {
        getRelatedModel: function() {
            assert(this.isRelationship, "field is not a relationship field");
            return schema.getModel(this.relatedModelName);
        },
        getReverse: function() {
            return this.otherSideName && this.getRelatedModel().getField(this.otherSideName);
        },
        getLocalizedName: function() {
            return this._localization && schema.unescape(this._localization.name);
        },
        getLocalizedDesc: function() {
            return this._localization && schema.unescape(this._localization.desc);
        },
        getFormat: function() {
            return this._localization && this._localization.format;
        },
        getUIFormatter: function() {
            var format = this.getFormat();
            return format && uiformatters.getByName(format);
        },
        getPickList: function() {
            return this._localization && this._localization.picklistname;
        },
        isRequiredBySchemaLocalization: function() {
            return this._localization && this._localization.isrequired;
        },
        isHidden: function() {
            return this._localization && this._localization.ishidden;
        },
        isDependent: function() {
            return this.dependent;
        }
    });

    schema.Relationship = function(model, relDef) {
        schema.Field.apply(this, arguments);
        this.isRelationship = true;

        this.otherSideName = relDef.otherSideName;
        this.relatedModelName = relDef.relatedModelName;
        this.dependent = relDef.dependent;
    };

    _.extend(schema.Relationship.prototype, schema.Field.prototype);

    return schema;
});
