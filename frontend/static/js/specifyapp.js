define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'schema', 'specifyform', 'cs!businessrules',
    'datamodelview', 'errorview', 'resourceview', 'othercollectionview', 'localizeform',
    'beautify-html', 'navigation', 'express-search', 'welcomeview', 'stored_query',
    'headerui', 'cs!domain', 'notfoundview', 'text!context/user.json!noinline', 'jquery-bbq'
], function(
    $, _, Backbone, specifyapi, schema, specifyform, businessRules, datamodelview, ErrorView,
    ResourceView, OtherCollectionView, localizeForm, beautify, navigation, esearch, WelcomeView,
    StoredQueryView, HeaderUI, domain, NotFoundView, userJSON) {
    "use strict";

    // the exported interface
    var app = {
        currentView: null,  // a reference to the current view, mostly for debugging
        start: appStart,    // called by main.js to launch the webapp frontend
        user: $.parseJSON(userJSON)  // the currently logged in SpecifyUser
    };

    function appStart() {
        // get a reference to the content div
        // where we will draw the rest of the app
        var rootContainer = $('#content');

        businessRules.enable(true);
        (new HeaderUI()).render();

        // gets rid of any backbone view currently showing
        // and replaces it with the rendered view given
        // also manages other niceties involved in changing views
        function setCurrentView(view) {
            app.currentView && app.currentView.remove(); // remove old view
            rootContainer.empty();
            $('.ui-autocomplete').remove(); // these are getting left behind sometimes
            $('.ui-dialog-content').dialog('close'); // close any open dialogs
            app.currentView = view;
            app.currentView.render();
            rootContainer.append(app.currentView.el);
        }

        function handleError(jqhxr) {
            setCurrentView(new ErrorView({ request: jqhxr }));
        }

        var SpecifyRouter = Backbone.Router.extend({
            // maps the final portion of the URL to the appropriate backbone view
            routes: {
                ''                      : 'welcome',
                'stored_query/:id/'     : 'storedQuery',
                'express_search/'       : 'esearch',
                'recordset/:id/:index/' : 'recordSet',
                'recordset/:id/'        : 'recordSet',
                'view/:model/new/'      : 'newResource',
                'view/:model/:id/'      : 'view',
                'viewashtml/'           : 'viewashtml',
                'datamodel/:model/'     : 'datamodel',
                'datamodel/'            : 'datamodel',
                '*whatever'             : 'notFound'   // match anything else.
            },

            // show a 'page not found' view for URLs we don't know how to handle
            notFound: function() {
                setCurrentView(new NotFoundView());
                window.document.title = 'Page Not Found | Specify WebApp';
            },

            // this view shows the user the welcome screen
            welcome: function() {
                setCurrentView(new WelcomeView());
                window.document.title = 'Welcome | Specify WebApp';
            },

            storedQuery: function(id) {
                var query = new (specifyapi.Resource.forModel('spquery'))({ id: id });
                query.fetch().fail(handleError).done(function() {
                    setCurrentView(new StoredQueryView({ query: query }));
                });
            },

            // this view executes an express search and displays the results
            esearch: function() {
                setCurrentView(new esearch.ResultsView());
                window.document.title = 'Express Search | Specify WebApp';
            },

            // this function starts the process for viewing resources from a recordset
            recordSet: function(id, index) {
                index = index ? parseInt(index, 10) : 0;
                var recordSet = new (specifyapi.Resource.forModel('recordset'))({ id: id });
                var recordSetItems = new (specifyapi.Collection.forModel('recordsetitem'))();
                recordSetItems.queryParams.recordset = id;

                // capture the main logic as a function to allow re-do's in case of bad indexes
                function doIt() {
                    $.when(recordSetItems.fetch({at: index, limit: 1}), recordSet.fetch()).done(function() {
                        var recordsetitem = recordSetItems.at(index);
                        var specifyModel = schema.getModelById(recordSet.get('dbtableid'));
                        if (!recordsetitem) {
                            if (recordSetItems.length === 0) {
                                // TODO: Do something better for empty record sets.
                                specifyRouter.resourceView(specifyModel, null, recordSet);
                            } else {
                                // index must be past the end
                                // re-do with index set to the last record
                                index = recordSetItems.length - 1;
                                doIt();
                            }
                            return;
                        }
                        var resource = new (specifyapi.Resource.forModel(specifyModel))({
                            id: recordsetitem.get('recordid')
                        });

                        // go to the actual resource
                        var url = resource.viewUrl();
                        navigation.navigate($.param.querystring(url, { recordsetid: id }),
                                            {replace: true, trigger: true});
                    });
                }

                doIt();
            },

            // this function shows users individual resources which
            // can optionally be in the context of some recordset
            view: function(modelName, id) {
                // look to see if we are in the context of a recordset
                var params = $.deparam.querystring();
                var recordSet = params.recordsetid && new (specifyapi.Resource.forModel('recordset'))({
                    id: params.recordsetid });

                // show the resource
                specifyRouter.resourceView(modelName, id, recordSet);
            },

            // provides the main logic used by the above
            resourceView: function(model, id, recordSet) {
                var resource = new (specifyapi.Resource.forModel(model))({ id: id });
                recordSet && (resource.recordsetid = recordSet.id);

                // capture the main logic as a function to enable loop back for refreshing the view
                function doIt() {
                    // first check that it makes sense to view this resource when logged into current collection
                    domain.collectionsForResource(resource).done(function(collections) {
                        if (collections) {
                            var loggedIn = function(collection) { return collection.id == domain.levels.collection.id; };

                            if (!resource.isNew() && !_.any(collections, loggedIn)) {
                                // the resource is not "native" to this collection. ask user to change collections.
                                setCurrentView(new OtherCollectionView({ resource: resource, collections: collections }));
                                return;
                            }
                        }

                        // show the resource
                        var viewMode = _(['Manager', 'FullAccess']).contains(app.user.usertype) ? 'edit' : 'view';
                        setCurrentView(new ResourceView({ model: resource, recordSet: recordSet, mode: viewMode }));

                        // allow the view to "reload" itself. this is used after updates to make things easy.
                        app.currentView.on('redisplay', function() {
                            resource = new (specifyapi.Resource.forModel(model))({ id: id });
                            doIt();
                        });

                        // allow the view to replace itself with a new resource, for "add-another" functionality.
                        app.currentView.on('addanother', function(newResource) {
                            resource = newResource;
                            doIt();
                        });
                    });
                }

                // we preload the resource and recordset to make sure they exist. this prevents
                // an unfilled view from being displayed.
                $.when(resource.isNew() || resource.fetch(), recordSet && recordSet.fetch())
                    .fail(handleError).done(doIt);
            },

            // begins the process of creating a new resource
            newResource: function(model) {
                specifyRouter.view(model, null);
            },

            // this is an old test routine for viewing the html
            // generated for different specify view
            // probably no longer works
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

            // specify datamodel explorer
            datamodel: function(model) {
                app.currentView && app.currentView.remove();
                var View = model ? datamodelview.DataModelView : datamodelview.SchemaView;
                app.currentView = new View({ model: model }).render();
                rootContainer.append(app.currentView.el);
            }
        });

        // make the Backbone routing mechanisms ignore queryparams in urls
        // this gets rid of all that *splat cruft in the routes
        var loadUrl = Backbone.history.loadUrl;
        Backbone.history.loadUrl = function(url) {
            var stripped = url && url.replace(/\?.*$/, '');
            return loadUrl.call(this, stripped);
        };

        // start processing the urls to draw the corresponding views
        var specifyRouter = new SpecifyRouter();
        Backbone.history.start({pushState: true, root: '/specify/'});
    }

    return app;
});
