define(['jquery', 'underscore', 'datamodel'], function($, _, datamodel) {
    var self = {};

    // Some fields reference data in related objects. E.g. Collectors
    // references agent.lastName and agent.firstName. So we may have to
    // traverse the object tree to get the values we need. It is also
    // possible the related object is not included and has to be fetched,
    // so we will have to wait for the fetch to occur. Thus, this function.
    // The top level data is in [resource], and the field we need is named
    // by [field]. Returns a deferred that resolves to the value.
    self.getDataFromResource = function (resource, field) {
        var deferred = $.Deferred();
        function getData(data, fieldName) {
            var path = $.isArray(fieldName) ? fieldName : fieldName.split('.');
            if (path.length === 1) {
                // the field we want is right in the data object
                deferred.resolve(data[path[0].toLowerCase()]);
            } else if ($.isPlainObject(data[path[0]])) {
                // data contains an embedded object that has our field
                getData(data[path[0]], path.slice(1));
            } else {
                // we have to fetch a subobject which contains our field
                $.get(data[path[0]], function (data) {
                    getData(data, path.slice(1));
                });
            }
        }
        getData(resource, field);
        return deferred.promise();
    };

    self.getViewRelatedURL = function (resource, field) {
        var related = resource[field.toLowerCase()];
        if (related === null) return null;
        if (_.isString(related)) {
            return related.replace(/api\/specify/, 'specify/view');
        }
        throw new Error('building links for in-lined related resources not implemented yet');
    };

    self.getRelatedObjectCount = function (resource, field) {
        if (datamodel.getRelatedFieldType(self.getResourceModel(resource), field) !== 'one-to-many') {
            throw new TypeError('field is not one-to-many');
        }
        var related = resource[field.toLowerCase()];
        if (_.isArray(related))
            return $.when(related.length);
        else if (_.has(related, 'meta'))
            return $.when(related.meta.total_count);
        else {
            // should be some way to get the count without getting any objects
            return $.get(related, {limit: 1}).pipe(function (data) {
                return data.meta.total_count;
            }).promise();
        }
    };

    self.getResourceModel = function (resource) {
        var uri;
        if (_(resource).has('resource_uri'))
            uri = resource.resource_uri;
        else if (_.isString(resource))
            uri = resource;

        if (!uri) return undefined;
        var match = /api\/specify\/(\w+)\//.exec(uri);
        return datamodel.getCannonicalNameForModel(match[1]);
    }

    return self;
});
