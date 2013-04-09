define([
    'jquery', 'underscore', 'schema', 'specifyapi', 'navigation', 'cs!domain',
    'resourceview', 'othercollectionview',
    'jquery-bbq'
], function($, _, schema, api, navigation, domain, ResourceView, OtherCollectionView) {
    "use strict";
    var app;

    function recordSet(id, index) {
        index = index ? parseInt(index, 10) : 0;
        var recordSet = new (api.Resource.forModel('recordset'))({ id: id });
        var recordSetItems = new (api.Collection.forModel('recordsetitem'))();
        recordSetItems.queryParams.recordset = id;

        // capture the main logic as a function to allow re-do's in case of bad indexes
        function doIt() {
            $.when(recordSetItems.fetch({at: index, limit: 1}), recordSet.fetch()).done(function() {
                var recordsetitem = recordSetItems.at(index);
                var specifyModel = schema.getModelById(recordSet.get('dbtableid'));
                if (!recordsetitem) {
                    if (recordSetItems.length === 0) {
                        // TODO: Do something better for empty record sets.
                        resourceView(specifyModel, null, recordSet);
                    } else {
                        // index must be past the end
                        // re-do with index set to the last record
                        index = recordSetItems.length - 1;
                        doIt();
                    }
                    return;
                }
                var resource = new (api.Resource.forModel(specifyModel))({
                    id: recordsetitem.get('recordid')
                });

                // go to the actual resource
                var url = resource.viewUrl();
                navigation.navigate($.param.querystring(url, { recordsetid: id }),
                                    {replace: true, trigger: true});
            });
        }

        doIt();
    }

    // this function shows users individual resources which
    // can optionally be in the context of some recordset
    function view(modelName, id) {
        // look to see if we are in the context of a recordset
        var params = $.deparam.querystring();
        var recordSet = params.recordsetid && new (api.Resource.forModel('recordset'))({
            id: params.recordsetid });

        // show the resource
        resourceView(modelName, id, recordSet);
    }

    // provides the main logic used by the above
    function resourceView(model, id, recordSet) {
        var resource = new (api.Resource.forModel(model))({ id: id });
        recordSet && (resource.recordsetid = recordSet.id);

        // capture the main logic as a function to enable loop back for refreshing the view
        function doIt() {
            // first check that it makes sense to view this resource when logged into current collection
            domain.collectionsForResource(resource).done(function(collections) {
                if (collections) {
                    var loggedIn = function(collection) { return collection.id == domain.levels.collection.id; };

                    if (!resource.isNew() && !_.any(collections, loggedIn)) {
                        // the resource is not "native" to this collection. ask user to change collections.
                        app.setCurrentView(new OtherCollectionView({ resource: resource, collections: collections }));
                        return;
                    }
                }

                // show the resource
                var viewMode = _(['Manager', 'FullAccess']).contains(app.user.usertype) ? 'edit' : 'view';
                app.setCurrentView(new ResourceView({ model: resource, recordSet: recordSet, mode: viewMode }));

                // allow the view to "reload" itself. this is used after updates to make things easy.
                app.getCurrentView().on('redisplay', function() {
                    resource = new (api.Resource.forModel(model))({ id: id });
                    doIt();
                });

                // allow the view to replace itself with a new resource, for "add-another" functionality.
                app.getCurrentView().on('addanother', function(newResource) {
                    resource = newResource;
                    doIt();
                });
            });
        }

        // we preload the resource and recordset to make sure they exist. this prevents
        // an unfilled view from being displayed.
        $.when(resource.isNew() || resource.fetch(), recordSet && recordSet.fetch())
            .fail(app.handleError).done(doIt);
    }

    // begins the process of creating a new resource
    function newResource(model) {
        view(model, null);
    }

    return function(appIn) {
        app = appIn;
        app.router.route('recordset/:id/:index/', 'recordSet', recordSet);
        app.router.route('recordset/:id/', 'recordSet', recordSet);
        app.router.route('view/:model/new/', 'newResource', newResource);
        app.router.route('view/:model/:id/', 'view', view);
    };
});

