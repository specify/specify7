define(['schema'], function(schema) {
    "use strict";

    return function getPickListByName(pickListName) {
        var collection = new schema.models.PickList.LazyCollection({
            filters: { name: pickListName },
            domainfilter: true
        });
        return collection.fetch({limit: 1}).pipe(function() { return collection.first(); });
    };
});
