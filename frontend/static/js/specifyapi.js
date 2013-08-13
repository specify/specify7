define([
    'jquery', 'underscore', 'backbone', 'schema'
], function($, _, Backbone, schema) {
    "use strict";

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
            var collection = new schema.models.PickList.Collection();
            collection.queryParams.name = pickListName;
            collection.queryParams.domainfilter = true;
            return collection.fetch().pipe(function() { return collection.first(); });
        },
        queryCbxSearch: function(model, searchfield, searchterm) {
            var collection = new model.Collection();
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
            var collection = new schema.models.CollectionRelType.Collection();
            collection.queryParams.name = name;
            return collection.fetch().pipe(function() { return collection.first(); });
        },
        getTreePath: function(treeResource) {
            var model = treeResource.specifyModel.name.toLowerCase();
            var url = '/api/specify_tree/' + model + '/' + treeResource.id + '/path/';
            return $.get(url).promise();
        }
    });

    return api;
});
