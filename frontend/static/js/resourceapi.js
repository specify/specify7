define([
    'require', 'jquery', 'underscore', 'backbone', 'whenall', 'jquery-bbq'
], function(require, $, _, Backbone, whenAll) {
    "use strict";

    function eventHandlerForToOne(related, field) {
        return function(event) {
            var args = _.toArray(arguments);

            if (event === 'saverequired') {
                this.needsSaved = true;
                this.trigger.apply(this, args);
                return;
            }
            if (event === 'change:id') {
                this.set(field.name, related.url());
                return;
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
                this.needsSaved = true;
                this.trigger.apply(this, args);
                break;
            case 'add':
            case 'remove':
                // annotate add and remove events with the field in which they occured
                args[0] = event + ':' + field.name.toLowerCase();
                this.trigger.apply(this, args);
                break;
            }};
    }

    var ResourceBase = Backbone.Model.extend({
        __name__: "ResourceBase",
        populated: false,   // indicates if this resource has data
        _fetch: null,       // stores reference to the ajax deferred while the resource is being fetched
        needsSaved: false,  // set when a local field is changed
        _save: null,        // stores reference to the ajax deferred while the resource is being saved

        constructor: function(attributes, options) {
            this.api = require('specifyapi');
            this.specifyModel = this.constructor.specifyModel;
            this.relatedCache = {};   // references to related objects referred to by field in this resource
            Backbone.Model.apply(this, arguments);
        },
        initialize: function(attributes, options) {
            this.noBusinessRules = options && options.noBusinessRules;
            this.noValidation = options && options.noValidation;

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
                        _.chain(related.models).compact().invoke(
                            'set', field.otherSideName, resource.url());
                    }
                });

                // TODO: set value on parent object if necessary
                // Actually, I think that should be taken care of
                // by the event handler any parent resource will
                // have placed on this resource.
            });

            this.api.trigger('initresource', this);
            if (this.isNew()) this.api.trigger('newresource', this);
        },
        clone: function() {
            var self = this;
            var newResource = Backbone.Model.prototype.clone.call(self);
            newResource.needsSaved = self.needsSaved;
            newResource.recordsetid = self.recordsetid;

            _.each(self.relatedCache, function(related, fieldName) {
                var field = self.specifyModel.getField(fieldName);
                switch (field.type) {
                case 'many-to-one':
                    break;
                case 'one-to-many':
                    newResource.rget(fieldName).done(function(newCollection) {
                        related.each(function(resource) { newCollection.add(resource); });
                    });
                    break;
                case 'zero-to-one':
                    newResource.set(fieldName, related);
                    break;
                default:
                    throw new Error('unhandled relationship type');
                }
            });
            return newResource;
        },
        url: function() {
            // returns the api uri for this resource. if the resource is newly created
            // (no id), return the uri for the collection it belongs to
            var url = '/api/specify/' + this.specifyModel.name.toLowerCase() + '/' +
                (!this.isNew() ? (this.id + '/') : '');
            return $.param.querystring(url, {recordsetid: this.recordsetid});
        },
        viewUrl: function() {
            // returns the url for viewing this resource in the UI
            var url = '/specify/view/' + this.specifyModel.name.toLowerCase() + '/' + (this.id || 'new') + '/';
            return $.param.querystring(url, {recordsetid: this.recordsetid});
        },
        get: function(attribute) {
            // case insensitive
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        setToOneCache: function(field, related) {
            var self = this;
            if (!field.isDependent()) return;

            var oldRelated = self.relatedCache[field.name.toLowerCase()];
            if (!related) {
                if (oldRelated) {
                    oldRelated.off("all", null, this);
                    self.trigger('saverequired');
                }
                self.relatedCache[field.name.toLowerCase()] = null;
                return;
            }

            if (oldRelated && oldRelated.cid === related.cid) return;

            oldRelated && oldRelated.off("all", null, this);

            related.on('all', eventHandlerForToOne(related, field), self);
            related.parent = self;

            switch (field.type) {
            case 'one-to-one':
            case 'many-to-one':
                self.relatedCache[field.name.toLowerCase()] = related;
                break;
            case 'zero-to-one':
                self.relatedCache[field.name.toLowerCase()] = related;
                related.set(field.otherSideName, self.url());
                break;
            default:
                throw new Error("setToOneCache: unhandled field type: " + field.type);
            }
        },
        setToManyCache: function(field, toMany) {
            var self = this;
            if (!field.isDependent()) return;
            // set the back ref
            toMany.parent = self;

            if (!self.isNew()) {
                // filter the related objects to be those that have a FK to this resource
                toMany.queryParams[field.otherSideName.toLowerCase()] = self.id;
            } else {
                // if this resource has no id, we can't set up the filter yet.
                // we'll set a flag to indicate this collection represents a set
                // of related objects for a new resource
                toMany.isNew = true;
            }

            var oldToMany = self.relatedCache[field.name.toLowerCase()];
            oldToMany && oldToMany.off("all", null, this);

            // cache it and set up event handlers
            self.relatedCache[field.name.toLowerCase()] = toMany;
            toMany.on('all', eventHandlerForToMany(toMany, field), self);
        },
        set: function(key, value, options) {
            // make the keys case insensitive
            var attrs = {};
            if (_.isObject(key) || key == null) {
                // in the two argument case, so
                // "key" is actually an object mapping keys to values
                _(key).each(function(value, key) { attrs[key.toLowerCase()] = value; });
                // and the options are actually in "value" argument
                options = value;
            } else {
                // three argument case
                attrs[key.toLowerCase()] = value;
            }

            // need to set the id right way if we have it because
            // relationships depend on it
            if ('id' in attrs) this.id = attrs.id;

            // handle relationship fields
            var adjustedAttrs = {};
            _.each(attrs, function(value, fieldName) {
                adjustedAttrs[fieldName] = this._handleRelationshipField(value, fieldName);
            }, this);

            return Backbone.Model.prototype.set.call(this, adjustedAttrs, options);
        },
        _handleRelationshipField: function(value, fieldName) {
            if (_(['id', 'resource_uri']).contains(fieldName)) return value; // special fields

            var field = this.specifyModel.getField(fieldName);
            field || console.warn("setting unknown field", fieldName, "on",
                                  this.specifyModel.name, "value is",
                                  value);

            if (!field || !field.isRelationship) return value; // not a relationship

            var relatedModel = field.getRelatedModel();

            var oldRelated = this.relatedCache[fieldName];
            if (_.isString(value)) {
                // got a URI
                field.isDependent() && console.warn("expected inline data for dependent field",
                                                    fieldName, "in", this);

                if (oldRelated && field.type ===  'many-to-one') {
                    // probably should never get here since the presence of an oldRelated
                    // value implies a dependent field which wouldn't be receiving a URI value
                    console.warn("unexpect condition");
                    if (oldRelated.url() !== value) {
                        // the reference changed
                        delete this.relatedCache[fieldName];
                        oldRelated.off('all', null, this);
                    }
                }
                return value;
            }

            // got an inlined resource or collection
            switch (field.type) {
            case 'one-to-many':
                // should we handle passing in an schema.Model.Collection instance here??
                this.setToManyCache(field, new relatedModel.Collection(value, {parse: true}));
                return undefined;  // because the foreign key is on the other side
            case 'many-to-one':
                if (!value) {
                    // the FK is null, or not a URI or inlined resource at any rate
                    this.setToOneCache(field, value);
                    return value;
                }

                value = (value instanceof ResourceBase) ? value :
                    new relatedModel.Resource(value, {parse: true});

                this.setToOneCache(field, value);
                return value.url();  // the FK as a URI
            case 'zero-to-one':
                // this actually a one-to-many where the related collection is only a single resource
                // basically a one-to-one from the 'to' side
                if (_.isArray(value)) {
                    value = (value.length < 1) ? null :
                        new relatedModel.Resource(_.first(value), {parse: true});
                }
                this.setToOneCache(field, value);
                return undefined; // because the FK is on the other side
            }
            console.error("unhandled setting of relationship field", fieldName,
                          "on", this, "value is", value);
            return value;
        },
        rget: function(fieldName, prePop) {
            // get the value of the named field where the name may traverse related objects
            // using dot notation. if the named field represents a resource or collection,
            // then prePop indicates whether to return the named object or the contents of
            // the field that represents it
            var path = _(fieldName).isArray()? fieldName : fieldName.split('.');

            var rget = function(_this) { return _this._rget(path); };

            // first make sure we actually have this object.
            return this.fetchIfNotPopulated().pipe(rget).pipe(function(value) {
                // if the requested value is fetchable, and prePop is true,
                // fetch the value, otherwise return the unpopulated resource
                // or collection
                if (prePop) {
                    if (!value) return value; // ok if the related resource doesn't exist
                    if (_(value.fetchIfNotPopulated).isFunction()) {
                        return value.fetchIfNotPopulated();
                    } else {
                        console.warn("rget(" + fieldName + ", prePop=true) where"
                                     + " resulting value has no fetch method");
                    }
                }
                return value;
            });
        },
        _rget: function(path) {
            var fieldName = path[0].toLowerCase();
            var value = this.get(fieldName);
            var field = this.specifyModel.getField(fieldName);
            field || console.warn("accessing unknown field", fieldName, "in",
                                  this.specifyModel.name, "value is",
                                  value);

            // if field represents a value, then return that if we are done,
            // otherwise we can't traverse any farther...
            if (!field || !field.isRelationship) {
                if (path.length > 1) {
                    console.error("expected related field");
                    return undefined;
                }
                return value;
            }

            var related = field.getRelatedModel();
            switch (field.type) {
            case 'one-to-one':
            case 'many-to-one':
                // a foreign key field.
                if (!value) return value;  // no related object

                // is the related resource cached?
                var toOne = this.relatedCache[fieldName];
                if (!toOne) {
                    _(value).isString() || console.error("expected URI, got", value);
                    toOne = this.api.getResourceFromUri(value);
                    // TODO: make sure resource is of the right model
                    this.setToOneCache(field, toOne);
                }
                // if we want a field within the related resource then recur
                return (path.length > 1) ? toOne.rget(_.tail(path)) : toOne;
            case 'one-to-many':
                // can't traverse into a collection using dot notation
                if (path.length > 1) return undefined;

                // is the collection cached?
                var toMany =  this.relatedCache[fieldName];
                if (!toMany) {
                    // value might not exist if resource is null, or the server didn't send it.
                    // since the URI is implicit in the data we have, it doesn't matter.
                    // TODO: this needs to be some kind of "to-many" collection
                    toMany = value ? this.api.getCollectionFromUri(value) : new related.Collection();
                    this.setToManyCache(field, toMany);
                }

                // start the fetch if requested and return the collection
                return toMany;
            case 'zero-to-one':
                // this is like a one-to-many where the many cannot be more than one
                // i.e. the current resource is the target of a FK

                // is it already cached?
                if (this.relatedCache[fieldName]) {
                    value = this.relatedCache[fieldName];
                    // recur if we need to traverse more
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                }

                // if this resource is not yet persisted, the related object can't point to it yet
                if (this.isNew()) return undefined;

                // it is a uri pointing to the collection
                // that contains the resource
                var collection = this.api.getCollectionFromUri(value);

                // fetch the collection and pretend like it is a single resource
                var _this = this;
                return collection.fetchIfNotPopulated().pipe(function() {
                    var value = collection.isEmpty() ? null : collection.first();
                    _this.setToOneCache(field, value);
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                });
            default:
                throw new Error('unhandled relationship type');
            }
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
                resource._save = null;
                resource.needsSaved = didNeedSaved;
                didNeedSaved && resource.trigger('saverequired');
            }).then(function() {
                resource._save = null;
            });

            return resource._save;
        },
        toJSON: function() {
            var self = this;
            var json = Backbone.Model.prototype.toJSON.apply(self, arguments);

            _.each(self.relatedCache, function(related, fieldName) {
                var field = self.specifyModel.getField(fieldName);
                if (field.type === 'zero-to-one') {
                    json[fieldName] = related ? [related.toJSON()] : [];
                } else {
                    json[fieldName] = related ? related.toJSON() : null;
                }
            });
            return json;
        },
        fetch: function(options) {
            // cache a reference to the ajax deferred and don't start fetching if we
            // already are.
            var resource = this;

            if (resource._fetch) return resource._fetch;
            return resource._fetch = Backbone.Model.prototype.fetch.call(this, options).done(function() {
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
                return collection.getTotalCount();
            });
        },
        sync: function(method, resource, options) {
            options = options || {};
            switch (method) {
            case 'delete':
                // when deleting we don't send any data so put the version in a header
                options.headers = {'If-Match': resource.get('version')};
                break;
            case 'create':
                // use the special recordSetId field to add the resource to a record set
                if (!_.isUndefined(resource.recordSetId)) {
                    options.url = $.param.querystring(
                        options.url || resource.url(),
                        {recordsetid: resource.recordSetId});
                }
                break;
            }
            return Backbone.sync(method, resource, options);
        },
        onChange: function(fieldName, callback) {
            // bind a callback to the change event for the named field
            fieldName = fieldName.toLowerCase();
            var event = fieldName.split('.').length === 1 ? 'change:' : 'rchange:';
            this.on(event + fieldName, function(resource, value) { callback(value); });
        },
        placeInSameHierarchy: function(other) {
            var self = this;
            var myPath = self.specifyModel.orgPath();
            var otherPath = other.specifyModel.orgPath();
            if (!myPath || !otherPath) return null;
            if (myPath.length > otherPath.length) return null;
            var diff = _(otherPath).rest(myPath.length - 1).reverse();
            return other.rget(diff.join('.')).done(function(common) {
                self.set(_(diff).last(), common.url());
            });
        }
    }, {
        collectionFor: function() {
            // return the collection constructor for this type of resource
            return this.specifyModel.Collection;
        }
    });

    return ResourceBase;
});
