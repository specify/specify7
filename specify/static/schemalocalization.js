define(['jquery', 'text!resources/schema_localization.xml'], function($, xmlText) {
    "use strict";
    var self = {}, xml = $.parseXML(xmlText);

    self.language = "en";

    // Search the schema_localization DOM for the given modelName.
    self.getLocalizationForModel = function(modelName) {
        return $('container[name="'+modelName.toLowerCase()+'"]', xml).first();
    };

    self.getLocalizationForField = function(fieldname, modelname) {
        var path = fieldname.split('.'), field = path.pop(),
        model = path.pop() || modelname.split('.').pop();
        return self.getLocalizationForModel(model).children('items').children('item[name="'+field+'"]');
    };

    self.getLocalizedLabelForField = function (fieldname, modelname) {
        return self.getLocalizedStr(self.getLocalizationForField(fieldname, modelname).children('names'));
    };

    // Given a DOM containing alternative localizations,
    // return the one for the language selected above,
    // or failing that, for "en", or failing that,
    // just return the first one.
    self.getLocalizedStr = function(alternatives) {
        var str = $(alternatives).children('str[language="' + self.language + '"]');
        if (str.length < 1) {
            str = $(alternatives).children('str[language="en"]');
        }
        if (str.length < 1) {
            str = $(alternatives).children('str').first();
        }
        return str.children('text').text().replace(/\\n/g, "\n");
    };

    return self;
});