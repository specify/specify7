"use strict";

import _ from 'underscore';

import * as uiformatters from './uiformatters';
import schema from './schemabase';
import assert from './assert';


// Define a JS object constructor to represent fields of Specify data objects.
schema.Field = function(model, fieldDef) {
    this.model = model;  // The data object model this field belongs to.
    this.isRelationship = false; // Whether the field represents a relationship.

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
    this.dbColumn = fieldDef.column;
};

// Methods on the field object.
_.extend(schema.Field.prototype, {

    // Convenience function to access the schema localization for this field.
    _getLocalization() {
        const ml = this.model._getLocalization();
        return ml && ml.getIn(['items', this.name.toLowerCase()]);
    },

    // Returns the related model for relationship fields.
    getRelatedModel() {
        assert(this.isRelationship, this.model.name + '.' + this.name + " is not a relationship field");
        return schema.getModel(this.relatedModelName);
    },

    // Returns the field of the related model that is the reverse of this field.
    getReverse() {
        const relModel = this.getRelatedModel();
        return this.otherSideName && relModel && relModel.getField(this.otherSideName);
    },

    // Returns the user friendly name of the field from the schema config.
    getLocalizedName() {
        const l = this._getLocalization();
        return l && schema.unescape(l.get('name'));
    },

    // Returns the description of the field from the schema config.
    getLocalizedDesc() {
        const l = this._getLocalization();
        return l && schema.unescape(l.get('desc'));
    },

    // Returns the name of the UIFormatter for the field from the schema config.
    getFormat() {
        const l = this._getLocalization();
        return l && l.get('format');
    },

    // Returns the UIFormatter for the field specified in the schema config.
    getUIFormatter() {
        const format = this.getFormat();
        return format && uiformatters.getByName(format);
    },

    // Returns the name of the picklist definition if any is assigned to the field
    // by the schema configuration.
    getPickList() {
        const l = this._getLocalization();
        return l && l.get('picklistname');
    },

    // Returns the weblink definition name if any is assigned to the field.
    getWebLinkName() {
        const l = this._getLocalization();
        return l && l.get('weblinkname');
    },

    // Returns true if the field is required by the schema configuration.
    // NB the field maybe required for other reasons.
    isRequiredBySchemaLocalization() {
        const l = this._getLocalization();
        return l && l.get('isrequired');
    },

    // Returns true if the field is marked hidden in the schema configuration.
    isHidden() {
        const l = this._getLocalization();
        return l && l.get('ishidden');
    },

    // Returns true if the field represents a dependent relationship. ie one where
    // the data in the related object(s) is automatically included by the API.
    // eg CollectionObject.determinations.
    isDependent() {
        return (this.model.name == 'CollectionObject' && this.name == 'collectingEvent') ? schema.embeddedCollectingEvent
            : (this.model.name.toLowerCase() == schema.paleoContextChildTable && this.name == 'paleoContext') ? schema.embeddedPaleoContext
            : this.dependent;
    },

    // Returns true if the field represents a time value.
    isTemporal: function() {
        return _(['java.util.Date', 'java.util.Calendar']).contains(this.type);
    }
});

// Define a JS object constructor to represent relationship fields of Specify data objects.
// Extends the Field object.
schema.Relationship = function(_model, relDef) {
    schema.Field.apply(this, arguments);
    this.isRelationship = true;

    this.otherSideName = relDef.otherSideName;
    this.relatedModelName = relDef.relatedModelName;
    this.dependent = relDef.dependent;
};

_.extend(schema.Relationship.prototype, schema.Field.prototype);

export default schema;

