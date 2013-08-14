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
            var collection = new schema.models.PickList.QueryCollection({
                filters: { name: pickListName },
                domainfilter: true,
                limit: 1
            });
            return collection.fetch().pipe(function() { return collection.first(); });
        },
        queryCbxSearch: function(model, searchfield, searchterm) {
            var filters = {};
            filters[searchfield.toLowerCase() + '__icontains'] = searchterm;
            return new model.QueryCollection({ filters: filters, domainfilter: true });
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

            return $.get(url, data).pipe(function(results) {
                return new templateResource.specifyModel.Collection(results);
            });
        },
        getCollectionObjectRelTypeByName: function(name) {
            var collection = new schema.models.CollectionRelType.QueryCollection({
                filters: { name: name },
                limit: 1
            });
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
