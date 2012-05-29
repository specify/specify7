define([
    'jquery', 'underscore'
], function($, _) {
    "use strict";
    function neg(tval) { return !tval; }
    function parseDecInt(val) { return parseInt(val, 10); }

    var validInt = _.compose(neg, _.isNaN, parseDecInt);

    var validators = {
        'java.lang.Integer': validInt,
        'java.lang.Short': validInt,
        'java.math.BigDecimal': validInt
    };

    return function(resource, fieldName, value) {
        var field = resource.specifyModel.getField(fieldName);
        var validator = validators[field.type];
        return !validator || validator(value);
    };
});