
// Main entry point.
$(function () {
    "use strict";
    var rootContainer = $('#specify-rootform-container');
    var params = specify.pullParamsFromDl(rootContainer);
  
    function postForm(formNode) {
        var form = $(formNode),
        data = specify.harvestForm(form),
        uri = '/api/specify/' + params.relatedModel + '/';
        data[params.view] = '/api/specify/' + params.view + '/' + params.id + '/';
        data.version = 0;
        return $.ajax(uri, {
            type: 'POST',
            contentType: 'application/json',
            processData: false,
            data: JSON.stringify(data)
        });
    };

    $.when(specify.loadViews(), specify.loadTypeSearches()).then(
        function () {
            var form = specify.buildFormForModel(params.relatedModel);
            form.children('input[value="Delete"]').remove();
            rootContainer.empty().append(form);
            form.find('.specify-field').each(function () {
                var control = $(this);
                if (control.prop('nodeName') === 'SELECT') {
                    specify.populatePickList(control);
                } else if (control.is('.specify-querycbx')) {
                    specify.setupQueryCBX(control);
                }
            });
            $('input[type="submit"]').click(function () {
                var btn = $(this);
                btn.prop('disabled', true);
                postForm(form).then(function () {
                    window.location = '../../';
                });
            });
        });
});
