define([
    'jquery', 'underscore',
    'text!/static/html/templates/partialdateui.html',
    'jquery-ui'
], function($, _, partialdateui_html) {
    "use strict";
    var template = _.template(partialdateui_html);
    var formats = [null, 'yy-mm-dd', 'yy-mm', 'yy'];

    var origParseDate = $.datepicker.parseDate;

    $.datepicker.parseDate = function(format, value, settings) {
        switch (format) {
        case "yy":
            value += "-01";
            format += "-mm";
        case "yy-mm":
            value += "-01";
            format += "-dd";
            break;
        }
        return origParseDate.call($.datepicker, format, value, settings);
    };

    return function(control, init, resource) {
        var disabled = control.prop('disabled');
        var ui = $(template());
        var input = ui.find('input');
        var select = ui.find('select');
        input.prop('id', control.prop('id'));

        control.replaceWith(ui);
        ui.find('select, input').prop('readonly', disabled);

        disabled || input.datepicker({dateFormat: $.datepicker.ISO_8601});
        disabled && select.hide();

        var label = ui.parents().last().find('label[for="' + input.prop('id') + '"]');
        label.text() || label.text(resource.specifyModel.getField(init.df).getLocalizedName());

        if (resource) {
            var setInput = function() {
                var value = resource.get(init.df);
                input.val(value && value.replace(/T.+$/, ''));
            };

            var setPrecision = function() {
                var precision = resource.get(init.tp);
                var format = formats[precision];
                format && input.datepicker('option', 'dateFormat', format);
                select.val(precision);
            };

            input.change(function() {
                resource.set(init.df, input.val());
            });

            select.change(function() {
                resource.set(init.tp, select.val());
            });

            resource.on('change:' + init.df.toLowerCase(), setInput);

            resource.on('change:' + init.tp.toLowerCase(), setPrecision);

            return resource.fetchIfNotPopulated().done(setInput).done(setPrecision);
        }
    };
});
