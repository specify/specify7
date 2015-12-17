"use strict";

var $ = require('jquery');
var _ = require('underscore');

var api = require('./specifyapi.js');
var schema = require('./schema.js');

    function takeBetween(items, startElem, endElem) {
        var start = 1 + _.indexOf(items, startElem);
        var end = 1 + _.indexOf(items, endElem);
        return _.rest(_.first(items, end), start);
    }


    api.on('newresource', function(resource) {
        var domainField = resource.specifyModel.orgRelationship();
        if (domainField && !resource.get(domainField.name)) {
            var parentResource = domain.getDomainResource(domainField.name);
            if (parentResource != null) {
                resource.set(domainField.name, parentResource.url());
            }
        }
    });

    var treeDefLevels = {
        geography: 'discipline',
        geologictimeperiod: 'discipline',
        lithostrat: 'discipline',
        storage: 'institution',
        taxon: 'discipline'
    };

    var domain = {
        getDomainResource: function(level) {
            return new (schema.getModel(level).Resource)({ id: schema.domainLevelIds[level] });
        },
        getTreeDef: function(treeName) {
            treeName = treeName.toLowerCase();
            var level = treeDefLevels[treeName];
            if (level != null) {
                return domain.getDomainResource(level).rget(treeName + 'treedef');
            } else {
                return null;
            }
        },
        collectionsInDomain: function(domainResource) {
            if (domainResource == null) return null;
            var domainLevel = domainResource.specifyModel.name.toLowerCase();
            if (domainLevel === 'collectionobject') {
                return domainResource.rget('collection', true).pipe(function(collection) {
                    return [collection];
                });
            }
            if (domainLevel === 'collection') {
                return domainResource.fetchIfNotPopulated().pipe(function() {
                    return [domainResource];
                });
            }
            var path = takeBetween(schema.orgHierarchy, 'collection', domainLevel);
            var filter = {};
            filter[path.join('__')] = domainResource.id;
            var collections = new schema.models.Collection.LazyCollection({ filters: filter });
            return collections.fetch({ limit: 0 }).pipe(function() { return collections.models; });
        },
        collectionsForResource: function(resource) {
            var collectionmemberid = resource.get('collectionmemberid');
            if (_.isNumber(collectionmemberid)) {
                var collection = new schema.models.Collection.Resource({ id: collectionmemberid });
                return collection.fetchIfNotPopulated().pipe(function() { return [collection]; });
            }
            var domainField = resource.specifyModel.orgRelationship();
            if (domainField) {
                return resource.rget(domainField.name).pipe(domain.collectionsInDomain);
            } else {
                return $.when(null);
            }
        }
    };

module.exports = domain;
