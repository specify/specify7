"use strict";
var schema = require('./schema.js');

module.exports =  function getPickListByName(pickListName) {
        var collection = new schema.models.PickList.LazyCollection({
            filters: { name: pickListName },
            domainfilter: true
        });
        return collection.fetch({limit: 1}).pipe(function() { return collection.first(); });
    };

