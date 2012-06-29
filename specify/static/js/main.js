require({
    priority: ['jquery'],
    paths: {
        'jquery': "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery",
        'jquery-ui': "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.16/jquery-ui",
        'jquery-bbq': "vendor/jquery.ba-bbq",
        'underscore': "vendor/underscore",
        'backbone': "vendor/backbone",
        'resources': '/static/resources',
        'tmpls': '/static/html/templates',
        'beautify-html': "vendor/beautify-html",
        'text': "vendor/text",
    }
});

require([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform', 'datamodelview',
    'views', 'schemalocalization', 'beautify-html', 'navigation', 'jquery-bbq'
], function(
    $, _, Backbone, specifyapi, schema, specifyform, datamodelview,
    views, schemalocalization, beautify, navigation) {
    "use strict";

    $(function () {
        var rootContainer = $('#content');
        var currentView;
        function setCurrentView(view) {
            currentView && currentView.remove();
            $('.ui-autocomplete').remove(); // these are getting left behind sometimes
            currentView = view;
            currentView.render();
            rootContainer.append(currentView.el);
        }

        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'recordset/:id/*splat': 'recordSet',
                'view/:model/:id/:related/new/*splat': 'addRelated',
                'view/:model/:id/:related/:index/*splat': 'viewSingleToMany',
                'view/:model/:id/:related/*splat': 'viewRelated',
                'view/:model/:id/*splat': 'view',
                'viewashtml/*splat': 'viewashtml',
                'datamodel/:model/': 'datamodel',
                'datamodel/': 'datamodel'
            },

            addRelated: function(modelName, id, relatedFieldName) {
                var resource = window.specifyParentResource ||
                    new (specifyapi.Resource.forModel(modelName))({ id: id });
                var relatedField = resource.specifyModel.getField(relatedFieldName);

                var relatedResource = new (specifyapi.Resource.forModel(relatedField.getRelatedModel()))();
                var view = new views.ToOneView({
                    model: relatedResource,
                    parentResource: resource,
                    parentModel: resource.specifyModel,
                    relatedField: relatedField,
                    adding: true
                });

                switch (relatedField.type) {
                case 'one-to-many':
                    relatedResource.set(relatedField.otherSideName, resource.url(), { silent: true });

                    view.on('done', function() {
                        resource.rget(relatedField.name).done(function(collection) {
                            collection.add(relatedResource);
                            resource.isNew() && window.close();
                        });
                        resource.isNew() || relatedResource.rsave().done(function() {
                            navigation.navigate(relatedResource.viewUrl(), { replace: true, trigger: true });
                        });
                    });
                    break;
                case 'many-to-one':
                    view.on('done', function() {
                        relatedResource.rsave().done(function() {
                            resource.set(relatedField.name, relatedResource.url());
                            navigation.navigate(relatedResource.viewUrl(), { replace: true, trigger: true });
                        });
                    });
                    break;
                }

                setCurrentView(view);
            },

            viewSingleToMany: function(modelName, id, relatedFieldName, index) {
                index = parseInt(index, 10);
                var resource = window.specifyParentResource ||
                    new (specifyapi.Resource.forModel(modelName))({ id: id });
                resource.rget(relatedFieldName).done(function(collection) {
                    collection.fetchIfNotPopulated().done(function() {
                        var relatedResource = collection.at(index);
                        setCurrentView(new views.ToOneView({
                            model: relatedResource,
                            parentResource: resource,
                            parentModel: resource.specifyModel,
                            relatedField: resource.specifyModel.getField(relatedFieldName),
                            adding: false
                        }));
                    });
                });
            },

            viewRelated: function(modelName, id, relatedFieldName) {
                var resource = window.specifyParentResource ||
                    new (specifyapi.Resource.forModel(modelName))({ id: id });
                var relatedField = resource.specifyModel.getField(relatedFieldName);
                switch (relatedField.type) {
                case 'one-to-many':
                    setCurrentView(new views.ToManyView({
                        parentResource: resource,
                        parentModel: resource.specifyModel,
                        relatedField: relatedField,
                        adding: false
                    }));
                    break;
                case 'many-to-one':
                    resource.rget(relatedField.name).done(function(relatedResource) {
                        setCurrentView(new views.ToOneView({
                            model: relatedResource,
                            parentResource: resource,
                            parentModel: resource.specifyModel,
                            relatedField: relatedField,
                            adding: false
                        }));
                    });
                    break;
                }
            },

            recordSet: function(id) {
                var recordSet = new (specifyapi.Resource.forModel('recordset'))({ id: id });
                setCurrentView(new views.RecordSetView({ model: recordSet }));
            },

            view: function(modelName, id) {
                setCurrentView(new views.ResourceView({ modelName: modelName, resourceId: id }));
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
