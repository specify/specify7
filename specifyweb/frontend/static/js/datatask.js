define([
    'jquery', 'underscore', 'backbone', 'schema', 'specifyapi', 'navigation', 'cs!domain',
    'resourceview', 'othercollectionview',
    'jquery-bbq'
], function($, _, Backbone, schema, api, navigation, domain, ResourceView, OtherCollectionView) {
    "use strict";
    var app;

    var EmptyRecordSetView = Backbone.View.extend({
        __name__: "EmptyRecordSetView",
        events: {
            'click .recordset-delete': 'delete'
        },
        template: _.template('<h2>The Record Set "<%= name %>" contains no records.</h2>'
                             + '<p>You can <a class="recordset-delete">delete</a> the record set or '
                             + '<a class="recordset-add intercept-navigation">add</a> records to it.</p>'
                             + '<p>Be aware that another user maybe getting ready to add records, '
                             + 'so only delete this record set if you are sure it is not to be used.</p>'),
        render: function() {
            var specifyModel = schema.getModelById(this.model.get('dbtableid'));
            this.$el.empty().append(this.template({ name: this.model.get('name') }));
            this.$('.recordset-add, .recordset-delete').button();

            var url = api.makeResourceViewUrl(specifyModel, null, this.model.id);
            this.$('.recordset-add').attr('href', url);
            return this;
        },
        delete: function() {
            this.model.destroy().done(function() { navigation.go('/specify/'); });
        }
    });

    function recordSetView(id, index) {
        index = index ? parseInt(index, 10) : 0;
        var recordSet = new schema.models.RecordSet.Resource({ id: id });

        api.getRecordSetItem(recordSet, index).done(function(resource) {
            if (!resource) {
                app.setCurrentView(new EmptyRecordSetView({ model: recordSet }));
                return;
            }

            // go to the actual resource
            var url = resource.viewUrl();
            navigation.navigate($.param.querystring(url, { recordsetid: id }),
                                {replace: true, trigger: true});
        });
    }

    // begins the process of creating a new resource
    function newResourceView(model) {
        resourceView(model, null);
    }

    // this function shows users individual resources which
    // can optionally be in the context of some recordset
    function resourceView(modelName, id) {
        // look to see if we are in the context of a recordset
        var params = $.deparam.querystring();
        var recordSet = params.recordsetid &&
                new schema.models.RecordSet.Resource({ id: params.recordsetid });

        var resource = new (schema.getModel(modelName).Resource)({ id: id });
        recordSet && (resource.recordsetid = recordSet.id);

        // we preload the resource and recordset to make sure they exist. this prevents
        // an unfilled view from being displayed.
        $.when(resource.isNew() || resource.fetch(), recordSet && recordSet.fetch())
            .fail(app.handleError)
            .done(function() { checkLoggedInCollection(resource, recordSet); });
     }

    // is user logged into collection?
    function loggedInCollectionP(collection) {
        return collection.id == domain.levels.collection.id;
    }

    // check that it makes sense to view this resource when logged into current collection
    function checkLoggedInCollection(resource, recordSet) {
        domain.collectionsForResource(resource).done(function(collections) {
            if (collections && !resource.isNew() && !_.any(collections, loggedInCollectionP)) {
                // the resource is not "native" to this collection. ask user to change collections.
                app.setCurrentView(new OtherCollectionView({ resource: resource, collections: collections }));
            } else {
                showResource(resource, recordSet);
            }
        });
    }

    // build the actual view
    function showResource(resource, recordSet) {
        var viewMode = _(['Manager', 'FullAccess']).contains(app.user.usertype) ? 'edit' : 'view';
        var view = new ResourceView({ model: resource, recordSet: recordSet, mode: viewMode });

        view.on('saved', function(resource, options) {
            if (options.addAnother) {
                showResource(options.newResource, recordSet);
            } else if (options.wasNew) {
                navigation.go(resource.viewUrl());
            } else {
                showResource(new resource.constructor({ id: resource.id }), recordSet);
            }
        }).on('deleted', function() {
            if (view.next) {
                navigation.go(view.next.viewUrl());
            } else if (view.prev) {
                navigation.go(view.prev.viewUrl());
            } else {
                view.$el.empty();
                view.$el.append('<p>Item deleted.</p>');
            }
        }).on('changetitle', function(title) {
            document.title = title;
        });

        app.setCurrentView(view);
    }

    return function(appIn) {
        app = appIn;
        app.router.route('recordset/:id/', 'recordSetView', recordSetView);
        app.router.route('recordset/:id/:index/', 'recordSetView', recordSetView);
        app.router.route('view/:model/:id/', 'resourceView', resourceView);
        app.router.route('view/:model/new/', 'newResourceView', newResourceView);
    };
});

