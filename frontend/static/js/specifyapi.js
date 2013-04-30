define(['jquery', 'underscore', 'collectionapi'], function($, _, api) {

    return _.extend(api, {
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
        }
    });
});
