define(['collectionapi', 'resourceapi'], function(Collection, Resource) {

    return {
        Collection: Collection,
        Resource: Resource,
        getPickListByName: function(pickListName) {
            var pickListUri = "/api/specify/picklist/?name=" + pickListName;
            var collection = Collection.fromUri(pickListUri);
            return collection.fetch().pipe(function() { return collection.first(); });
        },
        queryCbxSearch: function(model, searchfield, searchterm) {
            var collection = new (Collection.forModel(model))();
            collection.queryParams[searchfield.toLowerCase() + '__icontains'] = searchterm;
            return collection;
        }
    };
});
