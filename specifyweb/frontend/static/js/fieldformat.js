define(['jquery', 'underscore', 'agenttypepicklist'], function($, _, agenttypes) {
    "use strict";

    return function(field, value) {
        var asInt = parseInt(value, 10);
        if (field.getFormat() === 'CatalogNumberNumeric') {
            if (_.isNaN(asInt)) {
                return value;
            } else {
                return asInt;
            }
        } else if (field.name === 'timestampModified' || field.name === 'timestampCreated') {
            return value && value.split('T')[0] || value;
        } else if (field.name === 'agentType' && field.model.name === 'Agent') {
            var agentType = _.find(agenttypes, function(type) { return type.value === asInt; });
            return agentType ? agentType.title : value || '';
        } else if (field.type === 'java.lang.Boolean') {
            if (_.isNull(value)) return '';
            return value ? 'True' : 'False';
        } else {
            return value || '';
        }
    };
});
