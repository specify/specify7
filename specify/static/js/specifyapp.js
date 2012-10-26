define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform',
    'datamodelview', 'resourceview', 'localizeform', 'beautify-html', 'navigation',
    'cs!express-search', 'cs!welcomeview', 'cs!domain', 'jquery-bbq'
], function(
    $, _, Backbone, specifyapi, schema, specifyform, datamodelview,
    ResourceView, localizeForm, beautify, navigation, esearch, WelcomeView, domain) {
    "use strict";

    var app = {
        currentView: null,
        start: appStart
    };

    function appStart() {
        var rootContainer = $('#content');

        // make the express search field functional
        app.expressSearch = new esearch.SearchView({ el: $('#express-search') });

        $('#site-name a').click(function(evt) {
            evt.preventDefault();
            navigation.go($(evt.currentTarget).prop('href'));
        });

        function setCurrentView(view) {
            app.currentView && app.currentView.remove();
            $('.ui-autocomplete').remove(); // these are getting left behind sometimes
            $('.ui-dialog-content').dialog('close'); // close any open dialogs
            app.currentView = view;
            app.currentView.render();
            rootContainer.append(app.currentView.el);
        }

        function getViewdef() { return $.deparam.querystring().viewdef; }

        var SpecifyRouter = Backbone.Router.extend({
            routes: {
                'express_search/*splat': 'esearch',
                'recordset/:id/:index/*splat': 'recordSet',
                'recordset/:id/*splat': 'recordSet',
                'view/:model/new/*splat': 'newResource',
                'view/:model/:id/*splat': 'view',
                'viewashtml/*splat': 'viewashtml',
                'datamodel/:model/': 'datamodel',
                'datamodel/': 'datamodel',
                '*splat': 'welcome',
            },

            welcome: function() {
                setCurrentView(new WelcomeView());
            },

            esearch: function() {
                setCurrentView(new esearch.ResultsView());
            },

            recordSet: function(id, index) {
                index = index ? parseInt(index, 10) : 0;
                var recordSet = new (specifyapi.Resource.forModel('recordset'))({ id: id });
                var recordSetItems = new (specifyapi.Collection.forModel('recordsetitem'))();
                recordSetItems.queryParams.recordset = id;
                recordSetItems.limit = 1;

                function doIt() {
                    $.when(recordSetItems.fetch({at: index}), recordSet.fetch()).done(function() {
                        var recordsetitem = recordSetItems.at(index);
                        var specifyModel = schema.getModelById(recordSet.get('dbtableid'));
                        if (!recordsetitem) {
                            if (recordSetItems.length === 0) {
                                // TODO: Do something better for empty record sets.
                                specifyRouter.resourceView(specifyModel, null, recordSet);
                            } else {
                                index = recordSetItems.length - 1;
                                doIt();
                            }
                            return;
                        }
                        var resource = new (specifyapi.Resource.forModel(specifyModel))({
                            id: recordsetitem.get('recordid')
                        });
                        var url = resource.viewUrl();
                        navigation.navigate($.param.querystring(url, { recordsetid: id }),
                                            {replace: true, trigger: true});
                    });
                }

                doIt();
            },

            view: function(modelName, id) {
                var params = $.deparam.querystring();
                var recordSet = params.recordsetid && new (specifyapi.Resource.forModel('recordset'))({
                    id: params.recordsetid });

                specifyRouter.resourceView(modelName, id, recordSet);
            },

            resourceView: function(model, id, recordSet) {
                var resource = new (specifyapi.Resource.forModel(model))({ id: id });
                recordSet && (resource.recordsetid = recordSet.id);

                if (resource.isNew()) {
                    var domainField = resource.specifyModel.orgRelationship();
                    if (domainField) {
                        var parentResource = domain[domainField.name];
                        resource.set(domainField.name, parentResource.url());
                    }
                }

                function doIt() {
                    setCurrentView(new ResourceView({ model: resource, recordSet: recordSet }));
                    app.currentView.on('addAnother', function(newResource) {
                        resource = newResource;
                        doIt();
                    });
                }

                $.when(resource.isNew() || resource.fetch(), recordSet && recordSet.fetch()).done(doIt);
            },

            newResource: function(model) {
                specifyRouter.view(model, null);
            },

            viewashtml: function() {
                app.currentView && app.currentView.remove();
                var params = $.deparam.querystring();
                var form = params.viewdef ?
                    specifyform.buildViewByViewDefName(params.viewdef) :
                    specifyform.buildViewByName(params.view);
                if (params.localize && params.localize.toLowerCase() !== 'false')
                    localizeForm(form);
                var html = $('<div>').append(form).html();
                rootContainer.empty().append(
                    $('<pre>').text(beautify.style_html(html))
                );
                app.currentView = null;
            },

            datamodel: function(model) {
                app.currentView && app.currentView.remove();
                var View = model ? datamodelview.DataModelView : datamodelview.SchemaView;
                app.currentView = new View({ model: model }).render();
                rootContainer.append(app.currentView.el);
            }
        });

        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});
    }

    return app;
});
