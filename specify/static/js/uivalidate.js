define([
    'jquery', 'underscore', 'uiparse'
], function($, _, uiparse) {
    "use strict";

    return function(resource, fieldName, value) {
        var field = resource.specifyModel.getField(fieldName);
        return uiparse(field, value);
    };
});