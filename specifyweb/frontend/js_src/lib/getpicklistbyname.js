"use strict";
import schema from './schema';

export default function getPickListByName(pickListName) {
        var collection = new schema.models.PickList.LazyCollection({
            filters: { name: pickListName },
            domainfilter: true
        });
        return collection.fetch({limit: 1}).pipe(function() { return collection.first(); });
    };

