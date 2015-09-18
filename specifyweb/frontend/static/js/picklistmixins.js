define([
    'underscore', 'schema', 'q', 'require', 'specifyapi'
], function(_, schema, Q, require, api) {
    "use strict";

    // User defined picklist.
    //
    function userDefined(info) {
        return Q(info.pickList.rget('picklistitems'))
            .then(function(plItemCollection) {
                // picklistitems is a dependent field
                info.pickListItems = plItemCollection.toJSON();
                return info;
            });
    }

    // From table picklist;
    //
    function fromTable(info) {
        var plModel = schema.getModel(info.pickList.get('tablename'));
        var plItemCollection = new plModel.LazyCollection();
        return Q(plItemCollection.fetch({ limit: info.limit }))
            .then(function() { return formatItems(info, plItemCollection); });
    }


    function formatItems(info, plItemCollection) {
        var formatPromises = plItemCollection.map(formatItem.bind(null, info));
        return Q.all(formatPromises).then(function (items) {
            info.pickListItems = items;
            return info;
        });
    }

    function formatItem(info, item) {
        var objformat = require('dataobjformatters').format;

        return Q(objformat(item, info.pickList.get('formatter')))
            .then(function(title) { return {value: item.url(), title: title}; });
    }

    // From field picklist.
    //
    function fromField(info) {
        var plModel = schema.getModel(info.pickList.get('tablename'));
        var plFieldName = info.pickList.get('fieldname');
        return Q(api.getRows(plModel, {
            limit: info.limit,
            fields: [plFieldName],
            distinct: true
        })).then(formatRows.bind(null, info));
    }

    function formatRows(info, rows) {
        info.pickListItems = rows.map(function(row) {
            var value = row[0] || '';
            return {value: value, title: value};
        });
        return info;
    }

    // Return a combobox class mixin to get the items.
    function makeMixin(source) {
        return {getItems: source};
    }

    function fixedList(values, byIndex) {
        var items = values.map(function(value, index) {
            return { value: byIndex ? index : value, title: value };
        });
        return {
            getItems: function(info) { info.pickListItems = items; return Q(info); },
            titleFromValue: function(value) {
                var item = _(items).find(function(item) { return item.value === value; });
                return item ? item.title : null;
            }
        };
    }

    // Tables for picklists
    function pickListTables(info) {
        info.pickListItems = _.map(schema.models, function(model) {
            return { value: model.name, title: model.getLocalizedName() };
        });
        return Q(info);
    }

    function pickListFields(info) {
        var table = schema.getModel(info.resource.get('tablename'));
        info.pickListItems = _.map(table.getAllFields(), function(field) {
            return { value: field.name, title: field.getLocalizedName() };
        });
        return Q(info);
    }

    return {
        userDefined   : makeMixin(userDefined),
        fromTable     : makeMixin(fromTable),
        fromField     : makeMixin(fromField),
        agentTypes    : fixedList(['Organization', 'Person', 'Other', 'Group'], true),
        pickListTypes : fixedList(['User Defined Items', 'Entire Table', 'Field From Table'], true),
        pickListTables: makeMixin(pickListTables),
        pickListFields: makeMixin(pickListFields),
        userTypes     : fixedList(["Manager", "FullAccess", "LimitedAccess", "Guest"])
    };
});
