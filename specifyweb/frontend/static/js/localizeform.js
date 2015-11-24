define([
    'jquery', 'underscore', 'props', 'schema',
    'text!properties/views_en.properties!noinline',
    'text!properties/global_views_en.properties!noinline'
], function($, _, props, schema, viewsprops, globalviewsprops) {
    "use strict";

    var getProp = _.bind(props.getProperty, props,
                         viewsprops + '\n' + globalviewsprops);


    function getControlFieldName(control) {
        return control.attr('name') ||
            control.closest('[data-specify-field-name]').data('specify-field-name');
    }

    return function(formNode) {
        var form = $(formNode);
        var model = schema.getModel(form.data('specify-model'));
        if (!model) return;

        $('.specify-form-header', form).prepend(
            $('<span>').text(model.getLocalizedName())
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
                label.text(getProp(override) || override);
                return;
            }
            var fieldname = getControlFieldName(control);
            if (!fieldname) return; // probably a label for a plugin
            var field = model.getField(fieldname);
            field && label.text(field.getLocalizedName());
            var title = field && field.getLocalizedDesc();
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
                var control = $(this);
                var fieldName = getControlFieldName(control);
                if (fieldName) {
                    var field = model.getField(fieldName);
                    if (field && field.isRequiredBySchemaLocalization())
                        control.addClass('specify-required-field');
                } else {
                    console.error("control without name", this);
                }
            });
        }

        $('.specify-subview-header', form).each(function() {
            var fieldname = $(this).parent().data('specify-field-name');
            var label = model.getField(fieldname).getLocalizedName();
            $('.specify-subview-title', this).text(label);
        });
    };
});
