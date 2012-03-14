require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min"
    }
});

require(['jquery', 'specifyform', 'populateform', 'putform'],
function($, specifyform, populateform, putform) {
    "use strict";
    $(function () {
        var rootContainer = $('#specify-rootform-container');
        var params = populateform.pullParamsFromDl(rootContainer);
        var uri = "/api/specify/" + params.model + "/" + params.id + "/";

        var mainForm = specifyform.buildViewForModel(params.model);
        populateform.populateForm(mainForm, uri);
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
