define([
    'jquery', 'underscore', 'backbone', 'schema', 'resourceapi', 'collectionapi' //, 'lazycollectionapi'
], function($, _, Backbone, schema, ResourceBase, CollectionBase) {
    "use strict";

    var resources = {};
    var collections = {};

    var api =  _.extend({}, Backbone.Events, {
        getRows: function(table, options) {
            table = _.isString(table) ? table : table.name;
            var url = '/api/specify_rows/' + table.toLowerCase() + '/';
            var data = {
                fields: options.fields.join(',').toLowerCase(),
                limit: options.limit.toString(),
                distinct: options.distinct ? 'true' : 'false'
            };
            return $.get(url, data).promise();
        },
        getPickListByName: function(pickListName) {
            var pickListUri = "/api/specify/picklist/?name=" + pickListName;
            var collection = api.Collection.fromUri(pickListUri);
            collection.queryParams.domainfilter = true;
            return collection.fetch().pipe(function() { return collection.first(); });
        },
        queryCbxSearch: function(model, searchfield, searchterm) {
            var collection = new (api.Collection.forModel(model))();
            collection.queryParams[searchfield.toLowerCase() + '__icontains'] = searchterm;
            collection.queryParams.domainfilter = true;
            return collection;
        },
        queryCbxExtendedSearch: function(templateResource) {
            var url = '/express_search/querycbx/' +
                    templateResource.specifyModel.name.toLowerCase() +
                    '/';
            var data = {};
            _.each(templateResource.toJSON(), function(value, key) {
                var field = templateResource.specifyModel.getField(key);
                if (field && !field.isRelationship && value) {
                    data[key] = value;
                }
            });

            return $.get(url, data).promise();
        },
        getCollectionObjectRelTypeByName: function(name) {
            var collection = new(api.Collection.forModel('collectionreltype'))();
            collection.queryParams.name = name;
            return collection.fetch().pipe(function() { return collection.first(); });
        },
        getTreePath: function(treeResource) {
            var model = treeResource.specifyModel.name.toLowerCase();
            var url = '/api/specify_tree/' + model + '/' + treeResource.id + '/path/';
            return $.get(url).promise();
        },
        Resource: {
            forModel: function(model) {
                // given a model name or object, return a constructor for resources of that type
                model = _(model).isString() ? schema.getModel(model) : model;
                if (!model) return null;
                return resources[model.name];
            },
            fromUri: function(uri) {
                // given a resource uri, find the appropriate constructor and instantiate
                // a resource object representing the resource. will not be populated.
                var match = /api\/specify\/(\w+)\/(\d+)\//.exec(uri);
                var ResourceForModel = api.Resource.forModel(match[1]);
                return new ResourceForModel({id: parseInt(match[2], 10) });
            }
        },
        Collection: {
            forModel: function(model) {
                model = _(model).isString() ? schema.getModel(model) : model;
                return collections[model.name];
            },
            fromUri: function(uri) {
                var match = /api\/specify\/(\w+)\//.exec(uri);
                var collection = new (api.Collection.forModel(match[1]))();
                if (uri.indexOf("?") !== -1)
                    _.extend(collection.queryParams, $.deparam.querystring(uri));
                return collection;
            }
        }
    });


    _.each(schema.models, function(model) {
        resources[model.name] = ResourceBase.extend({ __name__: model.name + 'Resource' },
                                                    { specifyModel: model });
    });

    _.each(schema.models, function(model) {
        collections[model.name] = CollectionBase.extend({ __name__: model.name + 'Collection',
                                                          model: resources[model.name] });
    });


    return api;
});
