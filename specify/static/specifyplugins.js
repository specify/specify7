(function (specify, $, undefined) {
    "use strict";
    specify.uiPlugins = {
        PartialDateUI: function(control, init, data) {
            specify.fillinData(data, init.df, function(data) {
                control.val(data);
                control.datepicker({dateFormat: $.datepicker.ISO_8601});
                var label = control.parents().last().find('label[for="' + control.prop('id') + '"]');
                var model = control.closest('[data-specify-model]').attr('data-specify-model');
                label.text(specify.getLocalizedLabelFor(init.df, model));
            });
        },
    };

} (window.specify = window.specify || {}, jQuery));
