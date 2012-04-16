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
    'jquery', 'backbone', 'specifyapi', 'schema', 'specifyform', 'datamodelview',
    'mainform', 'schemalocalization', 'beautify-html', 'jquery-bbq'
], function($, Backbone, specifyapi, schema, specifyform, datamodelview, MainForm, schemalocalization, beautify) {
    "use strict";
    $(function () {
        var rootContainer = $('#specify-rootform-container');
        var currentView;
        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'view/:model/:id/:related/new/*splat': 'addRelated',
                'view/:model/:id/:related/*splat': 'viewRelated',
                'view/:model/:id/*splat': 'view',
                'viewashtml/*splat': 'viewashtml',
                'datamodel/:model/': 'datamodel',
                'datamodel/': 'datamodel'
            },

            view: function(modelName, id) {
                currentView && currentView.remove();
                var model = schema.getModel(modelName);
                var resource = new (specifyapi.Resource.forModel(model))({id: id});
                var mainForm = specifyform.buildViewByName(model.view);
                currentView = (new MainForm({ el: rootContainer, form: mainForm, model: resource })).render();
            },

            viewRelated: function(modelName, id, relatedField) {
                var model = schema.getModel(modelName);
                var field = model.getField(relatedField);
                var resource = new (specifyapi.Resource.forModel(model))({id: id});
                var viewdef = $.deparam.querystring().viewdef;
                var mainForm = viewdef && specifyform.buildViewByViewDefName(viewdef);
                switch (field.type) {
                case 'one-to-many':
                    currentView && currentView.remove();
                    mainForm = mainForm || specifyform.relatedObjectsForm(model.name, relatedField);
                    currentView = (new MainForm({ el: rootContainer, form: mainForm, model: resource })).render();
                    break;
                case 'many-to-one':
                case 'zero-to-one':
                    var relatedModel = field.getRelatedModel();
                    resource.rget(relatedField).done(function(relatedResource) {
                        currentView && currentView.remove();
                        mainForm = mainForm || specifyform.buildViewByName(relatedResource.specifyModel.view);
                        currentView = (new MainForm({ el: rootContainer, form: mainForm, model: relatedResource }))
                            .render();
                    });
                    break;
                }
            },

            addRelated: function(model, id, relatedField) {
                currentView && currentView.remove();
                model = schema.getModel(model);
                relatedField = model.getField(relatedField);
                var parentResource = new (specifyapi.Resource.forModel(model))({id: id});
                var relatedModel = relatedField.getRelatedModel();
                var newResource = new (specifyapi.Resource.forModel(relatedModel))();
                if (relatedField.type === 'one-to-many') {
                    newResource.set(relatedField.otherSideName, parentResource.url());
                }
                var mainForm = specifyform.buildViewByName(relatedModel.view);
                currentView = (new MainForm({ el: rootContainer, form: mainForm, model: newResource })).render();
                currentView.on('savecomplete', function() {
                    function goBack() {
                        Backbone.history.navigate(parentResource.viewUrl().replace(/^\/specify/, ''), true);
                    }
                    if (relatedField.type === 'many-to-one') {
                        parentResource.fetchIfNotPopulated().done(function() {
                            parentResource.set(relatedField.name, newResource.url());
                            parentResource.save().done(goBack);
                        });
                    } else goBack();
                });
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
            },

            datamodel: function(model) {
                currentView && currentView.remove();
                var View = model ? datamodelview.DataModelView : datamodelview.SchemaView;
                currentView = new View({ model: model }).render();
                rootContainer.append(currentView.el);
            }
        });

        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});
    });
});
