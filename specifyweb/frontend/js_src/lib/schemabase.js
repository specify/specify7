"use strict";

var _ = require('underscore');
var Q = require('q');
var initialContext = require('./initialcontext.js');

    var schemaBase = {
        domainLevelIds: undefined,
        embeddedCollectingEvent: undefined,
        embeddedPaleoContext: undefined,

        getModel: function(name) {
            name = name.toLowerCase();
            return _(this.models).find(function(model) { return model.name.toLowerCase() === name; });
        },
        getModelById: function(tableId) {
            return _(this.models).find(function(model) { return model.tableId === tableId; });
        },
        unescape: function(str) {
            return str && str.replace(/([^\\])\\n/g, '$1\n');
        },
        orgHierarchy: ['collectionobject', 'collection', 'discipline', 'division', 'institution']
    };

    initialContext.load('domain.json', function(data) {
        schemaBase.domainLevelIds =  _.object(['collection', 'discipline', 'division', 'institution'].map(
            level => [level, data[level]]
        ));
        schemaBase.embeddedCollectingEvent = data.embeddedCollectingEvent;
        schemaBase.embeddedPaleoContext = data.embeddedPaleoContext;
        schemaBase.paleoContextChildTable = data.paleoContextChildTable;
    });

    module.exports = schemaBase;

