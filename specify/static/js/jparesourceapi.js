define([
    'jquery', 'underscore', 'backbone', 'schema', 'resourceapi', 'jpacollectionapi', 'whenall'
], function($, _, Backbone, schema, Resource, JPACollection, whenAll) {
    var debug = false;

    var JPAResource = Resource.extend({
        url: function() {
            return '/jpa/' + this.specifyModel.name + '?' +
                this.specifyModel.jpaID + '=' + this.id;
        },
        viewUrl: function() {
            return '/specify/view/' + this.specifyModel.name.toLowerCase() + '/' + this.id + '/';
        },
        get: function(attribute) {
            return Backbone.Model.prototype.get.call(this, attribute);
        },
        parse: function(response) {
            this.populated = true;
            
            return Backbone.Model.prototype.parse.apply(this, arguments);
        },
        getRelatedObjectCount: function(fieldName) {
            if (this.specifyModel.getField(fieldName).type !== 'one-to-many') {
                throw new TypeError('field is not one-to-many');
            }
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
            if (method === 'delete') {
                options = options || {};
                options.headers = {'If-Match': resource.get('version')};
            }
            return Backbone.sync(method, resource, options);
        },
        onChange: function(fieldName, callback) {
            var fieldName = fieldName.toLowerCase();
            var event = fieldName.split('.').length === 1 ? 'change:' : 'rchange:';
            this.on(event + fieldName, function(resource, value) { callback(value); });
        }
    }, {
        forModel: function(model) {
            var model = _(model).isString() ? schema.getModel(model) : model;
            if (!model) return null;
            if (!_(resources).has(model.name)) {
                resources[model.name] = Resource.extend({}, { specifyModel: model });
            }
            return resources[model.name];
        },
        fromUri: function(uri) {
            var match = /api\/specify\/(\w+)\/(\d+)\//.exec(uri);
            var ResourceForModel = Resource.forModel(match[1]);
            return new ResourceForModel({id: match[2]});
        }
    });

    var resources = {};

    return Resource;
});
