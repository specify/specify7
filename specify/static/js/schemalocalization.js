define([
    'jquery', 'underscore',
    'text!context/schema_localization.json!noinline',
], function($, _, jsonText) {
    "use strict";
    var json = $.parseJSON(jsonText);

    function getLocalizationForModel(modelName) {
        return json[modelName.toLowerCase()];
    }

    function getLocalizationForField(fieldname, modelname) {
        var path = fieldname.split('.'), field = path.pop().toLowerCase(),
        model = path.pop() || modelname.split('.').pop();
        return getLocalizationForModel(model).items[field] || {};
    }

    return {
        getLocalizedLabelForModel: function(modelname) {
            return getLocalizationForModel(modelname).name;
        },

        getLocalizedLabelForField: function(fieldname, modelname) {
            return getLocalizationForField(fieldname, modelname).name;
        },

        getLocalizedDescForField: function(fieldname, modelname) {
            return getLocalizationForField(fieldname, modelname).desc;
        },

        getPickListForField: function(fieldname, modelname) {
            return getLocalizationForField(fieldname, modelname).picklistname;
        },

        getFormatForField: function(fieldname, modelname) {
            return getLocalizationForField(fieldname, modelname).format;
        },

        isRequiredField: function(fieldname, modelname) {
            return getLocalizationForField(fieldname, modelname).isrequired;
        },

    };
});
