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
        var currentView;
        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'view/:model/:id/': 'view',
                'view/:model/:id/:related/': 'viewRelated',
                'view/:model/:id/:related/new/': 'addRelated',
                'viewashtml/*splat': 'viewashtml'
            },

            view: function(model, id) {
                currentView && currentView.remove();
                var ResourceForModel = specifyapi.Resource.forModel(model);
                var resource = new ResourceForModel({id: id});
                var mainForm = specifyform.buildViewForModel(model);
                currentView = (new MainForm({ el: rootContainer, form: mainForm, model: resource })).render();
            },

            viewRelated: function(model, id, relatedField) {
                currentView && currentView.remove();
                var ResourceForModel = specifyapi.Resource.forModel(model);
                var resource = new ResourceForModel({id: id});
                var mainForm = specifyform.relatedObjectsForm(model, relatedField);
                currentView = (new MainForm({ el: rootContainer, form: mainForm, model: resource })).render();
            },

            addRelated: function(model, id, relatedField) {
                currentView && currentView.remove();
                var parentResource = new (specifyapi.Resource.forModel(model))({id: id});
                var relatedModel = datamodel.getRelatedModelForField(model, relatedField);
                var newResource = new (specifyapi.Resource.forModel(relatedModel))();
                var osn = datamodel.getFieldOtherSideName(model, relatedField);
                newResource.set(osn, parentResource.url());
                var mainForm = specifyform.buildViewForModel(relatedModel);
                currentView = (new MainForm({ el: rootContainer, form: mainForm, model: newResource })).render();
            },

            viewashtml: function() {
                currentView && currentView.remove();
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
                currentView = null;
            }
        });

        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});
    });
});
