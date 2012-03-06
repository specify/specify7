(function (specify, $, undefined) {
    "use strict";
    specify.uiPlugins = {
        PartialDateUI: function(control, init, data) {
            specify.fillinData(data, init.df, function(data) {
                control[0].type = 'text'; // this probably breaks IE (f*** you IE)
                control.val(data);
                control.datepicker({dateFormat: $.datepicker.ISO_8601});
                var label = control.parents().last().find('label[for="' + control.prop('id') + '"]');
                var model = control.closest('[data-specify-model]').attr('data-specify-model');
                label.text(specify.getLocalizedLabelFor(init.df, model));
            });
        },
        WebLinkButton: function(control, init, data) {
            var form = control.closest('form');
            var watched = form.find(
                '#' + 'specify-field-' + form.prop('id').split('-').pop() + '-' + init.watch);
            switch(init.weblink) {
            case 'MailTo':
                control.click(function() {
                    var addr = watched.val();
                    addr && window.open('mailto:' + addr);
                });
                control.attr('value', 'EMail');
                break;
            }
        },
    };

} (window.specify = window.specify || {}, jQuery));
