"use strict";

import $ from 'jquery';
import _ from 'underscore';
import Backbone from './backbone';
import {assert} from './assert';
import {deferredToPromise} from './resourceapi';


var Base =  Backbone.Collection.extend({
        __name__: "CollectionBase",
        getTotalCount: function() { return $.when(this.length); }
    });

    function notSupported() { throw new Error("method is not supported"); }

    function fakeFetch() {
        console.error("fetch called on", this);
        return $.when(null);
    }

    var collectionapi = {};

    function setupToOne(collection, options) {
        collection.field = options.field;
        collection.related = options.related;

        assert(collection.field.model === collection.model.specifyModel, "field doesn't belong to model");
        assert(collection.field.relatedModel === collection.related.specifyModel, "field is not to related resource");
    }

    collectionapi.Dependent = Base.extend({
        __name__: "DependentCollectionBase",
        constructor: function(models, options) {
            assert(_.isArray(models));
            Base.call(this, models, options);
        },
        initialize: function(_models, options) {
            this.on('add remove', function() {
                this.trigger('saverequired');
            }, this);

            setupToOne(this, options);

            // If the id of the related resource changes, we go through and update
            // all the objects that point to it with the new pointer.
            // This is to support having collections of objects attached to
            // newly created resources that don't have ids yet. When the
            // resource is saved, the related objects can have their FKs
            // set correctly.
            this.related.on('change:id', function() {
                var relatedUrl = this.related.url();
                _.chain(this.models).compact().invoke('set', this.field.name, relatedUrl);
            }, this);
        },
        isComplete: function() { return true; },
        fetch: fakeFetch,
        sync: notSupported,
        create: notSupported
    });

    collectionapi.Lazy = Base.extend({
        __name__: "LazyCollectionBase",
        _neverFetched: true,
        constructor: function(options) {
            options || (options = {});
            Base.call(this, null, options);
            this.filters = options.filters || {};
            this.domainfilter = !!options.domainfilter;
        },
        url: function() {
            return '/api/specify/' + this.model.specifyModel.name.toLowerCase() + '/';
        },
        isComplete: function() {
            return this.length === this._totalCount;
        },
        parse: function(resp) {
            var objects;
            if (resp.meta) {
                this._totalCount = resp.meta.total_count;
                objects = resp.objects;
            } else {
                console.warn("expected 'meta' in response");
                this._totalCount = resp.length;
                objects = resp;
            }

            return objects;
        },
        fetch: function(options) {
            var self = this;
            self.neverFetched = false;

            if (self._fetch) throw new Error('already fetching');

            if (self.isComplete()) {
                console.error("fetching for already filled collection");
            }

            options || (options =  {});

            options.update = true;
            options.remove = false;
            options.silent = true;
            assert(options.at == null);

            options.data = options.data || _.extend({domainfilter: self.domainfilter}, self.filters);
            options.data.offset = self.length;

            _(options).has('limit') && ( options.data.limit = options.limit );
            self._fetch = Backbone.Collection.prototype.fetch.call(self, options);
            return self._fetch.then(function() { self._fetch = null; return self; });
        },
        fetchPromise(options){
            return deferredToPromise(this.fetch(options));
        },
        fetchIfNotPopulated: function() {
            var _this = this;
            return (this._neverFetched ? this.fetch() : $.when(null)).pipe(function() {
                return _this;
            });
        },
        getTotalCount: function() {
            if (_.isNumber(this._totalCount)) return $.when(this._totalCount);
            return this.fetchIfNotPopulated().pipe(function(_this) {
                return _this._totalCount;
            });
        }
    });

    collectionapi.ToOne = collectionapi.Lazy.extend({
        __name__: "LazyToOneCollectionBase",
        initialize: function(_models, options) {
            setupToOne(this, options);
        },
        fetch: function() {
            if (this.related.isNew()) {
                throw new Error("can't fetch collection related to unpersisted resource");
            }
            this.filters[this.field.name.toLowerCase()] = this.related.id;
            return collectionapi.Lazy.prototype.fetch.apply(this, arguments);
        }
    });

    export default collectionapi;