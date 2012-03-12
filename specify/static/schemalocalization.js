define(['jquery', 'datamodel', 'text!resources/schema_localization.xml'], function($, datamodel, xmlText) {
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

    self.localizeForm = function(formNode) {
        var form = $(formNode);
        form.find('.specify-form-label').each(function() {
            var label = $('label', this);
            if (label.text()) return; // the label was hard coded in the form
            var fieldname = $('#' + label.prop('for'), this).attr('name');
            label.text(self.getLocalizedLabelForField(fieldname, viewModel));
        });

        form.find('.specify-field').each(function() {
            var control = $(this), fieldname = control.attr('name');
            if (control.is(':checkbox')) {
                var label = $('label', control.parent());
                if (label.text()) return; // label was hard coded
                label.text(self.getLocalizedLabelForField(fieldname, viewModel));
            }
        });

        form.find('.specify-formtable').each(function() {
            var formtable = $(this), fieldName = formtable.data('specify-field-name'),
            fieldInfo = datamodel.getDataModelField(viewModel, fieldName),
            subviewModel = fieldInfo.attr('classname').split('.').pop();
            formtable.find('th').each(function() {
                if (th.text()) return; // the label was hard coded in the form
                var forId = th.data('specify-header-for');
                if (!forId) return;
                var fieldname = form.find('#' + forId).attr('name');
                th.text(self.getLocalizedLabelForField(fieldname, subviewModel));
            });
        });
    };

    return self;
});