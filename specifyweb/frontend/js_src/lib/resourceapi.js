import _ from 'underscore';
import {Backbone} from './backbone';

import {assert} from './assert';
import {globalEvents} from './specifyapi';
import {getResourceViewUrl, parseResourceUrl} from './resource';
import {getResourceAndField} from './components/resource';
import {hijackBackboneAjax} from './startapp';
import {Http} from './ajax';
import {schema} from './schema';
import {formatUrl} from './querystring';

function eventHandlerForToOne(related, field) {
        return function(event) {
            var args = _.toArray(arguments);

            switch (event) {
            case 'saverequired':
                this.handleChanged();
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
                this.handleChanged();
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


    export const ResourceBase = Backbone.Model.extend({
        __name__: "ResourceBase",
        populated: false,   // indicates if this resource has data
        _fetch: null,       // stores reference to the ajax deferred while the resource is being fetched
        needsSaved: false,  // set when a local field is changed
        _save: null,        // stores reference to the ajax deferred while the resource is being saved
        _ignoreChanges: false,  // Don't trigger saveRequried when setting default values

        constructor() {
            this.specifyModel = this.constructor.specifyModel;
            this.dependentResources = {};   // references to related objects referred to by field in this resource
            Backbone.Model.apply(this, arguments); // TODO: check if this is necessary
        },
        initialize(attributes, options) {
            this.noBusinessRules = options && options.noBusinessRules;
            this.noValidation = options && options.noValidation;

            // if initialized with some attributes that include a resource_uri,
            // assume that represents all the fields for the resource
            if (attributes && _(attributes).has('resource_uri')) this.populated = true;

            // the resource needs to be saved if any of its fields change
            // unless they change because the resource is being fetched
            // or updated during a save
            this.on('change', function() {
                if (!this._fetch && !this._save) {
                    this.handleChanged();
                    this.trigger('saverequired');
                }
            });

            globalEvents.trigger('initResource', this);
            if(this.isNew())
                globalEvents.trigger('newResource', this);
        },
        /*
         * This is encapsulated into a separate function so that can set a
         * breakpoint in a single place
         */
        handleChanged(){
            this.needsSaved = true;
        },
        async clone() {
            var self = this;
            var newResource = Backbone.Model.prototype.clone.call(self);
            delete newResource.id;
            delete newResource.attributes.id;
            newResource.needsSaved = self.needsSaved;
            newResource.recordsetid = self.recordsetid;

            await Promise.all(Object.entries(self.dependentResources).map(async ([fieldName,related])=>{
                var field = self.specifyModel.getField(fieldName);
                switch (field.type) {
                case 'many-to-one':
                    // many-to-one wouldn't ordinarily be dependent, but
                    // this is the case for paleocontext. really more like
                    // a one-to-one.
                    newResource.set(fieldName, await related?.clone());
                    break;
                case 'one-to-many':
                    await newResource.rget(fieldName).then((newCollection)=>
                        Promise.all(related.models.map(async (resource)=>newCollection.add(await resource?.clone())))
                    );
                    break;
                case 'zero-to-one':
                    newResource.set(fieldName, await related?.clone());
                    break;
                default:
                    throw new Error('unhandled relationship type');
                }
            }));
            return newResource;
        },
        url() {
            // returns the api uri for this resource. if the resource is newly created
            // (no id), return the uri for the collection it belongs to
            // If url form changes, see idFromUrl method
            var url = '/api/specify/' + this.specifyModel.name.toLowerCase() + '/' +
                (!this.isNew() ? (this.id + '/') : '');
            return this.recordsetid == null ? url :
                formatUrl(url, {recordSetId: this.recordsetid});
        },
        viewUrl() {
            // returns the url for viewing this resource in the UI
            if (!_.isNumber(this.id)) console.error("viewUrl called on resource w/out id", this);
            return getResourceViewUrl(this.specifyModel.name, this.id, this.recordsetid);
        },
        get(attribute) {
            // case insensitive
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        storeDependent(field, related) {
            assert(field.isDependent());
            var setter = (field.type === 'one-to-many') ? "_setDependentToMany" : "_setDependentToOne";
            this[setter](field, related);
        },
        _setDependentToOne(field, related) {
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
        _setDependentToMany(field, toMany) {
            var oldToMany = this.dependentResources[field.name.toLowerCase()];
            oldToMany && oldToMany.off("all", null, this);

            // cache it and set up event handlers
            this.dependentResources[field.name.toLowerCase()] = toMany;
            toMany.on('all', eventHandlerForToMany(toMany, field), this);
        },
        set(key, value, options) {
            // Set may get called with "null" or "undefined"
            const newValue = value ?? undefined;
            const oldValue = typeof key === 'string'
              ? this.attributes[key.toLowerCase()] ??
                this.dependentResources[key.toLowerCase()] ?? undefined
              : undefined;
            // Don't needlessly trigger unload protect if value didn't change
            if (
              typeof key === 'string' &&
              typeof (oldValue??'') !== 'object' &&
              typeof (newValue??'') !== 'object' &&
              (oldValue === newValue ||
                /*
                 * Do a shallow comparison if value changed from string to
                 * number (back-end sends certain numeric fields as strings.
                 * Front-end converts those to numbers)
                 * TODO: this logic should be moved to this.parse()
                 */
                (typeof oldValue === 'string' &&
                  typeof newValue === 'number' &&
                  Number.parseInt(oldValue) === newValue))
            )
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
        _handleField(value, fieldName) {
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
        _handleInlineDataOrResource(value, fieldName) {
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
                    console.warn("got unexpected inline data for independent collection field",{collection:this,field,value});
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
        _handleUri(value, fieldName) {
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
        async rget(fieldName, prePop) {
            return this.getRelated(fieldName, {prePop: prePop});
        },
        // TODO: remove the need for this
        // Like "rget", but returns native promise
        async rgetPromise(fieldName, prePop = true) {
            return this.getRelated(fieldName, {prePop: prePop})
              // getRelated may return either undefined or null (yuk)
              .then(data=>typeof data === 'undefined' ? null : data);
        },
        // Duplicate definition for purposes of better typing:
        async rgetCollection(fieldName) {
            return this.getRelated(fieldName, {prePop: true});
        },
        async getRelated(fieldName, options) {
            options || (options = {
                prePop: false,
                noBusinessRules: false
            });
            var path = _(fieldName).isArray()? fieldName : fieldName.split('.');

            // first make sure we actually have this object.
            return this.fetch().then(function(_this) {
                return _this._rget(path, options);
            }).then(function(value) {
                // if the requested value is fetchable, and prePop is true,
                // fetch the value, otherwise return the unpopulated resource
                // or collection
                if (options.prePop) {
                    if (!value) return value; // ok if the related resource doesn't exist
                    else if (typeof value.fetchIfNotPopulated === 'function')
                        return value.fetchIfNotPopulated();
                    else if (typeof value.fetch === 'function')
                        return value.fetch();
                }
                return value;
            });
        },
        async _rget(path, options) {
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
                    return Promise.reject("can't traverse into a collection using dot notation");
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
                return Promise.reject('unhandled relationship type');
            }
        },
        save(conflictCallback) {
            var resource = this;
            if (resource._save) {
                throw new Error('resource is already being saved');
            }
            var didNeedSaved = resource.needsSaved;
            resource.needsSaved = false;

            let errorHandled = false;
            const save = ()=>Backbone.Model.prototype.save.apply(resource, [])
              .then(()=>resource.trigger('saved'));
            resource._save =
              typeof conflictCallback === 'function'
                ? hijackBackboneAjax([Http.OK, Http.CONFLICT, Http.CREATED], save, (status) =>{
                      if(status === Http.CONFLICT) {
                          conflictCallback()
                          errorHandled = true;
                      }
                  })
                : save();

            resource._save.catch(function(error) {
                resource._save = null;
                resource.needsSaved = didNeedSaved;
                didNeedSaved && resource.trigger('saverequired');
                if(typeof conflictCallback === 'function' && errorHandled)
                    Object.defineProperty(error, 'handledBy', {
                      value: conflictCallback,
                    });
                throw error;
            }).then(function() {
                resource._save = null;
            });

            return resource._save.then(()=>resource);
        },
        toJSON() {
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
        // Caches a reference to Promise so as not to start fetching twice
        async fetch(options) {
            if(
              // if already populated
              this.populated ||
              // or if can't be populated by fetching
              this.isNew()
            )
                return Promise.resolve(this);
            else if (this._fetch) return this._fetch;
            else
                return this._fetch = Backbone.Model.prototype.fetch.call(this, options).then(()=>{
                    this._fetch = null;
                    return this;
                });
        },
        parse(_resp) {
            // Since we are putting in data, the resource in now populated
            this.populated = true;
            return Backbone.Model.prototype.parse.apply(this, arguments);
        },
        async sync(method, resource, options) {
            options = options || {};
            switch (method) {
            case 'delete':
                // when deleting we don't send any data so put the version in a header
                options.headers = {'If-Match': resource.get('version')};
                break;
            case 'create':
                // use the special recordSetId field to add the resource to a record set
                if (!_.isUndefined(resource.recordSetId)) {
                    options.url = formatUrl(
                        options.url || resource.url(),
                        {recordSetId: resource.recordsetid});
                }
                break;
            }
            return Backbone.sync(method, resource, options);
        },
        async getResourceAndField(fieldName) {
            return getResourceAndField(this, fieldName);
        },
        placeInSameHierarchy(other) {
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
        fromUri(uri, options) {
            const parsed = parseResourceUrl(uri);
            if (typeof parsed === 'undefined') return undefined;
            const [tableName, id] = parsed;
            const model = new schema.models[tableName].Resource(
               { id },
              options
            );
            assert(model.specifyModel === this.specifyModel);
            return model;
        },
    });

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
