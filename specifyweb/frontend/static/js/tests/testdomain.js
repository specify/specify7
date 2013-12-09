define(['underscore', 'schema', 'domain', 'whenall'], function(_, schema, domain, whenAll) {
    "use strict";
    return function() {
        module('domain');

        asyncTest('collectionsInDomain given a collection', function() {
            expect(2);
            var collection = new schema.models.Collection.Resource({ id: 4 });
            domain.collectionsInDomain(collection).done(function (collections) {
                equal(collections.length, 1);
                equal(collections[0].id, collection.id);
                start();
            });
        });

        asyncTest('collectionsInDomain given a discipline', function() {
            expect(2);
            var discipline = new schema.models.Discipline.Resource({ id: 3 });
            domain.collectionsInDomain(discipline).done(function (collections) {
                equal(collections.length, 2);
                whenAll(_.invoke(collections.rget, 'discipline')).done(function(discs) {
                    ok(_.all(discs, function(disc) { return disc.id === discipline.id; }));
                    start();
                });
            });
        });

        asyncTest('collectionsForResource given a collectionobject', function() {
            expect(2);
            var collectionobject = new schema.models.CollectionObject.Resource({ id: 100 });
            domain.collectionsForResource(collectionobject).done(function (collections) {
                equal(collections.length, 1);
                equal(collections[0].url(), collectionobject.get('collection'));
                start();
            });
        });

        asyncTest('collectionsForResource given an agent', function() {
            expect(4);
            var agent = new schema.models.Agent.Resource({ id: 66 });
            agent.rget('division').done(function(agentDiv) {
                domain.collectionsForResource(agent).done(function (collections) {
                    equal(collections.length, 2);
                    whenAll(_.invoke(collections, 'rget', 'discipline.division')).done(function(divs) {
                        equal(divs.length, 2);
                        _.each(divs, function(div) {
                            equal(div.url(), agentDiv.url());
                        });
                        start();
                    });
                });
            });
        });
    };
});
