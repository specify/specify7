define([
    'jquery', 'underscore', 'backbone', 'schema', 'collectionapi', 'whenall'
], function($, _, Backbone, schema, Collection, whenAll) {
    var debug = false;

    function isResourceOrCollection(obj) { return obj instanceof Resource || obj instanceof Collection; }

    function eventHandlerForToOne(resource, field) {
        return function(event) {
            if (event === 'saverequired') return resource.trigger('saverequired');
            var match = /^r?change:(.*)$/.exec(event);
            if (match) {
                var args = _(arguments).toArray();
                args[0] = 'rchange:' + field + '.' + match[1];
                resource.trigger.apply(resource, args);
            }
        };
    }

    var Resource = Backbone.Model.extend({
        populated: false, _fetch: null, needsSaved: false, saving: false,
        initialize: function(attributes, options) {
            this.specifyModel = this.constructor.specifyModel;
            if (attributes && _(attributes).has('resource_uri')) this.populated = true;
            this.on('change', function() {
                if (this._fetch) return;
                if (!this.saving) {
                    this.needsSaved = true;
                    this.trigger('saverequired');
                }
            });
            this.on('sync', function() {
                this.needsSaved = this.saving = false;
            });
            this.relatedCache = {};
            debug && this.on('all', function() {
                console.log(arguments);
            });
        },
        url: function() {
            return '/api/specify/' + this.specifyModel.name.toLowerCase() + '/' +
                (!this.isNew() ? (this.id + '/') : '');
        },
        viewUrl: function() {
            return '/specify/view/' + this.specifyModel.name.toLowerCase() + '/' + this.id + '/';
        },
        get: function(attribute) {
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        set: function(key, value, options) {
            var attrs = {}, self = this;
            if (_.isObject(key) || key == null) {
                _(key).each(function(value, key) { attrs[key.toLowerCase()] = value; });
                options = value;
            } else {
                attrs[key.toLowerCase()] = value;
            }
            if (self.relatedCache)
                _(attrs).each(function(value, key) { delete self.relatedCache[key]; });
            return Backbone.Model.prototype.set.call(this, attrs, options);
        },
        rget: function(fieldName, prePop) { var self = this; return this.fetchIfNotPopulated().pipe(function() {
            var path = _(fieldName).isArray()? fieldName : fieldName.split('.');
            fieldName = path[0].toLowerCase();
            var field = self.specifyModel.getField(fieldName);
            var value = self.get(fieldName);
            if (!field || !field.isRelationship) return path.length === 1 ? value : undefined;

            if (_.isNull(value) || _.isUndefined(value)) return value;

            var related = field.getRelatedModel();

            switch (field.type) {
            case 'many-to-one':
                var toOne = self.relatedCache[fieldName];
                if (!toOne) {
                    if (_.isString(value)) toOne = Resource.fromUri(value);
                    else {
                        toOne = Resource.fromUri(value.resource_uri);
                        toOne._fetch = true; // bit of a kludge to block neesSaved event
                        toOne.set(value);
                        toOne._fetch = null;
                        toOne.populated = true;
                    }
                    toOne.parent = self;
                    toOne.on('all', eventHandlerForToOne(self, fieldName));
                    self.relatedCache[fieldName] = toOne;
                }
                return (path.length > 1) ? toOne.rget(_.tail(path)) : (
                    prePop ? toOne.fetchIfNotPopulated() : toOne
                );
            case 'one-to-many':
                if (path.length > 1) return undefined;
                var toMany =  self.relatedCache[fieldName];
                if (!toMany) {
                    toMany = (_.isString(value)) ? Collection.fromUri(value) :
                        new (Collection.forModel(related))(value);
                    toMany.parent = self;
                    if (self.isNew()) {
                        toMany.isNew = true;
                    } else {
                        toMany.queryParams[self.specifyModel.name.toLowerCase()] = self.id;
                    }
                    self.relatedCache[fieldName] = toMany;
                    toMany.on('saverequired', function() { self.trigger('saverequired'); });
                }
                return prePop ? toMany.fetchIfNotPopulated() : toMany;
            case 'zero-to-one':
                if (self.relatedCache[fieldName]) {
                    value = self.relatedCache[fieldName];
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                }
                var collection = _.isString(value) ? Collection.fromUri(value) :
                    new (Collection.forModel(related))(value);
                return collection.fetchIfNotPopulated().pipe(function() {
                    var value = collection.isEmpty() ? null : collection.first();
                    if (value) {
                        value.on('all', eventHandlerForToOne(self, fieldName));
                        value.parent = self;
                    }
                    self.relatedCache[fieldName] = value;
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                });
            }
        });},
        save: function() {
            this.saving = true;
            return Backbone.Model.prototype.save.apply(this, arguments);
        },
        rsave: function() {
            var resource = this;
            var deferreds = _(resource.relatedCache).invoke('rsave');
            deferreds.push(resource.needsSaved && resource.save());
            // If there is a circular dependency we could end up
            // saving over and over, so if we are saving already
            // return the previous saves deferred. This means you
            // can't save and then make changes and save again while
            // the first save is pending, but that would be insane
            // anyways.
            return resource._rsaveDeferred = resource._rsaveDeferred ||
                whenAll(deferreds).then(function() { resource._rsaveDeferred = null; });
        },
        fetch: function() {
            var resource = this;
            if (resource._fetch !== null) return resource._fetch;
            return resource._fetch = Backbone.Model.prototype.fetch.call(this).done(function() {
                resource._fetch = null;
            });
        },
        fetchIfNotPopulated: function() {
            var resource = this;
            if (resource.populated) return $.when(resource)
            if (resource.isNew()) return $.when(resource)
            return resource.fetch().pipe(function() { return resource; });
        },
        parse: function() {
            this.populated = true;
            return Backbone.Model.prototype.parse.apply(this, arguments);
        },
        getRelatedObjectCount: function(fieldName) {
            if (this.specifyModel.getField(fieldName).type !== 'one-to-many') {
                throw new TypeError('field is not one-to-many');
            }
            return this.rget(fieldName).pipe(function (collection) {
                if (!collection) return 0;
                if (_.has(collection, 'totalCount')) return collection.totalCount;
                // should be some way to get the count without getting any objects
                collection.limit = 1;
                return collection.fetch().pipe(function () {
                    return collection.totalCount;
                });
            });
        },
        sync: function(method, resource, options) {
            if (method === 'delete') {
                options = options || {};
                options.headers = {'If-Match': resource.get('version')};
            }
            return Backbone.sync(method, resource, options);
        },
        onChange: function(fieldName, callback) {
            var fieldName = fieldName.toLowerCase();
            var event = fieldName.split('.').length === 1 ? 'change:' : 'rchange:';
            this.on(event + fieldName, function(resource, value) { callback(value); });
        }
    }, {
        forModel: function(model) {
            var model = _(model).isString() ? schema.getModel(model) : model;
            if (!model) return null;
            if (!_(resources).has(model.name)) {
                resources[model.name] = Resource.extend({}, { specifyModel: model });
            }
            return resources[model.name];
        },
        fromUri: function(uri) {
            var match = /api\/specify\/(\w+)\/(\d+)\//.exec(uri);
            var ResourceForModel = Resource.forModel(match[1]);
            return new ResourceForModel({id: match[2]});
        }
    });

    var resources = {};

    return Resource;
});
