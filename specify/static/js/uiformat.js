define([
    'jquery', 'underscore'
], function($, _) {
    function parseDecInt(val) { return parseInt(val, 10); }

    var formatters = {
        'java.lang.Integer': parseDecInt,
        'java.lang.Short': parseDecInt,
        'java.math.BigDecimal': parseDecInt
    };

    return function(field, value) {
        if(_(['timestampModified', 'timestampCreated']).contains(field.name)) {
            return value && value.split('T').shift();
        }

        var formatter = formatters[field.type];
        return formatter ? formatter(value) : value;
    };
});