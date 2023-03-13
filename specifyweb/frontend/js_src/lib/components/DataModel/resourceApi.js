import _ from 'underscore';

import {hijackBackboneAjax} from '../../utils/ajax/backboneAjax';
import {Http} from '../../utils/ajax/definitions';
import {removeKey} from '../../utils/utils';
import {assert} from '../Errors/assert';
import {softFail} from '../Errors/Crash';
import {Backbone} from './backbone';
import {attachBusinessRules} from './businessRules';
import {initializeResource} from './domain';
import {
    getFieldsToNotClone,
    getResourceApiUrl,
    getResourceViewUrl,
    resourceEvents,
    resourceFromUrl
} from './resource';

function eventHandlerForToOne(related, field) {
        return function(event) {
            const args = _.toArray(arguments);

            switch (event) {
            case 'saverequired': {
                this.handleChanged();
                this.trigger.apply(this, args);
                return;
            }
            case  'change:id': {
                this.set(field.name, related.url());
                return;
            }
            case 'changing': {
                this.trigger.apply(this, args);
                return;
            }
            }

            // Pass change:field events up the tree, updating fields with dot notation
            const match = /^r?(change):(.*)$/.exec(event);
            if (match) {
                args[0] = `r${  match[1]  }:${  field.name.toLowerCase()  }.${  match[2]}`;
                this.trigger.apply(this, args);
            }
        };
    }

    function eventHandlerForToMany(_related, field) {
        return function(event) {
            const args = _.toArray(arguments);
            switch (event) {
            case 'changing': {
                this.trigger.apply(this, args);
                break;
            }
            case 'saverequired': {
                this.handleChanged();
                this.trigger.apply(this, args);
                break;
            }
            case 'add':
            case 'remove': {
                // Annotate add and remove events with the field in which they occured
                args[0] = `${event  }:${  field.name.toLowerCase()}`;
                this.trigger.apply(this, args);
                break;
            }
            }};
    }


    export const ResourceBase = Backbone.Model.extend({
        __name__: "ResourceBase",
        populated: false,   // Indicates if this resource has data
        _fetch: null,       // Stores reference to the ajax deferred while the resource is being fetched
        needsSaved: false,  // Set when a local field is changed
        _save: null,        // Stores reference to the ajax deferred while the resource is being saved

        constructor() {
            this.specifyModel = this.constructor.specifyModel;
            this.dependentResources = {};   // References to related objects referred to by field in this resource
            Reflect.apply(Backbone.Model, this, arguments); // TEST: check if this is necessary
        },
        initialize(attributes, options) {
            this.noBusinessRules = options && options.noBusinessRules;
            this.noValidation = options && options.noValidation;

            /*
             * If initialized with some attributes that include a resource_uri,
             * assume that represents all the fields for the resource
             */
            if (attributes && _(attributes).has('resource_uri')) this.populated = true;

            /*
             * The resource needs to be saved if any of its fields change
             * unless they change because the resource is being fetched
             * or updated during a save
             */
            this.on('change', function() {
                if (!this._fetch && !this._save) {
                    this.handleChanged();
                    this.trigger('saverequired');
                }
            });

            if(!this.noBusinessRules)
                attachBusinessRules(this);
            if(this.isNew())
                initializeResource(this);
            /*
             * Business rules may set some fields on resource creation
             * Those default values should not trigger unload protect
             */
            this.needsSaved = false;
        },
        /*
         * This is encapsulated into a separate function so that can set a
         * breakpoint in a single place
         */
        handleChanged(){
            this.needsSaved = true;
        },
        async clone(cloneAll = false) {
            const self = this;

            const exemptFields = getFieldsToNotClone(this.specifyModel, cloneAll).map(fieldName=>fieldName.toLowerCase());

            const newResource = new this.constructor(
              removeKey(
                this.attributes,
                'resource_uri',
                'id',
                ...exemptFields
              )
            );

            newResource.needsSaved = self.needsSaved;

            await Promise.all(Object.entries(self.dependentResources).map(async ([fieldName,related])=>{
                if(exemptFields.includes(fieldName)) return;
                const field = self.specifyModel.getField(fieldName);
                switch (field.type) {
                case 'many-to-one': {
                    /*
                     * Many-to-one wouldn't ordinarily be dependent, but
                     * this is the case for paleocontext. really more like
                     * a one-to-one.
                     */
                    newResource.set(fieldName, await related?.clone(cloneAll));
                    break;
                }
                case 'one-to-many': {
                    await newResource.rget(fieldName).then(async (newCollection)=>
                        Promise.all(related.models.map(async (resource)=>newCollection.add(await resource?.clone(cloneAll))))
                    );
                    break;
                }
                case 'zero-to-one': {
                    newResource.set(fieldName, await related?.clone(cloneAll));
                    break;
                }
                default: {
                    throw new Error('unhandled relationship type');
                }
                }
            }));
            return newResource;
        },
        url() {
            return getResourceApiUrl(this.specifyModel.name, this.id);
        },
        viewUrl() {
            // Returns the url for viewing this resource in the UI
            if (!_.isNumber(this.id)) softFail(new Error("viewUrl called on resource without id"), this);
            return getResourceViewUrl(this.specifyModel.name, this.id);
        },
        get(attribute) {
            if(attribute.toLowerCase() === this.specifyModel.idField.name.toLowerCase())
                return this.id;
            // Case insensitive
            return Backbone.Model.prototype.get.call(this, attribute.toLowerCase());
        },
        storeDependent(field, related) {
            assert(field.isDependent());
            const setter = (field.type === 'one-to-many') ? "_setDependentToMany" : "_setDependentToOne";
            this[setter](field, related);
        },
        _setDependentToOne(field, related) {
            const oldRelated = this.dependentResources[field.name.toLowerCase()];
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
            related.parent = this;  // REFACTOR: this doesn't belong here

            switch (field.type) {
            case 'one-to-one':
            case 'many-to-one': {
                this.dependentResources[field.name.toLowerCase()] = related;
                break;
            }
            case 'zero-to-one': {
                this.dependentResources[field.name.toLowerCase()] = related;
                related.set(field.otherSideName, this.url()); // REFACTOR: this logic belongs somewhere else. up probably
                break;
            }
            default: {
                throw new Error(`setDependentToOne: unhandled field type: ${  field.type}`);
            }
            }
        },
        _setDependentToMany(field, toMany) {
            const oldToMany = this.dependentResources[field.name.toLowerCase()];
            oldToMany && oldToMany.off("all", null, this);

            // Cache it and set up event handlers
            this.dependentResources[field.name.toLowerCase()] = toMany;
            toMany.on('all', eventHandlerForToMany(toMany, field), this);
        },
        set(key, value, options) {
            // This may get called with "null" or "undefined"
            const newValue = value ?? undefined;
            const oldValue = typeof key === 'string'
              ? this.attributes[key.toLowerCase()] ??
                this.dependentResources[key.toLowerCase()] ?? undefined
              : undefined;
            // Don't needlessly trigger unload protect if value didn't change
            if (
              typeof key === 'string' &&
              typeof (oldValue??'') !== 'object' &&
              typeof (newValue??'') !== 'object'
            ) {
                if (oldValue === newValue) return this;
                else if(
                  /*
                   * Don't trigger unload protect if:
                   *  - value didn't change
                   *  - value changed from string to number (back-end sends
                   *    decimal numeric fields as string. Front-end converts
                   *    those to numbers)
                   *  - value was trimmed
                   * REFACTOR: this logic should be moved to this.parse()
                   * TEST: add test for "5A" case
                   */
                  oldValue?.toString() === newValue?.toString().trim()
                )
                    options ??= {silent: true};
            }
            // Make the keys case insensitive
            const attributes = {};
            if (_.isObject(key) || key == null) {
                /*
                 * In the two argument case, so
                 * "key" is actually an object mapping keys to values
                 */
                _(key).each((value, key) => { attributes[key.toLowerCase()] = value; });
                // And the options are actually in "value" argument
                options = value;
            } else {
                // Three argument case
                attributes[key.toLowerCase()] = value;
            }

            /*
             * Need to set the id right away if we have it because
             * relationships depend on it
             */
            if ('id' in attributes) {
                attributes.id = attributes.id && Number.parseInt(attributes.id);
                this.id = attributes.id;
            }

            const adjustedAttributes = _.reduce(attributes, (accumulator, value, fieldName) => {
                const [newFieldName, newValue] = this._handleField(value, fieldName);
                return _.isUndefined(newValue) ? accumulator : Object.assign(accumulator, {[newFieldName]: newValue});
            }, {});

            return Backbone.Model.prototype.set.call(this, adjustedAttributes, options);
        },
        _handleField(value, fieldName) {
            if(fieldName === '_tablename') return ['_tablename', undefined];
            if (_(['id', 'resource_uri', 'recordset_info']).contains(fieldName)) return [fieldName, value]; // Special fields

            const field = this.specifyModel.getField(fieldName);
            if (!field) {
                console.warn("setting unknown field", fieldName, "on",
                             this.specifyModel.name, "value is", value);
                return [fieldName, value];
            }

            fieldName = field.name.toLowerCase(); // In case field name is an alias.

            if (field.isRelationship) {
                value = _.isString(value)
                  ? this._handleUri(value, fieldName)
                  : (typeof value === 'number'
                  ? this._handleUri(
                      // Back-end sends SpPrincipal.scope as a number, rather than as a URL
                      getResourceApiUrl(field.model.name, value),
                      fieldName
                    )
                  : this._handleInlineDataOrResource(value, fieldName));
            }
            return [fieldName, value];
        },
        _handleInlineDataOrResource(value, fieldName) {
            // BUG: check type of value
            const field = this.specifyModel.getField(fieldName);
            const relatedModel = field.relatedModel;
            // BUG: don't do anything for virtual fields

            switch (field.type) {
            case 'one-to-many': {
                // Should we handle passing in an schema.Model.Collection instance here??
                const collectionOptions = { related: this, field: field.getReverse() };

                if (field.isDependent()) {
                    const collection = new relatedModel.DependentCollection(collectionOptions, value);
                    this.storeDependent(field, collection);
                } else {
                    console.warn("got unexpected inline data for independent collection field",{collection:this,field,value});
                }

                // Because the foreign key is on the other side
                this.trigger(`change:${  fieldName}`, this);
                this.trigger('change', this);
                return undefined;
            }
            case 'many-to-one': {
                if (!value) { // BUG: tighten up this check.
                    // The FK is null, or not a URI or inlined resource at any rate
                    field.isDependent() && this.storeDependent(field, null);
                    return value;
                }

                const toOne = (value instanceof ResourceBase) ? value :
                    new relatedModel.Resource(value, {parse: true});

                field.isDependent() && this.storeDependent(field, toOne);
                this.trigger(`change:${  fieldName}`, this);
                this.trigger('change', this);
                return toOne.url();
            }  // The FK as a URI
            case 'zero-to-one': {
                /*
                 * This actually a one-to-many where the related collection is only a single resource
                 * basically a one-to-one from the 'to' side
                 */
                const oneTo = _.isArray(value) ?
                    (value.length === 0 ? null :
                     new relatedModel.Resource(_.first(value), {parse: true}))
                : (value || null);  // In case it was undefined

                assert(oneTo == null || oneTo instanceof ResourceBase);

                field.isDependent() && this.storeDependent(field, oneTo);
                // Because the FK is on the other side
                this.trigger(`change:${  fieldName}`, this);
                this.trigger('change', this);
                return undefined;
            }
            }
            if(!field.isVirtual)
                softFail('Unhandled setting of relationship field', {fieldName,value,resource:this});
            return value;
        },
        _handleUri(value, fieldName) {
            const field = this.specifyModel.getField(fieldName);
            const oldRelated = this.dependentResources[fieldName];

            if (field.isDependent()) {
                console.warn("expected inline data for dependent field", fieldName, "in", this);
            }

            if (oldRelated && field.type ===  'many-to-one') {
                /*
                 * Probably should never get here since the presence of an oldRelated
                 * value implies a dependent field which wouldn't be receiving a URI value
                 */
                console.warn("unexpected condition");
                if (oldRelated.url() !== value) {
                    // The reference changed
                    delete this.dependentResources[fieldName];
                    oldRelated.off('all', null, this);
                }
            }
            return value;
        },
        /*
         * Get the value of the named field where the name may traverse related objects
         * using dot notation. if the named field represents a resource or collection,
         * then prePop indicates whether to return the named object or the contents of
         * the field that represents it
         */
        async rget(fieldName, prePop) {
            return this.getRelated(fieldName, {prePop});
        },
        /*
         * REFACTOR: remove the need for this
         * Like "rget", but returns native promise
         */
        async rgetPromise(fieldName, prePop = true) {
            return this.getRelated(fieldName, {prePop})
              // GetRelated may return either undefined or null (yuk)
              .then(data=>data === undefined ? null : data);
        },
        // Duplicate definition for purposes of better typing:
        async rgetCollection(fieldName) {
            return this.getRelated(fieldName, {prePop: true});
        },
        async getRelated(fieldName, options) {
            options ||= {
                prePop: false,
                noBusinessRules: false
            };
            const path = _(fieldName).isArray()? fieldName : fieldName.split('.');

            // First make sure we actually have this object.
            return this.fetch().then((_this) => _this._rget(path, options)).then((value) => {
                /*
                 * If the requested value is fetchable, and prePop is true,
                 * fetch the value, otherwise return the unpopulated resource
                 * or collection
                 */
                if (options.prePop) {
                    if (!value) return value; // Ok if the related resource doesn't exist
                    else if (typeof value.fetchIfNotPopulated === 'function')
                        return value.fetchIfNotPopulated();
                    else if (typeof value.fetch === 'function')
                        return value.fetch();
                }
                return value;
            });
        },
        async _rget(path, options) {
            let fieldName = path[0].toLowerCase();
            const field = this.specifyModel.getField(fieldName);
            field && (fieldName = field.name.toLowerCase()); // In case fieldName is an alias
            let value = this.get(fieldName);
            field || console.warn("accessing unknown field", fieldName, "in",
                                  this.specifyModel.name, "value is",
                                  value);

            /*
             * If field represents a value, then return that if we are done,
             * otherwise we can't traverse any farther...
             */
            if (!field || !field.isRelationship) {
                if (path.length > 1) {
                    softFail("expected related field");
                    return undefined;
                }
                return value;
            }

            const _this = this;
            const related = field.relatedModel;
            switch (field.type) {
            case 'one-to-one':
            case 'many-to-one': {
                // A foreign key field.
                if (!value) return value;  // No related object

                // Is the related resource cached?
                let toOne = this.dependentResources[fieldName];
                if (!toOne) {
                    _(value).isString() || softFail("expected URI, got", value);
                    toOne = resourceFromUrl(value, {noBusinessRules: options.noBusinessRules});
                    if (field.isDependent()) {
                        console.warn("expected dependent resource to be in cache");
                        this.storeDependent(field, toOne);
                    }
                }
                // If we want a field within the related resource then recur
                return (path.length > 1) ? toOne.rget(_.tail(path)) : toOne;
            }
            case 'one-to-many': {
                if (path.length !== 1) {
                    throw "can't traverse into a collection using dot notation";
                }

                // Is the collection cached?
                let toMany = this.dependentResources[fieldName];
                if (!toMany) {
                    const collectionOptions = { field: field.getReverse(), related: this };

                    if (!field.isDependent()) {
                        return new related.ToOneCollection(collectionOptions);
                    }

                    if (this.isNew()) {
                        toMany = new related.DependentCollection(collectionOptions, []);
                        this.storeDependent(field, toMany);
                        return toMany;
                    } else {
                        console.warn("expected dependent resource to be in cache");
                        const temporaryCollection = new related.ToOneCollection(collectionOptions);
                        return temporaryCollection.fetch({ limit: 0 }).then(() => new related.DependentCollection(collectionOptions, temporaryCollection.models)).then((toMany) => { _this.storeDependent(field, toMany); });
                    }
                }
            }
            case 'zero-to-one': {
                /*
                 * This is like a one-to-many where the many cannot be more than one
                 * i.e. the current resource is the target of a FK
                 */

                // Is it already cached?
                if (!_.isUndefined(this.dependentResources[fieldName])) {
                    value = this.dependentResources[fieldName];
                    if (value == null) return null;
                    // Recur if we need to traverse more
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                }

                // If this resource is not yet persisted, the related object can't point to it yet
                if (this.isNew()) return undefined; // TEST: this seems iffy

                const collection = new related.ToOneCollection({ field: field.getReverse(), related: this, limit: 1 });

                // Fetch the collection and pretend like it is a single resource
                return collection.fetchIfNotPopulated().then(() => {
                    const value = collection.isEmpty() ? null : collection.first();
                    if (field.isDependent()) {
                        console.warn("expect dependent resource to be in cache");
                        _this.storeDependent(field, value);
                    }
                    if (value == null) return null;
                    return (path.length === 1) ? value : value.rget(_.tail(path));
                });
            }
            default: {
                softFail(`unhandled relationship type: ${  field.type}`);
                throw 'unhandled relationship type';
            }
            }
        },
        save({onSaveConflict:handleSaveConflict,errorOnAlreadySaving=true}={}) {
            const resource = this;
            if (resource._save) {
                if(errorOnAlreadySaving)
                    throw new Error('resource is already being saved');
                else return resource._save;
            }
            const didNeedSaved = resource.needsSaved;
            resource.needsSaved = false;
            // BUG: should do this for dependent resources too

            let errorHandled = false;
            const save = ()=>Backbone.Model.prototype.save.apply(resource, [])
              .then(()=>resource.trigger('saved'));
            resource._save =
              typeof handleSaveConflict === 'function'
                ? hijackBackboneAjax([Http.OK, Http.CONFLICT, Http.CREATED], save, (status) =>{
                      if(status === Http.CONFLICT) {
                          handleSaveConflict()
                          errorHandled = true;
                      }
                  })
                : save();

            resource._save.catch((error) => {
                resource._save = null;
                resource.needsSaved = didNeedSaved;
                didNeedSaved && resource.trigger('saverequired');
                if(typeof handleSaveConflict === 'function' && errorHandled)
                    Object.defineProperty(error, 'handledBy', {
                      value: handleSaveConflict,
                    });
                throw error;
            }).then(() => {
                resource._save = null;
            });

            return resource._save.then(()=>resource);
        },
        async destroy(...args) {
            const promise = await Backbone.Model.prototype.destroy.apply(this, ...args);
            resourceEvents.trigger('deleted', this);
            return promise;
        },
        toJSON() {
            const self = this;
            const json = Backbone.Model.prototype.toJSON.apply(self, arguments);

            _.each(self.dependentResources, (related, fieldName) => {
                const field = self.specifyModel.getField(fieldName);
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
              // If already populated
              this.populated ||
              // Or if can't be populated by fetching
              this.isNew()
            )
                return this;
            else if (this._fetch) return this._fetch;
            else
                return this._fetch = Backbone.Model.prototype.fetch.call(this, options).then(()=>{
                    this._fetch = null;
                    // BUG: consider doing this.needsSaved=false here
                    return this;
                });
        },
        parse(_resp) {
            // Since we are putting in data, the resource in now populated
            this.populated = true;
            return Reflect.apply(Backbone.Model.prototype.parse, this, arguments);
        },
        async sync(method, resource, options) {
            options ||= {};
            if(method === 'delete')
                // When deleting we don't send any data so put the version in a header
                options.headers = {'If-Match': resource.get('version')};
            return Backbone.sync(method, resource, options);
        },
        async placeInSameHierarchy(other) {
            const self = this;
            const myPath = self.specifyModel.getScopingPath();
            const otherPath = other.specifyModel.getScopingPath();
            if (!myPath || !otherPath) return undefined;
            if (myPath.length > otherPath.length) return undefined;
            const diff = _(otherPath).rest(myPath.length - 1).reverse();
            return other.rget(diff.join('.')).then((common) => {
                if(common === undefined) return undefined;
                self.set(_(diff).last(), common.url());
                return common;
            });
        },
        getDependentResource(fieldName){
            return this.dependentResources[fieldName.toLowerCase()];
        }
    });

export function promiseToXhr(promise) {
  promise.done = function (function_) {
    return promiseToXhr(promise.then(function_));
  };
  promise.fail = function (function_) {
    return promiseToXhr(promise.then(null, function_));
  };
  promise.complete = function (function_) {
    return promiseToXhr(promise.then(function_, function_));
  };
  return promise;
}
