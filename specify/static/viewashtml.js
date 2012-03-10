require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min"
    }
});

require(['jquery', 'specifyform', 'populateform', 'beautify-html'], function($, specifyform, populateform, beautify) {
    "use strict";
    $(function() {
        var params = populateform.pullParamsFromDl($('body'));
        if (params.viewdef) {
            $('body').empty().append(
                $('<pre>').text(specifyform.buildViewByViewDefName(params.viewdef).html())
            );
        } else if (params.view) {
            $('body').empty().append(
                $('<pre>').text(
                    beautify.style_html(specifyform.buildViewByName(params.view).html())
                )
            );
        }
    });
});