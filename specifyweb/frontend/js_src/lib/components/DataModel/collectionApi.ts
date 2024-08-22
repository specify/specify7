// @ts-nocheck

import _ from 'underscore';
import { removeKey } from '../../utils/utils';

import { assert } from '../Errors/assert';
import { formatUrl } from '../Router/queryString';
import { Backbone } from './backbone';
import { AnySchema } from './helperTypes';
import { SpecifyResource } from './legacyTypes';

// REFACTOR: remove @ts-nocheck

const Base = Backbone.Collection.extend({
  __name__: 'CollectionBase',
  async getTotalCount() {
    return this.length;
  },
});

export const isRelationshipCollection = (value: unknown): boolean =>
  value instanceof DependentCollection ||
  value instanceof IndependentCollection;

function notSupported() {
  throw new Error('method is not supported');
}

async function fakeFetch() {
  return this;
}

function setupToOne(collection, options) {
  collection.field = options.field;
  collection.related = options.related;

  assert(
    collection.field.table === collection.table.specifyTable,
    "field doesn't belong to table"
  );
  assert(
    collection.field.relatedTable === collection.related.specifyTable,
    'field is not to related resource'
  );
}

export const DependentCollection = Base.extend({
  __name__: 'DependentCollectionBase',
  constructor(options, records = []) {
    this.table = this.model;
    assert(_.isArray(records));
    Base.call(this, records, options);
  },
  initialize(_tables, options) {
    this.on(
      'add remove',
      function () {
        /*
         * Warning: changing a collection record does not trigger a
         * change event in the parent (though it probably should)
         */
        this.trigger('saverequired');
      },
      this
    );

    setupToOne(this, options);

    /*
     * If the id of the related resource changes, we go through and update
     * all the objects that point to it with the new pointer.
     * This is to support having collections of objects attached to
     * newly created resources that don't have ids yet. When the
     * resource is saved, the related objects can have their foreign keys
     * set correctly.
     */
    this.related.on(
      'change:id',
      function () {
        const relatedUrl = this.related.url();
        _.chain(this.models)
          .compact()
          .invoke('set', this.field.name, relatedUrl);
      },
      this
    );
  },
  isComplete() {
    return true;
  },
  fetch: fakeFetch,
  sync: notSupported,
  create: notSupported,
});

export const IndependentCollection = Base.extend({
  __name__: 'IndependentCollectionBase',
  constructor(options, records = []) {
    this.table = this.model;
    assert(_.isArray(records));
    Base.call(this, records, options);
    this.filters = options.filters || {};
    this.domainfilter =
      Boolean(options.domainfilter) &&
      this.model?.specifyTable.getScopingRelationship() !== undefined;

    this.changedResources = Object.fromEntries(
      records.map((record) => [record.cid, false])
    );
  },
  initialize(_tables, options) {
    this.on(
      'change',
      function (resource: SpecifyResource<AnySchema>) {
        if (!resource.isBeingInitialized())
          this.changedResources[resource.cid] = true;
        this.trigger('saverequired');
      },
      this
    );
    this.on(
      'add remove',
      function (resource: SpecifyResource<AnySchema>) {
        this.changedResources[resource.cid] = false;
        this.trigger('saverequired');
      },
      this
    );

    setupToOne(this, options);
  },
  url() {
    return `/api/specify/${this.model.specifyTable.name.toLowerCase()}/`;
  },
  parse(resp) {
    let records;
    if (resp.meta) {
      records = resp.objects;
    } else {
      console.warn("expected 'meta' in response");
      records = resp;
    }
    return records;
  },
  async fetch(options) {
    if (this.related.isNew()) {
      return this;
    }

    this.filters[this.field.name.toLowerCase()] = this.related.id;
    if (this._fetch) return this._fetch;

    options = { ...(options ?? {}), silent: true };

    assert(options.at == null);

    options.data = options.data || {
      ...this.filters,
      domainfilter: this.domainfilter,
      limit: options.limit,
    };

    this._fetch = Backbone.Collection.prototype.fetch.call(this, options);
    return this._fetch.then(() => {
      this._fetch = null;
      return this;
    });
  },
  isComplete() {
    return true;
  },
  toApiJSON(options) {
    const self = this;
    const resources =
      Object.keys(self.changedResources).length === 0
        ? formatUrl(this.url(), this.filters)
        : this.map(function (resource) {
            return self.changedResources[resource.cid] === true
              ? resource.toJSON(options)
              : resource.url();
          });
    this.changedResources = [];
    return resources;
  },
});

export const LazyCollection = Base.extend({
  __name__: 'LazyCollectionBase',
  _neverFetched: true,
  constructor(options = {}) {
    this.table = this.model;
    Base.call(this, null, options);
    this.filters = options.filters || {};
    this.domainfilter =
      Boolean(options.domainfilter) &&
      this.model?.specifyTable.getScopingRelationship() !== undefined;
  },
  url() {
    return `/api/specify/${this.model.specifyTable.name.toLowerCase()}/`;
  },
  isComplete() {
    return this.length === this._totalCount;
  },
  parse(resp) {
    let objects;
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
  async fetch(options) {
    this._neverFetched = false;

    if (this._fetch) return this._fetch;
    else if (this.isComplete() || this.related?.isNew()) return this;

    if (this.isComplete())
      console.error('fetching for already filled collection');

    options ||= {};

    options.update = true;
    options.remove = false;
    options.silent = true;
    assert(options.at == null);

    options.data =
      options.data ||
      _.extend({ domainfilter: this.domainfilter }, this.filters);
    options.data.offset = this.length;

    _(options).has('limit') && (options.data.limit = options.limit);
    this._fetch = Backbone.Collection.prototype.fetch.call(this, options);
    return this._fetch.then(() => {
      this._fetch = null;
      return this;
    });
  },
  async fetchIfNotPopulated() {
    return this._neverFetched && this.related?.isNew() !== true
      ? this.fetch()
      : this;
  },
  getTotalCount() {
    if (_.isNumber(this._totalCount)) return Promise.resolve(this._totalCount);
    return this.fetchIfNotPopulated().then((_this) => _this._totalCount);
  },
});

export const ToOneCollection = LazyCollection.extend({
  __name__: 'LazyToOneCollectionBase',
  initialize(_models, options) {
    setupToOne(this, options);
  },
  async fetch() {
    if (this.related.isNew()) {
      console.error("can't fetch collection related to unpersisted resource");
      return this;
    }
    this.filters[this.field.name.toLowerCase()] = this.related.id;
    return Reflect.apply(LazyCollection.prototype.fetch, this, arguments);
  },
});
