"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Immutable = require('immutable');

var icons          = require('./icons.js');
var schema         = require('./schemabase.js');
var ResourceBase   = require('./resourceapi.js');
var collectionapi  = require('./collectionapi.js');
var initialContext = require('./initialcontext.js');

    var localization;
    initialContext.load('schema_localization.json', data => localization = Immutable.fromJS(data));

    schema.Model = function(tableDef) {
        this.longName = tableDef.classname;
        this.name = this.longName.split('.').pop();
        this.idFieldName = tableDef.idFieldName;
        this.view = tableDef.view;
        this.searchDialog = tableDef.searchDialog;
        this.tableId = tableDef.tableId;
        this.system = tableDef.system;
        this._fieldAliases = tableDef.fieldAliases;

        this.Resource = ResourceBase.extend({ __name__: this.name + 'Resource' },
                                            { specifyModel: this });

        this.LazyCollection = collectionapi.Lazy.extend({ __name__: this.name + 'LazyCollection',
                                                          model: this.Resource });

        this.StaticCollection = collectionapi.Static.extend({ __name__: this.name + 'StaticCollection',
                                                             model: this.Resource });

        this.DependentCollection = collectionapi.Dependent.extend({ __name__: this.name + "DependentCollection",
                                                                    model: this.Resource });

        this.ToOneCollection = collectionapi.ToOne.extend({ __name__: this.name + 'ToOneCollection',
                                                            model: this.Resource });
        var model = this;
        this.fields = _.map(tableDef.fields, function(fieldDef) {
            return new schema.Field(model, fieldDef);
        }).concat(_.map(tableDef.relationships, function(relDef) {
            var rel = new schema.Relationship(model, relDef);
            if (model.name == 'CollectionObject' && rel.name == 'collectingEvent') {
                rel.dependent = schema.embeddedCollectingEvent;
            }
            if (rel.name == 'paleoContext' && model.name.toLowerCase() == schema.paleoContextChildTable) {
                rel.dependent = schema.embeddedPaleoContext;
            }
            return rel;
        }));
    };
    _.extend(schema.Model.prototype, {
        _getLocalization: function() {
            return localization.get(this.name.toLowerCase());
        },
        getField: function(name) {
            if (_(name).isString()) {
                name = name.toLowerCase().split('.');
            }
            var field = _(this.getAllFields()).find(function(field) { return field.name.toLowerCase() === name[0]; });
            if (_(field).isUndefined()) {
                var alias = _.find(this._fieldAliases, function(alias) {
                    return alias.vname.toLowerCase() === name[0];
                });
                field = alias && this.getField(alias.aname);
            }
            return name.length === 1 ? field : field.getRelatedModel().getField(_(name).tail());
        },
        getAllFields: function () {
            return this.fields;
        },
        getLocalizedName: function() {
            var l = this._getLocalization();
            return l ? schema.unescape(l.get('name')) : this.name;
        },
        getFormat: function() {
            var l = this._getLocalization();
            return l && l.get('format');
        },
        getAggregator: function() {
            var l = this._getLocalization();
            return l && l.get('aggregator');
        },
        getIcon: function() {
            return icons.getIcon(this.name.toLowerCase());
        },
        orgRelationship: function() {
            return _.chain(schema.orgHierarchy).map(this.getField, this).filter(function(field) {
                return field && field.type === 'many-to-one';
            }).first().value();
        },
        orgPath: function() {
            if (this.name.toLowerCase() === _.last(schema.orgHierarchy)) return [];
            var up = this.orgRelationship();
            if (up) {
                var path = up.getRelatedModel().orgPath();
                path.push(up.name);
                return path;
            }
            return undefined;
        }
    });

module.exports = schema;

