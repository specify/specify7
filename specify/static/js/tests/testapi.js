define(['underscore', 'backbone', 'specifyapi'], function(_, Backbone, api) {
    return function() {
        module('specifyapi.Resource');
        test('forModel', function() {
            var Resource = api.Resource.forModel('collectionobject');
            equal(Resource.specifyModel, 'CollectionObject');
            var resource = new Resource();
            equal(resource.specifyModel, 'CollectionObject');
            ok(resource instanceof api.Resource);
            ok(resource instanceof Backbone.Model);
            ok(resource instanceof api.Resource.forModel('collectionObject'));
        });

        test('forModel invalid', function() {
            var Resource = api.Resource.forModel('foobar');
            equal(Resource, null);
        });

        test('fromUri', function() {
            var resource = api.Resource.fromUri('/api/specify/determination/100/');
            equal(resource.specifyModel, 'Determination');
            equal(resource.id, 100);
            equal(resource.populated, false);
        });

        test('fetch', function() {
            expect(3);
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            ok(!resource.populated);
            var deferred = resource.fetch();
            ok(_(deferred).has('promise'));
            stop();
            deferred.done(function() {
                ok(resource.populated);
                start();
            });
        });

        test('fetchIfNotPopulated', function() {
            expect(3);
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            ok(!resource.populated);
            stop();
            var deferred = resource.fetchIfNotPopulated();
            deferred.done(function() {
                ok(resource.populated);
                deferred = resource.fetchIfNotPopulated();
                deferred.done(function(result) {
                    equal(result, 'already populated');
                    start();
                });
            });
        });
    };
});

