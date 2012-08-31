define([
    'jquery', 'underscore',
    'text!context/schema_localization.json!noinline',
], function($, _, jsonText) {
    "use strict";
    var json = $.parseJSON(jsonText);

    return {
        getLocalizationForModel: function(modelName) {
            return json[modelName.toLowerCase()];
        },

        getLocalizationForField: function(modelLocalization, fieldName) {
            return modelLocalization.items[fieldName.toLowerCase()] || {};
        }
    };
});
