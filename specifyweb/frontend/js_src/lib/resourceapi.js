import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';

import {assert} from './assert';
import {globalEvents} from './specifyapi';
import * as querystring from './querystring';
import {getResourceViewUrl, resourceFromUri} from './resource';
import {getResourceAndField} from './components/resource';

function eventHandlerForToOne(related, field) {
        return function(event) {
            var args = _.toArray(arguments);

            switch (event) {
            case 'saverequired':
                this.needsSaved = true;
                this.trigger.apply(this, args);
                return;
            case  'change:id':
                this.set(field.name, related.url());
                return;
            case 'changing':
                this.trigger.apply(this, args);
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

    function eventHandlerForToMany(_related, field) {
        return function(event) {
            var args = _.toArray(arguments);
            switch (event) {
            case 'changing':
                this.trigger.apply(this, args);
                break;
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
        _ignoreChanges: false,  // Don't trigger saveRequried when setting default values

        constructor: function() {
            this.specifyModel = this.constructor.specifyModel;
            this.dependentResources = {};   // references to related objects referred to by field in this resource
            Backbone.Model.apply(this, arguments); // TODO: check if this is necessary
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
            this.on('change', function() {
                if (!this._fetch && !this._save && !this._ignoreChanges) {
                    this.needsSaved = true;
                    this.trigger('saverequired');
                }
            });

            globalEvents.trigger('initresource', this);
            this.isNew() && globalEvents.trigger('newresource', this);
        },
        // Supress saveRequired trigger when setting default values for resource
        // Works for new resources only
        settingDefaultValues(callback){
            if(this.isNew())
                this._ignoreChanges = true;
            callback();
            this._ignoreChanges = false;
        },
        clone: function() {
            var self = this;
            var newResource = Backbone.Model.prototype.clone.call(self);
            delete newResource.id;
            delete newResource.attributes.id;
            newResource.needsSaved = self.needsSaved;
            newResource.recordsetid = self.recordsetid;

            _.each(self.dependentResources, function(related, fieldName) {
                var field = self.specifyModel.getField(fieldName);
                switch (field.type) {
                case 'many-to-one':
                    // many-to-one wouldn't ordinarily be dependent, but
                    // this is the case for paleocontext. really more like
                    // a one-to-one.
                    newResource.set(fieldName, related && related.clone());
                    break;
                case 'one-to-many':
                    newResource.rget(fieldName).then(function(newCollection) {
                        related.each(function(resource) { newCollection.add(resource.clone()); });
                    });
                    break;
                case 'zero-to-one':
                    newResource.set(fieldName, related && related.clone());
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
            // If url form changes, see idFromUrl method
            var url = '/api/specify/' + this.specifyModel.name.toLowerCase() + '/' +
                (!this.isNew() ? (this.id + '/') : '');
            return this.recordsetid == null ? url :
                querystring.format(url, {recordsetid: this.recordsetid});
        },
        viewUrl: function() {
            // returns the url for viewing this resource in the UI
            if (!_.isNumber(this.id)) console.error("viewUrl called on resource w/out id", this);
            return getResourceViewUrl(this.specifyModel.name, this.id, this.recordsetid);
        },
        get: function(attribute) {
            // case insensitive
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        storeDependent: function(field, related) {
            assert(field.isDependent());
            var setter = (field.type === 'one-to-many') ? "_setDependentToMany" : "_setDependentToOne";
            this[setter](field, related);
        },
        _setDependentToOne: function(field, related) {
            var oldRelated = this.dependentResources[field.name.toLowerCase()];
            if (!related) {
                if (oldRelated) {
                    oldRelated.off("all", null, this);
                    this.trigger('saverequired');
                }
                this.dependentResources[field.name.toLowerCase()] = null;
                return;
            }

            if (oldRelated && oldRelated.cid === related.cid) return;

            oldRelated && oldRelated.off("all", null, this);

            related.on('all', eventHandlerForToOne(related, field), this);
            related.parent = this;  // TODO: this doesn't belong here

            switch (field.type) {
            case 'one-to-one':
            case 'many-to-one':
                this.dependentResources[field.name.toLowerCase()] = related;
                break;
            case 'zero-to-one':
                this.dependentResources[field.name.toLowerCase()] = related;
                related.set(field.otherSideName, this.url()); // TODO: this logic belongs somewhere else. up probably
                break;
            default:
                throw new Error("setDependentToOne: unhandled field type: " + field.type);
            }
        },
        _setDependentToMany: function(field, toMany) {
            var oldToMany = this.dependentResources[field.name.toLowerCase()];
            oldToMany && oldToMany.off("all", null, this);

            // cache it and set up event handlers
            this.dependentResources[field.name.toLowerCase()] = toMany;
            toMany.on('all', eventHandlerForToMany(toMany, field), this);
        },
        set: function(key, value, options) {
            // Don't needlessly trigger unload protect if value didn't chane
            if(typeof key === 'string' && this.attributes[key] === value)
                return this;
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

            // need to set the id right away if we have it because
            // relationships depend on it
            if ('id' in attrs) {
                attrs.id = attrs.id && parseInt(attrs.id, 10);
                this.id = attrs.id;
            }

            const adjustedAttrs = _.reduce(attrs, (acc, value, fieldName) => {
                const [newFieldName, newValue] = this._handleField(value, fieldName);
                return _.isUndefined(newValue) ? acc : Object.assign(acc, {[newFieldName]: newValue});
            }, {});

            return Backbone.Model.prototype.set.call(this, adjustedAttrs, options);
        },
        _handleField: function(value, fieldName) {
            if (_(['id', 'resource_uri', 'recordset_info']).contains(fieldName)) return [fieldName, value]; // special fields

            var field = this.specifyModel.getField(fieldName);
            if (!field) {
                console.warn("setting unknown field", fieldName, "on",
                             this.specifyModel.name, "value is", value);
                return [fieldName, value];
            }

            fieldName = field.name.toLowerCase(); // in case field name is an alias.

            if (field.isRelationship) {
                value = _.isString(value) ?
                    this._handleUri(value, fieldName) :
                    this._handleInlineDataOrResource(value, fieldName);
            }
            return [fieldName, value];
        },
        _handleInlineDataOrResource: function(value, fieldName) {
            // TODO: check type of value
            const field = this.specifyModel.getField(fieldName);
            const relatedModel = field.relatedModel;

            switch (field.type) {
            case 'one-to-many':
                // should we handle passing in an schema.Model.Collection instance here??
                var collectionOptions = { related: this, field: field.getReverse() };

                if (field.isDependent()) {
                    const collection = new relatedModel.DependentCollection(collectionOptions, value);
                    this.storeDependent(field, collection);
                } else {
                    console.warn("got unexpected inline data for independent collection field");
                }

                // because the foreign key is on the other side
                this.trigger('change:' + fieldName, this);
                this.trigger('change', this);
                return undefined;
            case 'many-to-one':
                if (!value) { // TODO: tighten up this check.
                    // the FK is null, or not a URI or inlined resource at any rate
                    field.isDependent() && this.storeDependent(field, null);
                    return value;
                }

                const toOne = (value instanceof ResourceBase) ? value :
                    new relatedModel.Resource(value, {parse: true});

                field.isDependent() && this.storeDependent(field, toOne);
                return toOne.url();  // the FK as a URI
            case 'zero-to-one':
                // this actually a one-to-many where the related collection is only a single resource
                // basically a one-to-one from the 'to' side
                const oneTo = _.isArray(value) ?
                    (value.length < 1 ? null :
                     new relatedModel.Resource(_.first(value), {parse: true}))
                : (value || null);  // in case it was undefined

                assert(oneTo == null || oneTo instanceof ResourceBase);

                field.isDependent() && this.storeDependent(field, oneTo);
                // because the FK is on the other side
                this.trigger('change:' + fieldName, this);
                this.trigger('change', this);
                return undefined;
            }
            console.error("unhandled setting of relationship field", fieldName,
                          "on", this, "value is", value);
            return value;
        },
        _handleUri: function(value, fieldName) {
            var field = this.specifyModel.getField(fieldName);
            var oldRelated = this.dependentResources[fieldName];

            if (field.isDependent()) {
                console.warn("expected inline data for dependent field", fieldName, "in", this);
            }

            if (oldRelated && field.type ===  'many-to-one') {
                // probably should never get here since the presence of an oldRelated
                // value implies a dependent field which wouldn't be receiving a URI value
                console.warn("unexpected condition");
                if (oldRelated.url() !== value) {
                    // the reference changed
                    delete this.dependentResources[fieldName];
                    oldRelated.off('all', null, this);
                }
            }
            return value;
        },
        // get the value of the named field where the name may traverse related objects
        // using dot notation. if the named field represents a resource or collection,
        // then prePop indicates whether to return the named object or the contents of
        // the field that represents it
        rget: function(fieldName, prePop) {
            return this.getRelated(fieldName, {prePop: prePop});
        },
        // TODO: remove the need for this
        // Like "rget", but returns native promise
        rgetPromise: function(fieldName, prePop) {
            return this.getRelated(fieldName, {prePop: prePop});
        },
        // Duplicate definition for purposes of better typing:
        rgetCollection: function(fieldName, prePop) {
            return this.getRelated(fieldName, {prePop: prePop});
        },
        getRelated: function(fieldName, options) {
            options || (options = {
                prePop: false,
                noBusinessRules: false
            });
            var path = _(fieldName).isArray()? fieldName : fieldName.split('.');

            // first make sure we actually have this object.
            return this.fetchIfNotPopulated().then(function(_this) {
                return _this._rget(path, options);
            }).then(function(value) {
                // if the requested value is fetchable, and prePop is true,
                // fetch the value, otherwise return the unpopulated resource
                // or collection
                if (options.prePop) {
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
        _rget: function(path, options) {
            var fieldName = path[0].toLowerCase();
            var field = this.specifyModel.getField(fieldName);
            field && (fieldName = field.name.toLowerCase()); // in case fieldName is an alias
            var value = this.get(fieldName);
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

            var _this = this;
            var related = field.relatedModel;
            switch (field.type) {
            case 'one-to-one':
            case 'many-to-one':
                // a foreign key field.
                if (!value) return value;  // no related object

                // is the related resource cached?
                var toOne = this.dependentResources[fieldName];
                if (!toOne) {
                    _(value).isString() || console.error("expected URI, got", value);
                    toOne = related.Resource.fromUri(value, {noBusinessRules: options.noBusinessRules});
                    if (field.isDependent()) {
                        console.warn("expected dependent resource to be in cache");
                        this.storeDependent(field, toOne);
                    }
                }
                // if we want a field within the related resource then recur
                return (path.length > 1) ? toOne.rget(_.tail(path)) : toOne;
            case 'one-to-many':
                if (path.length !== 1) {
                    return $.Deferred().reject("can't traverse into a collection using dot notation");
                }

                // is the collection cached?
                var toMany = this.dependentResources[fieldName];
                if (!toMany) {
                    var collectionOptions = { field: field.getReverse(), related: this };

                    if (!field.isDependent()) {
                        return new related.ToOneCollection(collectionOptions);
                    }

                    if (this.isNew()) {
                        toMany = new related.DependentCollection(collectionOptions, []);
                        this.storeDependent(field, toMany);
                        return toMany;
                    } else {
                        console.warn("expected dependent resource to be in cache");
                        var tempCollection = new related.ToOneCollection(collectionOptions);
                        return tempCollection.fetch({ limit: 0 }).then(function() {
                            return new related.DependentCollection(collectionOptions, tempCollection.models);
                        }).then(function (toMany) { _this.storeDependent(field, toMany); });
                    }
                }
            case 'zero-to-one':
                // this is like a one-to-many where the many cannot be more than one
                // i.e. the current resource is the target of a FK

                // is it already cached?
                if (!_.isUndefined(this.dependentResources[fieldName])) {
                    value = this.dependentResources[fieldName];
                    if (value == null) return null;
                    // recur if we need to traverse more
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                }

                // if this resource is not yet persisted, the related object can't point to it yet
                if (this.isNew()) return undefined; // TODO: this seems iffy

                var collection = new related.ToOneCollection({ field: field.getReverse(), related: this, limit: 1 });

                // fetch the collection and pretend like it is a single resource
                return collection.fetchIfNotPopulated().then(function() {
                    var value = collection.isEmpty() ? null : collection.first();
                    if (field.isDependent()) {
                        console.warn("expect dependent resource to be in cache");
                        _this.storeDependent(field, value);
                    }
                    if (value == null) return null;
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                });
            default:
                console.error("unhandled relationship type: " + field.type);
                return $.Deferred().reject('unhandled relationship type');
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

            resource._save.catch(function() {
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

            _.each(self.dependentResources, function(related, fieldName) {
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

            if (this._fetch) return this._fetch;
            return this._fetch = Backbone.Model.prototype.fetch.call(this, options).then(()=>{
                this._fetch = null;
                return this;
            });
        },
        fetchIfNotPopulated: function() {
            var resource = this;
            // if already populated, return the resource
            if (resource.populated) return Promise.resolve(resource);

            // if can't be populate by fetching, return the resource
            if (resource.isNew()) return Promise.resolve(resource);

            // fetch and return a deferred.
            return resource.fetch();
        },
        fetchPromise(options){
            return this.fetchIfNotPopulated(options);
        },
        parse: function(_resp) {
            // since we are putting in data, the resourcgfse in now populated
            this.populated = true;
            return Backbone.Model.prototype.parse.apply(this, arguments);
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
                    options.url = querystring.format(
                        options.url || resource.url(),
                        {recordsetid: resource.recordsetid});
                }
                break;
            }
            return Backbone.sync(method, resource, options);
        },
        async getResourceAndField(fieldName) {
            return getResourceAndField(this, fieldName);
        },
        placeInSameHierarchy: function(other) {
            var self = this;
            var myPath = self.specifyModel.getScopingPath();
            var otherPath = other.specifyModel.getScopingPath();
            if (!myPath || !otherPath) return null;
            if (myPath.length > otherPath.length) return null;
            var diff = _(otherPath).rest(myPath.length - 1).reverse();
            return other.rget(diff.join('.')).then(function(common) {
                self.set(_(diff).last(), common.url());
            });
        },
        getDependentResource(fieldName){
            return this.dependentResources[fieldName.toLowerCase()];
        }
    }, {
        fromUri: function(uri, options) {
            const model = resourceFromUri(uri, options);
            assert(model.specifyModel === this.specifyModel);
            return model;
        },
    });

export default ResourceBase;

export function promiseToXhr(promise) {
  promise.done = function (fn) {
    return promiseToXhr(promise.then(fn));
  };
  promise.fail = function (fn) {
    return promiseToXhr(promise.then(null, fn));
  };
  promise.complete = function (fn) {
    return promiseToXhr(promise.then(fn, fn));
  };
  return promise;
}
