define(['underscore', 'specifyapi', 'cs!domain', 'whenall'], function(_, api, domain, whenAll) {
    "use strict";
    return function() {
        module('domain');

        test('collectionsInDomain given a collection', function() {
            expect(2);
            stop();
            var collection = new (api.Resource.forModel('collection'))({ id: 4 });
            domain.collectionsInDomain(collection).done(function (collections) {
                equal(collections.length, 1);
                equal(collections[0].id, collection.id);
                start();
            });
        });

        test('collectionsInDomain given a discipline', function() {
            expect(2);
            stop();
            var discipline = new (api.Resource.forModel('discipline'))({ id: 3 });
            domain.collectionsInDomain(discipline).done(function (collections) {
                equal(collections.length, 2);
                whenAll(_.invoke(collections.rget, 'discipline')).done(function(discs) {
                    ok(_.all(discs, function(disc) { disc.id == discipline.id; }));
                    start();
                });
            });
        });

        test('collectionsForResource given a collectionobject', function() {
            expect(2);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({ id: 100 });
            domain.collectionsForResource(collectionobject).done(function (collections) {
                equal(collections.length, 1);
                equal(collections[0].id, collectionobject.relatedCache['collection'].id);
                start();
            });
        });

        test('collectionsForResource given an agent', function() {
            expect(2);
            stop();
            var agent = new (api.Resource.forModel('agent'))({ id: 66 });
            domain.collectionsForResource(agent).done(function (collections) {
                equal(collections.length, 2);
                whenAll(_.invoke(collections.rget, 'discipline.division')).done(function(divs) {
                    ok(_.all(divs, function(div) {
                        div.id = agent.relatedCache['discipline'].relatedCache['division'].id;
                    }));
                    start();
                });
            });
        });
    };
});
