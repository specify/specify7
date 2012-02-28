(function (specify, $, undefined) {
    "use strict";

    specify.postForm = function (formNode) {
        var form = $(formNode),
        data = specify.harvestForm(form),
        uri = '/api/specify/' + relatedModel + '/';
        data[view] = '/api/specify/' + view + '/' + id + '/';
        data.version = 0;
        return $.ajax(uri, {
            type: 'POST',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data)
        });
    };

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
            $('input[type="submit"]').click(function () {
                var btn = $(this);
//                btn.prop('disabled', true);
                specify.postForm(mainForm).then(function () {
//                    btn.prop('disabled', false);
//                    window.location.reload(true);
                });
            });
        });
});
