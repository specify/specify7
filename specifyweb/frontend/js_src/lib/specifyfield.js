"use strict";

var _                = require('underscore');

var uiformatters = require('./uiformatters.js');
var schema = require('./schemabase.js');
var assert = require('./assert.js');

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
    };

    _.extend(schema.Field.prototype, {
        _getLocalization: function() {
            var ml = this.model._getLocalization();
            return ml && ml.getIn(['items', this.name.toLowerCase()]);
        },
        getRelatedModel: function() {
            assert(this.isRelationship, this.model.name + '.' + this.name + " is not a relationship field");
            return schema.getModel(this.relatedModelName);
        },
        getReverse: function() {
            var relModel = this.getRelatedModel();
            return this.otherSideName && relModel && relModel.getField(this.otherSideName);
        },
        getLocalizedName: function() {
            var l = this._getLocalization();
            return l && schema.unescape(l.get('name'));
        },
        getLocalizedDesc: function() {
            var l = this._getLocalization();
            return l && schema.unescape(l.get('desc'));
        },
        getFormat: function() {
            var l = this._getLocalization();
            return l && l.get('format');
        },
        getUIFormatter: function() {
            var format = this.getFormat();
            return format && uiformatters.getByName(format);
        },
        getPickList: function() {
            var l = this._getLocalization();
            return l && l.get('picklistname');
        },
        getWebLinkName: function() {
            var l = this._getLocalization();
            return l && l.get('weblinkname');
        },
        isRequiredBySchemaLocalization: function() {
            var l = this._getLocalization();
            return l && l.get('isrequired');
        },
        isHidden: function() {
            var l = this._getLocalization();
            return l && l.get('ishidden');
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

module.exports = schema;

