define([
    'jquery', 'underscore', 'cs!props',
    'text!context/schema_localization.json',
    'text!properties/views_en.properties',
    'text!properties/global_views_en.properties'
], function($, _, props, jsonText, viewsprops, globalviewsprops) {
    "use strict";
    var json = $.parseJSON(jsonText);
    var getProp = _.bind(props.getProperty, props,
                         viewsprops + '\n' + globalviewsprops);

    function getLocalizationForModel(modelName) {
        return json[modelName.toLowerCase()];
    }

    function getLocalizationForField(fieldname, modelname) {
        var path = fieldname.split('.'), field = path.pop().toLowerCase(),
        model = path.pop() || modelname.split('.').pop();
        return getLocalizationForModel(model).items[field] || {};
    }

    function getControlFieldName(control) {
        return control.attr('name') ||
            control.closest('[data-specify-field-name]').data('specify-field-name');
    }

    var self = {
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

        localizeForm: function(formNode) {
            var form = $(formNode), modelname = form.data('specify-model');

            $('.specify-form-header', form).prepend(
                $('<span>').text(self.getLocalizedLabelForModel(modelname))
            );

            var fillinLabel = function() {
                var label = $('label', this);
                if (label.text()) {
                    // the label was hard coded in the form
                    label.text(getProp(label.text()));
                    return;
                }
                var forId = label.prop('for');
                if (!forId) return; // not much we can do about that
                var control = $('#' + forId, form);
                var override = control.data('specify-field-label-override');
                if (override !== undefined) {
                    label.text(getProp(override));
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
        }
    };

    return self;
});