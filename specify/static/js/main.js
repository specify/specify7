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

        function addOrViewRelated(adding, modelName, id, relatedField) {
            var model = schema.getModel(modelName);
            var field = model.getField(relatedField);
            var viewdef = $.deparam.querystring().viewdef;
            var opts = {
                parentModel: model, relatedField: field, viewdef: viewdef, adding: adding,
                parentResource: window.specifyParentResource || new (specifyapi.Resource.forModel(model))({ id: id })
            };
            if (field.type === 'one-to-many' && !adding) {
                setCurrentView(new views.ToManyView(opts));
                return;
            }

            opts.parentResource.rget(field.name).done(function(relatedResource) {
                var view;
                if (_(relatedResource).isNull()) opts.adding = adding = true;
                if (adding) {
                    opts.model = new (specifyapi.Resource.forModel(field.getRelatedModel()))();
                    if (field.type === 'one-to-many')
                        opts.model.set(field.otherSideName, opts.parentResource.url(), { silent: true });
                    view = new views.ToOneView(opts);
                    view.on('savecomplete', function() {
                        if (field.type === 'many-to-one') opts.parentResource.set(field.name, opts.model.url());
                        navigation.navigate(opts.model.viewUrl(), { replace: true, trigger: true });
                    });
                } else {
                    opts.model = relatedResource;
                    view = new views.ToOneView(opts);
                }
                setCurrentView(view);
            });
        }

        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'recordset/:id/*splat': 'recordSet',
                'view/:model/:id/:related/new/*splat': 'addRelated',
                'view/:model/:id/:related/*splat': 'viewRelated',
                'view/:model/:id/*splat': 'view',
                'viewashtml/*splat': 'viewashtml',
                'datamodel/:model/': 'datamodel',
                'datamodel/': 'datamodel'
            },

            recordSet: function(id) {
                var recordSet = new (specifyapi.Resource.forModel('recordset'))({ id: id });
                setCurrentView(new views.RecordSetView({ model: recordSet }));
            },

            view: function(modelName, id) {
                setCurrentView(new views.ResourceView({ modelName: modelName, resourceId: id }));
            },

            viewRelated: _.bind(addOrViewRelated, this, false),

            addRelated: _.bind(addOrViewRelated, this, true),

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
