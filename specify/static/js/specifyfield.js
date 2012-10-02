define([
    'jquery', 'underscore', 'uiformatters', 'schemabase'
], function($, _, uiformatters, schema) {
    "use strict";

    schema.Field = function(model, node) {
        this.model = model;
        if (!node) return;
        this.node = $(node);
        this.name = this.node.attr('name') || this.node.attr('relationshipname');
        this.isRelationship = this.node.is('relationship');
        this.isRequired = this.node.attr('required') === 'true';
        this.type = this.node.attr('type');
        this.length = this.node.attr('length');
        if (this.isRelationship) {
            this.otherSideName = this.node.attr('othersidename');
            this.relatedModelName = this.node.attr('classname').split('.').pop();
        }
        this._localization = this.model._localization.items[this.name.toLowerCase()];
    };

    _.extend(schema.Field.prototype, {
        getRelatedModel: function() {
            if (!this.isRelationship) return undefined;
            return schema.getModel(this.relatedModelName);
        },
        getLocalizedName: function() {
            return schema.unescape(this._localization.name);
        },
        getLocalizedDesc: function() {
            return schema.unescape(this._localization.desc);
        },
        getFormat: function() {
            return this._localization.format;
        },
        getUIFormatter: function() {
            var format = this.getFormat();
            return format && uiformatters.getByName(format);
        },
        getPickList: function() {
            return this._localization.picklistname;
        },
        isRequiredBySchemaLocalization: function() {
            return this._localization.isrequired;
        },
        isDependent: function() {
            return this._localization && this._localization.isdependent;
        }
    });

    return schema;
});
