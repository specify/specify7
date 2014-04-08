define(['jquery', 'underscore', 'agenttypepicklist'], function($, _, agenttypes) {
    "use strict";

    var byType = {
        'java.lang.Boolean': function(value) {
            return _isNull(value) ? '' : (
                value ? 'True' : 'False');
        }
    };

    return function(field, value) {
        var asInt = parseInt(value, 10);
        if (field.getFormat() === 'CatalogNumberNumeric') {
            return _.isNaN(asInt) ? value : asInt;
        }

        if (field.name === 'timestampModified' || field.name === 'timestampCreated') {
            return value && value.split('T')[0] || value;
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
