"use strict";

var $         = require('jquery');
var _         = require('underscore');
var Backbone  = require('./backbone.js');

var schema              = require('./schema.js');
var api                 = require('./specifyapi.js');
var navigation          = require('./navigation.js');
var domain              = require('./domain.js');
var OtherCollectionView = require('./othercollectionview.js');
var NotFoundView        = require('./notfoundview.js');
var userInfo            = require('./userinfo.js');
var router              = require('./router.js');
var app                 = require('./specifyapp.js');
var querystring         = require('./querystring.js');

    var GUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

    function getRecordSetItem(recordSet, index) {
        return $.when(recordSet.fetchIfNotPopulated(), $.get('/api/specify/recordsetitem/', {
            recordset: recordSet.id,
            offset: index,
            limit: 1
        })).pipe(function(__, data) {
            var itemData = data[0].objects[0];
            if (!itemData) return null;

            var specifyModel = schema.getModelById(recordSet.get('dbtableid'));
            return new specifyModel.Resource({ id: itemData.recordid });
        });
    }

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

        function navToItem() {
            getRecordSetItem(recordSet, index).done(function(resource) {
                if (!resource) {
                    app.setCurrentView(new EmptyRecordSetView({ model: recordSet }));
                    return;
                }

                // go to the actual resource
                var url = resource.viewUrl();
                navigation.navigate(querystring.param(url, { recordsetid: id }),
                                    {replace: true, trigger: true});
            });
        }

        recordSet.fetch().done(function() { checkLoggedInCollection(recordSet, null, navToItem); });
        return;
    }

    // begins the process of creating a new resource
    function newResourceView(model) {
        if (userInfo.isReadOnly) {
            app.setCurrentView(new NotFoundView());
            app.setTitle('Page Not Found');
        } else {
            resourceView(model, null);
        }
    }

    // this function shows users individual resources which
    // can optionally be in the context of some recordset
    function resourceView(modelName, id) {
        var model = schema.getModel(modelName);
        if (GUID_RE.test(id)) {
            viewResourceByGUID(model, id);
            return;
        }
        // look to see if we are in the context of a recordset
        var params = querystring.deparam();
        var recordSet = params.recordsetid &&
                new schema.models.RecordSet.Resource({ id: params.recordsetid });

        var resource = new model.Resource({ id: id });
        recordSet && (resource.recordsetid = recordSet.id);

        // we preload the resource and recordset to make sure they exist. this prevents
        // an unfilled view from being displayed.
        $.when(resource.isNew() || resource.fetch(), recordSet && recordSet.fetch())
            .fail(app.handleError)
            .done(function() { checkLoggedInCollection(resource, recordSet); });
     }

    function viewResourceByGUID(model, guid) {
        var byGUID = new model.LazyCollection({ filters: { guid: guid } });
        byGUID.fetch({ limit: 1 }).done(function() {
            if (byGUID.length < 1) {
                app.setCurrentView(new NotFoundView());
                app.setTitle('Page Not Found');
                return;
            }
            // should we update the url state to the row id version?
            checkLoggedInCollection(byGUID.at(0));
        });
    }

    function byCatNo(collection, catNo) {
        collection = decodeURIComponent(collection);
        catNo = decodeURIComponent(catNo);
        var collectionLookup = new schema.models.Collection.LazyCollection({
            filters: { code: collection }
        });
        collectionLookup.fetch({ limit: 1 }).pipe(function() {
            if (collectionLookup.length < 1) {
                return true;
            } else if (collectionLookup._totalCount > 1) {
                console.error("multiple collections with code:", collection);
                return true;
            }
            var collection = collectionLookup.at(0);
            if (!loggedInCollectionP(collection)) {
                navigation.switchCollection(collection);
                return false;
            }
            var formatter = schema.models.CollectionObject.getField('catalognumber').getUIFormatter();
            if (formatter) {
                var parsed = formatter.parse(catNo);
                if (!parsed) {
                    console.log("bad catalog number:", catNo);
                    return true;
                }
                catNo = formatter.canonicalize(parsed);
            }
            var coLookup = new schema.models.CollectionObject.LazyCollection({
                filters: { catalognumber: catNo },
                domainfilter: true
            });
            return coLookup.fetch({ limit: 1 })
                .pipe(function() { return coLookup.at(0); })
                .pipe(function(collectionobject) {
                    if (!collectionobject) return true;
                    // should we update the url state to the row id version?
                    app.showResource(collectionobject);
                    return false;
                });
        }).done(function(notFound) {
            if (notFound) {
                app.setCurrentView(new NotFoundView());
                app.setTitle('Page Not Found');
            }
        });
    }

    // is user logged into collection?
    function loggedInCollectionP(collection) {
        return collection.id == schema.domainLevelIds.collection;
    }

    // check that it makes sense to view this resource when logged into current collection
    function checkLoggedInCollection(resource, recordSet, then) {
        domain.collectionsForResource(resource).done(function(collections) {
            if (collections && !resource.isNew() && !_.any(collections, loggedInCollectionP)) {
                // the resource is not "native" to this collection. ask user to change collections.
                app.setCurrentView(new OtherCollectionView({ resource: resource, collections: collections }));
            } else {
                (then || app.showResource)(resource, recordSet);
            }
        });
    }

module.exports =  function() {
        router.route('recordset/:id/', 'recordSetView', recordSetView);
        router.route('recordset/:id/:index/', 'recordSetView', recordSetView);
        router.route('view/:model/:id/', 'resourceView', resourceView);
        router.route('view/:model/new/', 'newResourceView', newResourceView);
        router.route('bycatalog/:collection/:catno/', 'byCatNo', byCatNo);
    };

