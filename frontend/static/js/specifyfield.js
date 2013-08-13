define([
    'jquery', 'underscore', 'uiformatters', 'schemabase', 'assert'
], function($, _, uiformatters, schema, assert) {
    "use strict";

    schema.Field = function(model, node) {
        this.model = model;
        if (!node) return;
        this.node = $(node);
        this.name = this.node.attr('name') || this.node.attr('relationshipname');
        this.longName = this.model.name + '.' + this.name;
        this.isRelationship = this.node.is('relationship');
        this.isRequired = this.node.attr('required') === 'true';
        this.type = this.node.attr('type');
        this.length = this.node.attr('length');
        if (this.isRelationship) {
            this.otherSideName = this.node.attr('othersidename');
            this.relatedModelName = this.node.attr('classname').split('.').pop();
        }
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
            return this._localization && this._localization.isdependent;
        }
    });

    return schema;
});
