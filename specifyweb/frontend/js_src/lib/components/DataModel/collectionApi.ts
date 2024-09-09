// @ts-nocheck

import _ from 'underscore';

import { removeKey } from '../../utils/utils';
import { assert } from '../Errors/assert';
import { Backbone } from './backbone';
import type { AnySchema } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';

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
    options.data.offset = options.offset || this.length;

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

export const IndependentCollection = LazyCollection.extend({
  __name__: 'IndependentCollectionBase',
  constructor(options, records = []) {
    this.table = this.model;
    assert(_.isArray(records));
    Base.call(this, records, options);
    this.filters = options.filters || {};
    this.domainfilter =
      Boolean(options.domainfilter) &&
      this.model?.specifyTable.getScopingRelationship() !== undefined;

    this.removed = new Set<string>();
    this.updated = {};
  },
  initialize(_tables, options) {
    this.on(
      'change',
      function (resource: SpecifyResource<AnySchema>) {
        if (!resource.isBeingInitialized()) {
          this.updated[resource.cid] = resource;
          this.trigger('saverequired');
        }
      },
      this
    );

    this.on(
      'add',
      function (resource: SpecifyResource<AnySchema>) {
        if (!resource.isNew()) {
          (this.removed as Set<string>).delete(resource.url());
          this.updated[resource.cid] = resource.url();
        } else {
          this.updated[resource.cid] = resource;
        }
        this._totalCount += 1;
        this.trigger('saverequired');
      },
      this
    );

    this.on(
      'remove',
      function (resource: SpecifyResource<AnySchema>) {
        if (!resource.isNew()) {
          (this.removed as Set<string>).add(resource.url());
        }
        this.updated = removeKey(this.updated, resource.cid);
        this._totalCount -= 1;
        this.trigger('saverequired');
      },
      this
    );

    this.listenTo(options.related, 'saved', function () {
      this.updated = {};
      this.removed = new Set<string>();
    });

    setupToOne(this, options);
  },
  parse(resp) {
    const self = this;
    const records = Reflect.apply(
      LazyCollection.prototype.parse,
      this,
      arguments
    );

    this._totalCount -= (this.removed as Set<string>).size;

    return records.filter(
      ({ resource_uri }) => !(this.removed as Set<string>).has(resource_uri)
    );
  },
  async fetch(options) {
    if (this.related.isBeingInitialized()) {
      return this;
    }
    this.filters[this.field.name.toLowerCase()] = this.related.id;

    const offset =
      this.length === 0 && this.removed.size > 0
        ? this.removed.size
        : this.length;

    options = { ...(options ?? {}), silent: true, offset };

    return Reflect.apply(LazyCollection.prototype.fetch, this, [options]);
  },
  toApiJSON(options) {
    const self = this;

    return {
      update: Object.values(this.updated),
      remove: Array.from(self.removed),
    };
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
