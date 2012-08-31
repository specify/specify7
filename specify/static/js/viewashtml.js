require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min"
    }
});

require(
    ['jquery', 'specifyform', 'populateform', 'localizeform', 'beautify-html'],
    function($, specifyform, populateform, localizeForm, beautify) {
        "use strict";
        $(function() {
            var params = populateform.pullParamsFromDl($('body'));
            var form = params.viewdef ?
                specifyform.buildViewByViewDefName(params.viewdef) :
                specifyform.buildViewByName(params.view);
            localizeForm(form);
            var html = $('<div>').append(form).html();
            $('body').empty().append(
                $('<pre>').text(beautify.style_html(html))
            );
        });
    }
);
