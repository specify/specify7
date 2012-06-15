define([
    'jquery',
    'text!resources/schema_localization.xml'
], function($,  xmlText) {
    "use strict";
    var self = {}, xml = $.parseXML(xmlText);

    self.language = "en";

    // Search the schema_localization DOM for the given modelName.
    var getLocalizationForModel = function(modelName) {
        return $('container[name="'+modelName.toLowerCase()+'"]', xml).first();
    };

    var getLocalizationForField = function(fieldname, modelname) {
        var path = fieldname.split('.'), field = path.pop().toLowerCase(),
        model = path.pop() || modelname.split('.').pop();
        return getLocalizationForModel(model).children('items').children('item').filter(function() {
            return $(this).attr('name').toLowerCase() === field;
        });
    };

    // Given a DOM containing alternative localizations,
    // return the one for the language selected above,
    // or failing that, for "en", or failing that,
    // just return the first one.
    var getLocalizedStr = function(alternatives) {
        var str = $(alternatives).children('str[language="' + self.language + '"]');
        if (str.length < 1) {
            str = $(alternatives).children('str[language="en"]');
        }
        if (str.length < 1) {
            str = $(alternatives).children('str').first();
        }
        return str.children('text').text().replace(/\\n/g, "\n");
    };

    self.getLocalizedLabelForModel = function(modelname) {
        return getLocalizedStr(getLocalizationForModel(modelname).children('names'));
    };

    self.getLocalizedLabelForField = function(fieldname, modelname) {
        return getLocalizedStr(getLocalizationForField(fieldname, modelname).children('names'));
    };

    self.getLocalizedDescForField = function(fieldname, modelname) {
        return getLocalizedStr(getLocalizationForField(fieldname, modelname).children('descs'));
    };

    self.getPickListForField = function(fieldname, modelname) {
        return getLocalizationForField(fieldname, modelname).attr('pickListName');
    };

    self.isRequiredField = function(fieldname, modelname) {
        return getLocalizationForField(fieldname, modelname).attr('isRequired') === 'true';
    };

    function getControlFieldName(control) {
        return control.attr('name') ||
            control.closest('[data-specify-field-name]').data('specify-field-name');
    }

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
            var fieldname = getControlFieldName(control);
            if (!fieldname) return; // probably a label for a plugin
            label.text(self.getLocalizedLabelForField(fieldname, modelname));
            var title = self.getLocalizedDescForField(fieldname, modelname);
            title && label.attr('title', title);
        };

        if ($('.specify-formtable', form).length) {
            $('th', form).each(fillinLabel);
        } else {
            $('.specify-form-label', form).each(fillinLabel);

            $('.specify-field:checkbox', form).each(function() {
                fillinLabel.apply($(this).parent());
            });

            $('.specify-field', form).each(function() {
                var control = $(this), fieldname = getControlFieldName(control);
                if (!fieldname) return;
                self.isRequiredField(fieldname, modelname) && control.addClass('specify-required-field');
            });
        }

        $('.specify-subview-header', form).each(function() {
            var fieldname = $(this).parent().data('specify-field-name');
            var label = self.getLocalizedLabelForField(fieldname, modelname);
            $('.specify-subview-title', this).text(label);
        });
    };

    return self;
});