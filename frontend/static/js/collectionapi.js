define([
    'jquery', 'underscore', 'backbone', 'whenall', 'assert', 'jquery-bbq'
], function($, _, Backbone, whenAll, assert) {
    "use strict";

    var Base =  Backbone.Collection.extend({
        __name__: "CollectionBase",
        hasData: false,
        isComplete: false,
        blockSize: 20,

        initialize: function(models, options) {
            this.queryParams = {}; // these define the filters on the collection
            this.options = _({}).extend(options);
            this.isToOne() && this._initToOne();
            this.isDependent = this.options.dependent || false;
            this.isDependent && assert(this.isToOne(), "only to-one collections can be dependent");
            this.limit = this.options.limit;

            if (models) {
                this.hasData = true;
                this.isComplete = true;
            }

            this.on('add remove', function() {
                this.trigger('saverequired');
            }, this);
        },
        isToOne: function() {
            return _(this.options).has('related');
        },
        _initToOne: function () {
            this.field = this.options.field;
            this.related = this.options.related;

            assert(this.field.model === this.model.specifyModel, "field doesn't belong to model");
            assert(this.field.getRelatedModel() === this.related.specifyModel, "field is not to related resource");

            // If the id of the related resource changes, we go through and update
            // all the objects that point to it with the new pointer.
            // This is to support having collections of objects attached to
            // newly created resources that don't have ids yet. When the
            // resource is saved, the related objects can have their FKs
            // set correctly.
            this.isDependent && this.related.on('change:id', function() {
                var relatedUrl = this.related.url();
                _.chain(this.models).compact().invoke('set', this.field.name, relatedUrl);
            }, this);
        },
        url: function() {
            return '/api/specify/' + this.model.specifyModel.name.toLowerCase() + '/';
        },
        parse: function(resp, xhr) {
            var objects;
            if (resp.meta) {
                this.totalCount = resp.meta.total_count;
                this.meta = resp.meta;
                if (resp.objects.length === this.totalCount) this.isComplete = true;
                objects = resp.objects;
            } else {
                console.warn("expected 'meta' in response");
                this.totalCount = resp.length;
                this.isComplete = true;
                objects = resp;
            }

            this.hasData = true;
            return objects;
        },
        fetchIfNotPopulated: function () {
            var collection = this;
            // a new collection is used for to-many collections related to new resources
            if (this.isDependent && this.related.isNew()) return $.when(collection);
            if (this._fetch) return this._fetch.pipe(function () { return collection; });

            return this.hasData ? $.when(collection) : this.fetch().pipe(function () { return collection; });
        },
        fetch: function(options) {
            var self = this;

            // block trying to fetch data for collections that represent new to-many collections
            if (self.isToOne()) {
                assert(this.related.id, "Can't fetch many-to-one collection for nonexistent resource.");
                this.queryParams[this.field.name.toLowerCase()] = this.related.id;
            }

            if (self._fetch) throw new Error('already fetching');

            if (self.isComplete) {
                console.error("fetching for already filled collection");
            }

            options = options || {};


            options.update = true;
            options.remove = false;
            options.silent = true;
            options.at = _.isUndefined(options.at) ? self.length : options.at;

            if (_.isNumber(self.limit)) {
                assert(options.at === 0, "only fetching at beginning of collection is allowed with limit parameter");
                options.limit = self.limit;
            }

            options.data = options.data || _.extend({}, self.queryParams);
            options.data.offset = options.at;
            if (_(options).has('limit')) options.data.limit = options.limit;
            self._fetch = Backbone.Collection.prototype.fetch.call(self, options);
            return self._fetch.then(function() { self._fetch = null; });
        },
        abortFetch: function() {
            if (!this._fetch) return;
            this._fetch.abort();
            this._fetch = null;
        },
        at: function(index, deferred) {
            assert(this.isComplete || deferred, "'at' on incomplete collections must be deferred");
            if (!deferred) return Backbone.Collection.prototype.at.call(this, index);

            if (index >= this.totalCount) return $.when(undefined);
            var model = this.models[index];
            if (model) return $.when(model);

            var _this = this;
            if (this._fetch) return this._fetch.pipe(_.defer(function() { return _this.at(index, true); }));

            var offset = index - index % this.blockSize;
            return this.fetch({ at: offset, limit: this.blockSize }).pipe(_.defer(function() {
                return _this.at(index, true);
            }));
        },
        add: function(models, options) {
            options = options || {};
            options.at = _.isUndefined(options.at) ? this.length : options.at;
            models = _.isArray(models) ? models.slice() : [models];
            if (this.totalCount) {
                if (this.models.length < this.totalCount) this.models[this.totalCount-1] = undefined;
                this.models.splice(options.at, models.length);
                this.length = this.models.length;
            }
            return Backbone.Collection.prototype.add.apply(this, arguments);
        },
        getTotalCount: function() {
            var self = this;
            if (self.isToOne() && self.related.isNew()) return $.when(self.length);
            if (self._fetch) return self._fetch.pipe(function() { return self.totalCount; });
            return self.fetchIfNotPopulated().pipe(function() { return self.totalCount; });
        }
    });

    var Query = Base.extend({
        __name__: "QueryCollectionBase",
        constructor: function(options) {
            Base.call(this, null, options);
            this.filters = options.filters || {};
        },
        fetch: function() {
            _(this.queryParams).extend(this.filters);
            return Base.prototype.fetch.apply(this, arguments);
        }
    });

    return { Base: Base, Query: Query };
});
