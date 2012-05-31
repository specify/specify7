define([
    'jquery', 'underscore', 'uiplugin',
    'text!/static/html/templates/partialdateui.html',
    'jquery-ui'
], function($, _, UIPlugin, partialdateui_html) {
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

    return UIPlugin.extend({
        render: function() {
            var self = this;
            var init = self.init;
            var disabled = self.$el.prop('disabled');
            var ui = $(template());
            var input = ui.find('input');
            var select = ui.find('select');
            input.prop('id', self.$el.prop('id'));

            self.$el.replaceWith(ui);
            self.setElement(ui);
            ui.find('select, input').prop('readonly', disabled);

            disabled || input.datepicker({dateFormat: $.datepicker.ISO_8601});
            disabled && select.hide();

            var label = ui.parents().last().find('label[for="' + input.prop('id') + '"]');
            label.text() || label.text(self.model.specifyModel.getField(init.df).getLocalizedName());

            var setInput = function() {
                var value = self.model.get(init.df);
                input.val(value && value.replace(/T.+$/, ''));
            };

            var setPrecision = function() {
                var precision = self.model.get(init.tp);
                var format = formats[precision];
                format && input.datepicker('option', 'dateFormat', format);
                select.val(precision);
            };

            input.change(function() {
                self.model.set(init.df, input.val());
            });

            select.change(function() {
                self.model.set(init.tp, select.val());
            });

            self.model.on('change:' + init.df.toLowerCase(), setInput);

            self.model.on('change:' + init.tp.toLowerCase(), setPrecision);

            self.model.fetchIfNotPopulated().done(setInput).done(setPrecision);
            return self;
        }
    });
});
