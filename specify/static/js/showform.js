require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui",
        'jquery-bbq': "vendor/jquery.ba-bbq",
        'underscore': "vendor/underscore",
        'backbone': "vendor/backbone",
        'beautify-html': "vendor/beautify-html",
        'text': "vendor/text",
    }
});

require([
    'jquery', 'backbone', 'specifyapi', 'datamodel', 'specifyform',
    'mainform', 'schemalocalization', 'beautify-html', 'jquery-bbq'
], function($, Backbone, specifyapi, datamodel, specifyform, MainForm, schemalocalization, beautify) {
    "use strict";
    $(function () {
        var rootContainer = $('#specify-rootform-container');
        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'view/:model/:id/': 'view',
                'view/:model/:id/:related/': 'viewRelated',
                'viewashtml/*splat': 'viewashtml'
            },

            view: function(model, id) {
                var ResourceForModel = specifyapi.Resource.forModel(model);
                var resource = new ResourceForModel({id: id});
                var mainForm = specifyform.buildViewForModel(model);
                (new MainForm({ el: rootContainer, form: mainForm, model: resource })).render();
            },

            viewRelated: function(model, id, relatedField) {
                var ResourceForModel = specifyapi.Resource.forModel(model);
                var resource = new ResourceForModel({id: id});
                var mainForm = specifyform.relatedObjectsForm(model, relatedField);
                (new MainForm({ el: rootContainer, form: mainForm, model: resource })).render();
            },

            viewashtml: function() {
                var params = $.deparam.querystring();
                var form = params.viewdef ?
                    specifyform.buildViewByViewDefName(params.viewdef) :
                    specifyform.buildViewByName(params.view);
                if (params.localize && params.localize.toLowerCase() !== 'false')
                    schemalocalization.localizeForm(form);
                var html = $('<div>').append(form).html();
                rootContainer.empty().append(
                    $('<pre>').text(beautify.style_html(html))
                );
            }
        });

        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});
    });
});
