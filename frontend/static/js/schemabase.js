define(['underscore'], function(_) {
    "use strict";

    return {
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
});
