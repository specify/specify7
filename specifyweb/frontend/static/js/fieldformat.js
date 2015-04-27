define([
    'jquery', 'underscore', 'builtinpicklists', 'moment', 'dateformat'
], function($, _, builtInPL, moment, dateFormatStr) {
    "use strict";

    function formatDate(value) {
        var m = moment(value);
        return m.isValid() ? m.format(dateFormatStr) : (value || '');
    }

    function formatInt(value) {
        return value == null ? '' : value;
    }

    var byType = {
        'java.lang.Boolean': function(value) {
            return _.isNull(value) ? '' : (
                value ? 'True' : 'False');
        },
        "java.lang.Integer": formatInt,
        "java.sql.Timestamp": formatDate,
        "java.util.Calendar": formatDate,
        "java.util.Date": formatDate
    };

    return function(field, value) {
        var asInt = parseInt(value, 10);
        if (field.getFormat() === 'CatalogNumberNumeric') {
            return _.isNaN(asInt) ? value : asInt;
        }

        if (field.name === 'agentType' && field.model.name === 'Agent') {
            var agentType = _.find(builtInPL.agentType, function(type) { return type.value === asInt; });
            return agentType ? agentType.title : value || '';
        }

        var bt = byType[field.type];
        if (bt) {
            return bt(value);
        }

        return value || '';
    };
});
