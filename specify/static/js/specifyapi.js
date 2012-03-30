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

    self.getPickListByName = function(pickListName) {
        var pickListUri = "/api/specify/picklist/?name=" + pickListName;
        var collection = Collection.fromUri(pickListUri);
        return collection.fetch().pipe(function() { return collection.first(); });
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
        if (datamodel.getRelatedFieldType(resource.specifyModel, field) !== 'one-to-many') {
            throw new TypeError('field is not one-to-many');
        }
        return resource.rget(field).pipe(function (collection) {
            if (_.has(collection, 'totalCount')) return related.totalCount;
            // should be some way to get the count without getting any objects
            collection.limit = 1;
            return collection.fetch().pipe(function () {
                return collection.totalCount;
            });
        });
    }
    return self;
});
