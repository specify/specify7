define(['jquery', 'schemalocalization', 'specifyapi'], function($, schemalocalization, api) {
    "use strict";
    function inFormTable(control) {
        return control.parents().is('.specify-formtable-row');
    }

    return {
        PartialDateUI: function(control, init, data) {
            control[0].type = 'text'; // this probably breaks IE (f*** you IE)
            control.datepicker({dateFormat: $.datepicker.ISO_8601});
            if (!inFormTable(control)) {
                var label = control.parents().last().find('label[for="' + control.prop('id') + '"]');
                var model = control.closest('[data-specify-model]').attr('data-specify-model');
                label.text(schemalocalization.getLocalizedLabelForField(init.df, model));
            }
            if (data) {
                api.getDataFromResource(data, init.df).done(_.bind(control.val, control));
            } else { control.val(''); }
        },
        WebLinkButton: function(control, init) {
            var form = inFormTable(control) ?
                control.closest('.specify-formtable-row') :
                control.closest('form');
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
});