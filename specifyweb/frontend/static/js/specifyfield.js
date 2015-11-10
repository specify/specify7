define([
    'jquery', 'underscore', 'uiformatters', 'schemabase', 'assert'
], function($, _, uiformatters, schema, assert) {
    "use strict";

    schema.Field = function(model, fieldDef) {
        this.model = model;
        this.isRelationship = false;

        if (!fieldDef) return;
        this.name = fieldDef.name;
        this.dottedName = this.model.name + '.' + this.name;

        this.readOnly = (this.name == 'guid' &&
                         this.model.name != 'Taxon' &&
                         this.model.name != 'Geography') ||
                         this.name == 'timestampcreated'; // kludge

        this.isRequired = fieldDef.required;
        this.type = fieldDef.type;
        this.length = fieldDef.length;

        this._localization = this.model._localization &&
            this.model._localization.items[this.name.toLowerCase()];
    };

    _.extend(schema.Field.prototype, {
        getRelatedModel: function() {
            assert(this.isRelationship, this.model.name + '.' + this.name + " is not a relationship field");
            return schema.getModel(this.relatedModelName);
        },
        getReverse: function() {
            var relModel = this.getRelatedModel();
            return this.otherSideName && relModel && relModel.getField(this.otherSideName);
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
        getWebLinkName: function() {
            return this._localization && this._localization.weblinkname;
        },
        isRequiredBySchemaLocalization: function() {
            return this._localization && this._localization.isrequired;
        },
        isHidden: function() {
            return this._localization && this._localization.ishidden;
        },
        isDependent: function() {
            return this.dependent;
        },
        isTemporal: function() {
            return _(['java.util.Date', 'java.util.Calendar']).contains(this.type);
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
