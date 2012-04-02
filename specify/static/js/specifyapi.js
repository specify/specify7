define(['jquery', 'underscore', 'backbone', 'datamodel', 'jquery-bbq'], function($, _, Backbone, datamodel) {
    var self = {}, resources = {}, collections = {};

    self.whenAll = function(deferreds) {
        return $.when.apply($, deferreds).pipe(function() { return _(arguments).toArray(); });
    };

    var Collection = self.Collection = Backbone.Collection.extend({
        populated: false,
        initialize: function(models) {
            if (models) this.populated = true;
            this.queryParams = {};
        },
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
            _.extend(collection.queryParams, $.deparam.querystring(uri));
            return collection;
        }
    });

    var Resource = self.Resource = Backbone.Model.extend({
        populated: false,
        initialize: function(attributes, options) {
            if (attributes && _(attributes).has('resource_uri')) this.populated = true;
        },
        url: function() {
            return '/api/specify/' + this.specifyModel.toLowerCase() + '/' + this.id + '/';
        },
        viewUrl: function() {
            return '/specify/view/' + this.specifyModel.toLowerCase() + '/' + this.id + '/';
        },
        get: function(attribute) {
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        set: function(key, value, options) {
            var attrs = {};
            if (_.isObject(key) || key == null) {
                _(key).each(function(value, key) { attrs[key.toLowerCase()] = value; });
                options = value;
            } else {
                attrs[key.toLowerCase()] = value;
            }
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },
        rget: function(field) { var self = this; return this.fetchIfNotPopulated().pipe(function() {
            var path = _(field).isArray()? field : field.split('.');
            field = path[0].toLowerCase();
            var value = self.get(field);
            if (path.length === 1 && !datamodel.isRelatedField(self.specifyModel, field))
                return value;
            if (_.isNull(value) || _.isUndefined(value))
                return value;

            var CollectionForModel = Collection.forModel(
                datamodel.getRelatedModelForField(self.specifyModel, field)
            );

            switch (datamodel.getRelatedFieldType(self.specifyModel, field)) {
            case 'many-to-one':
                var related = _.isString(value) ? Resource.fromUri(value) : Resource.fromUri(value.resource_uri);
                _.isObject(value) && related.set(value);
                return (path.length === 1) ? related :
                    related.fetchIfNotPopulated().pipe(function() { related.rget(_.tail(path)); });
            case 'one-to-many':
                if (path.length > 1) throw new Error();
                if (_.isString(value)) return Collection.fromUri(value);
                return new CollectionForModel(value);
            case 'zero-to-one':
                var collection = _.isString(value) ? Collection.fromUri(value) : new CollectionForModel(value);
                return collection.fetchIfNotPopulated().pipe(function() {
                    return path.length > 1 ? collection.at(0).rget(_.tail(path)) :
                        (collection.length ? collection.at(0) : null);
                });
            }
        });},
        fetchIfNotPopulated: function() {
            return this.populated ? $.when("already populated") : this.fetch({silent: true});
        },
        parse: function() {
            this.populated = true;
            Backbone.Model.prototype.parse.apply(this, arguments);
        },
        getRelatedObjectCount: function(field) {
            if (datamodel.getRelatedFieldType(this.specifyModel, field) !== 'one-to-many') {
                throw new TypeError('field is not one-to-many');
            }
            return this.rget(field).pipe(function (collection) {
                if (_.has(collection, 'totalCount')) return related.totalCount;
                // should be some way to get the count without getting any objects
                collection.limit = 1;
                return collection.fetch().pipe(function () {
                    return collection.totalCount;
                });
            });
        }
    }, {
        forModel: function(modelName) {
            var cannonicalName = datamodel.getCannonicalNameForModel(modelName);
            if (!cannonicalName) return null;
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

    self.queryCbxSearch = function(model, searchfield, searchterm) {
        var collection = new (Collection.forModel(model))();
        collection.queryParams[searchfield.toLowerCase() + '__icontains'] = searchterm;
        return collection;
    };

    return self;
});
