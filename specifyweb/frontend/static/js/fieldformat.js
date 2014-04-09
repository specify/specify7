define([
    'jquery', 'underscore', 'agenttypepicklist', 'moment', 'dateformat'
], function($, _, agenttypes, moment, dateFormatStr) {
    "use strict";

    function formatDate(value) {
        var m = moment(value);
        return m.isValid() ? m.format(dateFormatStr) : (value || '');
    }

    var byType = {
        'java.lang.Boolean': function(value) {
            return _isNull(value) ? '' : (
                value ? 'True' : 'False');
        },
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
            var agentType = _.find(agenttypes, function(type) { return type.value === asInt; });
            return agentType ? agentType.title : value || '';
        }

        var bt = byType[field.type];
        if (bt) {
            return bt(value);
        }

        return value || '';
    };
});
