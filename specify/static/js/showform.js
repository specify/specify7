require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui.min",
        'underscore': "vendor/underscore",
        'backbone': "vendor/backbone",
        'text': "vendor/text",
    }
});

require([
    'jquery', 'backbone', 'specifyform', 'populateform', 'putform'
], function($, Backbone, specifyform, populateform, putform) {
    "use strict";
    $(function () {
        var rootContainer = $('#specify-rootform-container');
        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'view/:model/:id/': 'view',
            },

            view: function(model, id) {
                var uri = "/api/specify/" + model + "/" + id + "/";
                var mainForm = specifyform.buildViewForModel(model);
                populateform.populateForm(mainForm, uri);
                rootContainer.empty().append(mainForm);
                $('input[type="submit"]').click(function () {
                    var btn = $(this);
                    btn.prop('disabled', true);
                    $.when.apply($, putform.putForm(mainForm.find('.specify-view-content'), true))
                        .done(function () {
                            btn.prop('disabled', false);
                            window.location.reload(true);
                        });
                });
            }

        });

        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});

    });
});
