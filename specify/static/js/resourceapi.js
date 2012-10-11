define([
    'jquery', 'underscore', 'backbone', 'schema', 'whenall', 'cs!businessrules'
], function($, _, Backbone, schema, whenAll, businessrules) {
    var api = {};

    function isResourceOrCollection(obj) { return obj instanceof Resource || obj instanceof Collection; }

    function eventHandlerForToOne(related, field) {
        return function(event) {
            var args = _.toArray(arguments);
            switch (event) {
            case 'saverequired':
                if (related.dependent) this.needsSaved = true;
                else args[0] = 'subsaverequired';
            case 'subsaverequired':
            case 'saveblocked':
            case 'oktosave':
                return this.trigger.apply(this, args);
                break;
            case 'change:id':
                this.set(field.name, related.url(), {silent: true});
                break;
            }

            // pass change:field events up the tree, updating fields with dot notation
            var match = /^r?(change):(.*)$/.exec(event);
            if (match) {
                args[0] = 'r' + match[1] + ':' + field.name.toLowerCase() + '.' + match[2];
                this.trigger.apply(this, args);
            }
        };
    }

    function eventHandlerForToMany(related, field) {
        return function(event) {
            var args = _.toArray(arguments);
            switch (event) {
            case 'saverequired':
                if (related.dependent) this.needsSaved = true;
                else args[0] = 'subsaverequired';
            case 'subsaverequired':
            case 'saveblocked':
            case 'oktosave':
                // propagate the above events up the object tree
                this.trigger.apply(this, args);
                break;
            case 'add':
            case 'remove':
                // annotate add and remove events with the field in which they occured
                var args = _(arguments).toArray();
                args[0] = event + ':' + field.name.toLowerCase();
                this.trigger.apply(this, args);
                break;
            }};
    }

    api.Resource = Backbone.Model.extend({
        populated: false,   // indicates if this resource has data
        _fetch: null,       // stores reference to the ajax deferred while the resource is being fetched
        needsSaved: false,  // set when a local field is changed
        _save: null,        // stores reference to the ajax deferred while the resource is being saved
        dependent: false,   // set when resource is a related to it parent by a dependent field

        initialize: function(attributes, options) {
            this.specifyModel = this.constructor.specifyModel;
            this.relatedCache = {};   // references to related objects referred to by field in this resource

            // if initialized with some attributes that include a resource_uri,
            // assume that represents all the fields for the resource
            if (attributes && _(attributes).has('resource_uri')) this.populated = true;

            // the resource needs to be saved if any of its fields change
            // unless they change because the resource is being fetched
            // or updated during a save
            this.on('change', function(resource, options) {
                if (!this._fetch && !this._save) {
                    this.needsSaved = true;
                    this.trigger('saverequired');
                }

                this.updateRelatedCache(options.changes);
            });

            // if the id of this resource changes, we go through and update
            // all the objects that point to it with the new pointer.
            // this is to support having collections of objects attached to
            // newly created resources that don't have ids yet. when the
            // resource is saved, the related objects can have their FKs
            // set correctly.
            this.on('change:id', function() {
                var resource = this;
                _(resource.relatedCache).each(function(related, fieldName) {
                    var field = resource.specifyModel.getField(fieldName);
                    if(field.type === 'one-to-many') {
                        _.chain(related.models).compact().invoke('set', field.otherSideName, resource.url());
                    }
                });

                // TODO: set value on parent object if necessary
            });

            businessrules.attachToResource(this);
        },
        updateRelatedCache: function(changes) {
            var self = this;
            _.each(changes, function(changed, field) {
                if (!changed) return;
                var related = self.relatedCache[field];
                related && related.off(null, null, self);
                delete self.relatedCache[field];
            });
        },
        logAllEvents: function() {
            this.on('all', function() {
                console.log(arguments);
            });
        },
        url: function() {
            // returns the api uri for this resource. if the resource is newly created
            // (no id), return the uri for the collection it belongs to
            return '/api/specify/' + this.specifyModel.name.toLowerCase() + '/' +
                (!this.isNew() ? (this.id + '/') : '');
        },
        viewUrl: function() {
            // returns the url for viewing this resource in the UI
            return '/specify/view/' + this.specifyModel.name.toLowerCase() + '/' + (this.id || 'new') + '/';
        },
        get: function(attribute) {
            // case insensitive
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        setToOneField: function(field, related, options) {
            var self = this;
            if (_.isString(field)) field = self.specifyModel.getField(field);

            var oldRelated = self.relatedCache[field.name.toLowerCase()];
            oldRelated && oldRelated.off("all", null, this);

            if (!related) {
                self.set(field.name, related, options);
                return;
            }
            if (!(related instanceof api.Resource))
                throw new Error("can't set to-one field to non resource");

            self.set(field.name, related.url(), options);
            related.on('all', eventHandlerForToOne(related, field), self);
            related.parent = self;
            related.dependent = field.isDependent();
            self.relatedCache[field.name.toLowerCase()] = related;
        },
        set: function(key, value, options) {
            // make the keys case insensitive
            var attrs = {}, self = this;
            if (_.isObject(key) || key == null) {
                _(key).each(function(value, key) { attrs[key.toLowerCase()] = value; });
                options = value;
            } else {
                attrs[key.toLowerCase()] = value;
            }

            return Backbone.Model.prototype.set.call(this, attrs, options);
        },
        rget: function(fieldName, prePop) {
            // get the value of the named field where the name may traverse related objects
            // using dot notation. if the named field represents a resource or collection,
            // then prePop indicates whether to return the named object or the contents of
            // the field that represents it
            var self = this;
            // first make sure we actually have this object.
            return this.fetchIfNotPopulated().pipe(function() {
                var path = _(fieldName).isArray()? fieldName : fieldName.split('.');
                fieldName = path[0].toLowerCase();
                var field = self.specifyModel.getField(fieldName);
                var value = self.get(fieldName);

                // if field represents a value, then return that if we are done,
                // otherwise we can't traverse any farther...
                if (!field || !field.isRelationship) return path.length === 1 ? value : undefined;

                var related = field.getRelatedModel();
                switch (field.type) {
                case 'many-to-one':
                    // a foreign key field.
                    if (!value) return value;  // no related object

                    // is the related resource cached?
                    var toOne = self.relatedCache[fieldName];
                    if (!toOne) {
                        // if we got a string, then it is a uri pointing to the resource,
                        // so we construct a resource from it
                        if (_.isString(value)) toOne = self.constructor.fromUri(value);
                        else {
                            // we got the data inline as a JSON object.
                            toOne = new (self.constructor.forModel(related))();
                            // pretend like the resource is being fetched
                            // and set the data into it
                            toOne._fetch = true;
                            toOne.set(toOne.parse(value));
                            toOne._fetch = null;
                            toOne.populated = true;
                        }
                        self.setToOneField(field, toOne, {silent: true});
                    }
                    // if we want a field within the related resource then recur
                    // otherwise, start the resource fetching if prePop and return
                    return (path.length > 1) ? toOne.rget(_.tail(path), prePop) : (
                        prePop ? toOne.fetchIfNotPopulated() : toOne
                    );
                case 'one-to-many':
                    // can't traverse into a collection using dot notation
                    if (path.length > 1) return undefined;

                    // is the collection cached?
                    var toMany =  self.relatedCache[fieldName];
                    if (!toMany) {
                        // if we got a string, it is a uri pointing to the collection
                        // otherwise it is inlined data
                        toMany = (_.isString(value)) ? api.Collection.fromUri(value) :
                            new (api.Collection.forModel(related))(value, {parse: true});

                        // set the back ref
                        toMany.parent = self;
                        toMany.dependent = field.isDependent();
                        if (!self.isNew()) {
                            // filter the related objects to be those that have a FK to this resource
                            toMany.queryParams[self.specifyModel.name.toLowerCase()] = self.id;
                        } else {
                            // if this resource has no id, we can't set up the filter yet.
                            // we'll set a flag to indicate this collection represents a set
                            // of related objects for an new resource
                            toMany.isNew = true;
                        }

                        // cache it and set up event handlers
                        self.relatedCache[fieldName] = toMany;
                        toMany.on('all', eventHandlerForToMany(toMany, field), self);
                    }

                    // start the fetch if requested and return the collection
                    return prePop ? toMany.fetchIfNotPopulated() : toMany;
                case 'zero-to-one':
                    // this is like a one-to-many where the many cannot be more than one
                    // i.e. the current resource is the target of a FK

                    // is it already cached?
                    if (self.relatedCache[fieldName]) {
                        value = self.relatedCache[fieldName];
                        // recur if we need to traverse more
                        return (path.length === 1) ? value : value.rget(_.tail(path), prePop);
                    }

                    // if the field is a string, then it is a uri pointing to the collection
                    // that contains the resource, otherwise we got it inline
                    var collection = _.isString(value) ? api.Collection.fromUri(value) :
                        new (api.Collection.forModel(related))(value);

                    // if this resource is not yet persisted, the related object can't point to it yet
                    // set a flag to indicate that
                    if (self.isNew()) collection.isNew = true;

                    // fetch the collection and pretend like it is a single resource
                    return collection.fetchIfNotPopulated().pipe(function() {
                        var value = collection.isEmpty() ? null : collection.first();
                        if (value) {
                            // setup event handlers and back ref
                            value.on('all', eventHandlerForToOne(value, field), self);
                            value.parent = self;
                            value.dependent = field.isDependent();
                        }

                        // cache it and either return it or recur if further traversing is required
                        self.relatedCache[fieldName] = value;
                        return (path.length === 1) ? value : value.rget(_.tail(path), prePop);
                    });
                }
            });
        },
        save: function() {
            var resource = this;
            if (resource._save) {
                throw new Error('resource is already being saved');
            }
            var didNeedSaved = resource.needsSaved;
            resource.needsSaved = false;

            resource._save = Backbone.Model.prototype.save.apply(resource, arguments);

            resource._save.fail(function() {
                resource.needsSaved = didNeedSaved;
                didNeedSaved && resource.trigger('saverequired');
            }).then(function() {
                resource._save = null;
            });

            return resource._save;
        },
        rsave: function() {
            // descend the object tree and save everything that needs it
            var resource = this;
            if (resource._save) {
                throw new Error('resource is already being saved');
            }

            var isToOne = function(related, fieldName) {
                var field = resource.specifyModel.getField(fieldName);
                return field.type === 'many-to-one' && !related.dependent;
            };
            var isToMany = function(related, fieldName) {
                var field = resource.specifyModel.getField(fieldName);
                return _(['one-to-many', 'zero-to-one']).contains(field.type) && !related.dependent;
            };
            var saveIfExists = function(related) { return related && related.rsave(); };

            var saveIf = function(pred) {
                return _.chain(resource.relatedCache).filter(pred).map(saveIfExists).value();
            };

            var saveResource = function() {
                resource.gatherDependentFields();
                return resource.needsSaved && resource.save();
            };

            return whenAll(saveIf(isToOne)).pipe(function() {
                return $.when(saveResource()).pipe(function() {
                    return whenAll(saveIf(isToMany));
                });
            });
        },
        gatherDependentFields: function() {
            var resource = this;
            _.each(resource.relatedCache, function(related, fieldName) {
                var field = resource.specifyModel.getField(fieldName);

                if (related.dependent) {
                    related.gatherDependentFields();
                    var relatedData = field.type === 'zero-to-one' ? [related.toJSON()] : related.toJSON() ;
                    resource.set(fieldName, relatedData, {silent: true});
                }
            });
        },
        fetch: function() {
            // cache a reference to the ajax deferred and don't start fetching if we
            // already are.
            var resource = this;
            if (resource._fetch) return resource._fetch;
            return resource._fetch = Backbone.Model.prototype.fetch.call(this).done(function() {
                resource._fetch = null;
            });
        },
        fetchIfNotPopulated: function() {
            var resource = this;
            // if already populated, return the resource
            if (resource.populated) return $.when(resource);

            // if can't be populate by fetching, return the resource
            if (resource.isNew()) return $.when(resource);

            // fetch and return a deferred.
            return resource.fetch().pipe(function() { return resource; });
        },
        parse: function(resp) {
            // since we are putting in data, the resource in now populated
            this.populated = true;
            if (resp.id) resp.id = parseInt(resp.id, 10);
            return Backbone.Model.prototype.parse.apply(this, arguments);
        },
        getRelatedObjectCount: function(fieldName) {
            // return the number of objects represented by a to-many field
            if (this.specifyModel.getField(fieldName).type !== 'one-to-many') {
                throw new TypeError('field is not one-to-many');
            }

            // for unpersisted objects, this function doesn't make sense
            if (this.isNew()) return $.when(undefined);

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
            // override default backbone sync to include version header on delete
            // to support the optimistic locking system
            if (method === 'delete') {
                options = options || {};
                options.headers = {'If-Match': resource.get('version')};
            }
            return Backbone.sync(method, resource, options);
        },
        onChange: function(fieldName, callback) {
            // bind a callback to the change event for the named field
            var fieldName = fieldName.toLowerCase();
            var event = fieldName.split('.').length === 1 ? 'change:' : 'rchange:';
            this.on(event + fieldName, function(resource, value) { callback(value); });
        },
        placeInSameHierarchy: function(other) {
            var self = this;
            var myPath = self.specifyModel.orgPath();
            var otherPath = other.specifyModel.orgPath();
            if (!myPath || !otherPath) return;
            if (myPath.length > otherPath.length) return;
            var diff = _(otherPath).rest(myPath.length - 1).reverse();
            return other.rget(diff.join('.')).done(function(common) {
                self.set(_(diff).last(), common.url());
            });
        }
    }, {
        forModel: function(model) {
            // given a model name or object, return a constructor for resources of that type
            var model = _(model).isString() ? schema.getModel(model) : model;
            if (!model) return null;

            if (!_(resources).has(model.name)) {
                resources[model.name] = api.Resource.extend({}, { specifyModel: model });
            }
            return resources[model.name];
        },
        fromUri: function(uri) {
            // given a resource uri, find the appropriate constructor and instantiate
            // a resource object representing the resource. will not be populated.
            var match = /api\/specify\/(\w+)\/(\d+)\//.exec(uri);
            var ResourceForModel = api.Resource.forModel(match[1]);
            return new ResourceForModel({id: parseInt(match[2], 10) });
        },
        collectionFor: function() {
            // return the collection constructor for this type of resource
            return api.Collection.forModel(this.specifyModel);
        }
    });

    var RecordSet = api.Resource.extend({
        // record sets have a special case for viewing
        viewUrl: function() {
            return '/specify/recordset/' + (this.id || 'new') + '/';
        }
    }, {
        specifyModel: schema.getModel('recordset')
    });

    var resources = {};
    resources[schema.getModel('recordset').name] = RecordSet;

    return api;
});
