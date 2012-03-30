define(['jquery', 'underscore', 'backbone', 'datamodel', 'jquery-bbq'], function($, _, Backbone, datamodel) {
    var self = {}, resources = {}, collections = {};

    self.whenAll = function(deferreds) {
        return $.when.apply($, deferreds).pipe(function() { return _(arguments).toArray(); });
    };

    var Collection = self.Collection = Backbone.Collection.extend({
        populated: false,
        queryParams: {},
        initialize: function(models) { if (models) this.populated = true; },
        url: function() {
            var url = '/api/specify/' + this.model.specifyModel.toLowerCase() + '/';
            var options = _.extend({}, this.queryParams);
            if (_(this).has('offset')) options.offset = this.offset;
            if (_(this).has('limit')) options.limit = this.limit;
            return $.param.querystring(url, options);
        },
        parse: function(resp, xhr) {
            _.extend(this, {
                populated: true,
                offset: resp.meta.offset,
                limit: resp.meta.limit,
                totalCount: resp.meta.total_count,
            });
            return resp.objects;
        },
        fetchIfNotPopulated: function () {
            return this.populated ? $.when("already populated") : this.fetch();
        }
    }, {
        forModel: function(modelName) {
            var cannonicalName = datamodel.getCannonicalNameForModel(modelName);
            if (!_(collections).has(cannonicalName)) {
                collections[cannonicalName] = Collection.extend({
                    model: Resource.forModel(modelName)
                });
            }
            return collections[cannonicalName];
        },
        fromUri: function(uri) {
            var match = /api\/specify\/(\w+)\//.exec(uri);
            var collection = new (Collection.forModel(match[1]))();
            collection.queryParams = $.deparam.querystring(uri);
            return collection;
        }
    });

    var Resource = self.Resource = Backbone.Model.extend({
        url: function() {
            return '/api/specify/' + this.specifyModel.toLowerCase() + '/' + this.id + '/';
        },
        get: function(attribute) {
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        rget: function(field) {
            var path = _(field).isArray()? field : field.split('.');
            field = path[0].toLowerCase();
            var value = this.get(field);
            if (path.length === 1 && !datamodel.isRelatedField(this.specifyModel, field))
                return $.when(value);
            if (_.isNull(value) || _.isUndefined(value))
                return $.when(value);
            var deferred;
            switch (datamodel.getRelatedFieldType(this.specifyModel, field)) {
            case 'many-to-one':
                var related = _.isString(value) ? Resource.fromUri(value) : Resource.fromUri(value.resource_uri);
                if (_.isString(value)) {
                    deferred = related.fetch().pipe(function() {
                        return $.when(path.length === 1 ? related : related.rget(_.tail(path)));
                    });
                } else {
                    related.set(value);
                    deferred = $.when(path.length === 1 ? related : related.rget(_.tail(path)));
                }
                return deferred;
            case 'one-to-many':
                if (path.length > 1) throw new Error();
                if (_.isString(value)) return $.when(Collection.fromUri(value));
                var CollectionForModel = Collection.forModel(
                    datamodel.getRelatedModelForField(this.specifyModel, field)
                );
                return $.when(new CollectionForModel(value));
            case 'zero-to-one':
                if(_.isString(value))
                    deferred = $.when(Collection.fromUri(value));
                else {
                    var CFM = Collection.forModel(datamodel.getRelatedModelForField(this.specifyModel, field));
                    deferred = $.when(new CFM(value));
                }
                return deferred.pipe(function(collection) {
                    if (path.length > 1)
                        return collection.at(0).rget(_.tail(path));
                    else
                        return collection.length ? collection.at(0) : null;
                });
            }
        },
        fetchIfNotPopulated: function() {
            return this.has('resoure_uri') ? $.when("already populated") : this.fetch();
        }
    }, {
        forModel: function(modelName) {
            var cannonicalName = datamodel.getCannonicalNameForModel(modelName);
            if (!_(resources).has(cannonicalName)) {
                resources[cannonicalName] = Resource.extend({
                    specifyModel: cannonicalName
                }, {
                    specifyModel: cannonicalName
                });
            }
            return resources[cannonicalName];
        },

        fromUri: function(uri) {
            var match = /api\/specify\/(\w+)\/(\d+)\//.exec(uri);
            var ResourceForModel = Resource.forModel(match[1]);
            return new ResourceForModel({id: match[2]});
        }
    });

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

    self.getPickListByName = function(pickListName) {
        var pickListUri = "/api/specify/picklist/?name=" + pickListName;
        var collection = Collection.fromUri(pickListUri);
        return collection.fetch().pipe(function() { return collection.first(); });
    };

    function invoke(func) {
        var args = _.tail(arguments);
        return function(obj) { return obj[func].apply(obj, args); };
    }

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
