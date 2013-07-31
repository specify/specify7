define([
    'jquery', 'underscore', 'backbone', 'apibase', 'schema', 'whenall', 'jquery-bbq'
], function($, _, Backbone, api, schema, whenAll) {
    "use strict";

    var splice = Array.prototype.splice;

    api.LazyCollection = function(model, options) {
        options || (options = {});
        this.options = options;
        this.model = model instanceof api.Resource ? model :
            api.Resource.forModel(schema.getModel(model));
        this.blockSize = options.blockSize || 20;
        this.resources = [];
        this.fetches = [];
        this.queryParams = {};
    };

    _.extend(api.LazyCollection.prototype, {
        url: function() {
            return '/api/specify/' + this.model.specifyModel.name.toLowerCase() + '/';
        },
        _update: function(data) {
            this.totalCount = data.meta.total_count;
            var model = this.model;
            var resources = _.map(data.objects, function(obj) { return new model(obj); });
            splice.apply(this.resources,
                         [data.meta.offset, data.objects.length].concat(resources));

            if (this.resources.length > this.totalCount) {
                this.resources.splice(this.totalCount, this.resources.length - this.totalCount);
            }
        },
        at: function(index) {
            var _this = this;

            if (index > this.totalCount) return $.when(null);
            var resource = this.resources[index];
            if (resource) return $.when(resource);

            var offset = index - index % this.blockSize;
            var fetch = this.fetches[offset];

            if (_.isUndefined(fetch)) {
                fetch = this.fetches[offset] = $.get(this.url(), _.extend({}, this.queryParams, {
                    offset: offset,
                    limit: this.blockSize
                })).pipe(function(data) { _this._update(data); });
            }

            return fetch.pipe(function() { return _this.resources[index]; });
        }
    });

    _.extend(api.LazyCollection, {
        fromUri: function(uri, options) {
            var match = /api\/specify\/(\w+)\//.exec(uri);
            var collection =  new api.LazyCollection(match[1]);
            if (uri.indexOf("?") !== -1)
                _.extend(collection.queryParams, $.deparam.querystring(uri));
            return collection;
        }
    });
});
