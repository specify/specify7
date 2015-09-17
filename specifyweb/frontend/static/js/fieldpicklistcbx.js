define([
    'jquery', 'underscore', 'specifyapi', 'schema', 'backbone', 'dataobjformatters',
    'saveblockers', 'builtinpicklists', 'tooltipmgr', 'q', 'basicpicklistcbx'
], function($, _, api, schema, Backbone, dataobjformatters, saveblockers, builtInPL, ToolTipMgr, Q, BasicPickListCBX) {
    "use strict";


    function getItemsFromField(info) {
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

    return BasicPickListCBX.extend({
        __name__: "FieldPickListView",
        getItems: function(info) {
            return getItemsFromField(info);
        }
    });
});
