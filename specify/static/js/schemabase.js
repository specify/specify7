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
        orgHierarchy: ['collectionobject', 'collection', 'discipline', 'division', 'institution']
    };
});
