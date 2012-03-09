require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min"
    }
});

require(['jquery', 'populateform', 'datamodel', 'putform'], function($, populateform, datamodel, putform) {
    "use strict";
    $(function () {
        var rootContainer = $('#specify-rootform-container');
        var params = populateform.pullParamsFromDl(rootContainer);
        var uri = "/api/specify/" + params.model + "/" + params.id + "/";

        var viewName = datamodel.getViewForModel(params.model);
        var mainForm = populateform.populateForm(viewName, uri, true);
        rootContainer.empty().append(mainForm);
        $('input[type="submit"]').click(function () {
            var btn = $(this);
            btn.prop('disabled', true);
            $.when.apply($, putform.putForm(mainForm, true)).then(function () {
                btn.prop('disabled', false);
                window.location.reload(true);
            });
        });
    });
});
