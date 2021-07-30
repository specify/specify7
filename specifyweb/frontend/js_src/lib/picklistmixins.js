"use strict";

import Q from 'q';

import schema from './schema';
import api from './specifyapi';
import dataobjformatters from './dataobjformatters';

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
        var plItemCollection = new plModel.LazyCollection({domainfilter: true});
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
        var objformat = dataobjformatters.format;

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
function makeMixin(source, name) {
    return {getItems: source, __name__: name};
}

export default {
    userDefined   : makeMixin(userDefined, 'UserDefinedPL'),
    fromTable     : makeMixin(fromTable, 'FromTablePL'),
    fromField     : makeMixin(fromField, 'FromFieldPL')
};

