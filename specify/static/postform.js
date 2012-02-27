(function (specify, $, undefined) {
    "use strict";



} (window.specify = window.specify || {}, jQuery));


// Main entry point.
$(function () {
    "use strict";

    $.when(specify.loadViews(), specify.loadTypeSearches()).then(
        function () {
            var mainForm = specify.buildFormForModel(relatedModel);
            $('div').append(mainForm);
            mainForm.find('.specify-field').each(function () {
                var control = $(this);
                if (control.prop('nodeName') === 'SELECT') {
                    specify.populatePickList(control);
                } else if (control.is('.specify-querycbx')) {
                    specify.setupQueryCBX(control);
                }
            });
            // $('input[type="submit"]').click(function () {
            //     var btn = $(this);
            //     btn.prop('disabled', true);
            //     $.when.apply($, specify.putForm(mainForm, true)).then(function () {
            //         btn.prop('disabled', false);
            //         window.location.reload(true);
            //     });
            // });
        });
});
