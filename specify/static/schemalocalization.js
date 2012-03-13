define(['jquery', 'text!resources/schema_localization.xml'], function($,  xmlText) {
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

    self.getLocalizedLabelForModel = function(modelname) {
        return self.getLocalizedStr(
            self.getLocalizationForModel(modelname).children('names')
        );
    };

    self.getLocalizedLabelForField = function(fieldname, modelname) {
        return self.getLocalizedStr(
            self.getLocalizationForField(fieldname, modelname).children('names')
        );
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

    self.localizeForm = function(formNode) {
        var form = $(formNode), modelname = form.data('specify-model');

        $('.specify-form-header', form).prepend(
            $('<span>').text(self.getLocalizedLabelForModel(modelname))
        );

        var fillinLabel = function() {
            var label = $('label', this);
            if (label.text()) return; // the label was hard coded in the form
            var forId = label.prop('for');
            if (!forId) return; // not much we can do about that
            var control = $('#' + forId, form);
            var override = control.data('specify-field-label-override');
            if (override !== undefined) {
                label.text(override);
                return;
            }
            var fieldname = control.attr('name');
            if (!fieldname) return; // probably a label for a plugin
            label.text(self.getLocalizedLabelForField(fieldname, modelname));
        };

        if ($('.specify-formtable', form).length) {
            $('th', form).each(fillinLabel);
        } else {
            $('.specify-form-label', form).each(fillinLabel);

            $('.specify-field:checkbox', form).each(function() {
                fillinLabel.apply($(this).parent());
            });
        }
    };

    return self;
});