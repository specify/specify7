
// Main entry point.
$(function () {
    "use strict";

    specify.initialize().then(function () {
        var rootContainer = $('#specify-rootform-container');
        var params = specify.pullParamsFromDl(rootContainer);
        var form = specify.processView(specify.getViewForModel(params.relatedModel));
        form.children('input[value="Delete"]').remove();
        specify.setupControls(form);
        rootContainer.empty().append(form);

        function postForm(formNode) {
            var form = $(formNode),
            data = specify.harvestForm(form),
            uri = '/api/specify/' + params.relatedModel + '/';
            data[params.view] = '/api/specify/' + params.model + '/' + params.id + '/';
            data.version = 0;
            return $.ajax(uri, {
                type: 'POST',
                contentType: 'application/json',
                processData: false,
                data: JSON.stringify(data)
            });
        };

        $('input[type="submit"]').click(function () {
            var btn = $(this);
            btn.prop('disabled', true);
            postForm(form).then(function () {
                window.location = '../../';
            });
        });
    });
});
