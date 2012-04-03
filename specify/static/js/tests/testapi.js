define(['underscore', 'backbone', 'specifyapi'], function(_, Backbone, api) {
    "use strict";
    return function() {
        var requestCounter = 0;
        $('body').ajaxSend(function() {
            requestCounter++;
        });

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
            expect(4);
            var uri = '/api/specify/collectionobject/100/';
            var resource = api.Resource.fromUri(uri);
            ok(!resource.populated);
            var deferred = resource.fetch();
            ok(_(deferred).has('promise'));
            stop();
            deferred.done(function() {
                ok(resource.populated);
                equal(resource.get('resource_uri'), uri);
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

        test('rget regular field from unpopulated', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('catalognumber').done(function(catnumber) {
                ok(_(catnumber).isString());
                equal(requestCounter, 1);
                start();
            });
        });

        test('rget regular field from populated', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.fetch().done(function() {
                equal(requestCounter, 1);
                resource.rget('catalognumber').done(function(catnumber) {
                    equal(requestCounter, 1);
                    start();
                });
            });
        });

        test('rget double fetch', function() {
            expect(1);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            $.when(resource.rget('catalognumber'), resource.rget('collectingeven')).done(function() {
                equal(requestCounter, 1);
                start();
            });
        });

        test('rget nested field', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('cataloger.lastname').done(function(name) {
                equal(requestCounter, 2);
                equal(name, 'Luttrell');
                start();
            });
        });

        test('rget inline nested field', function () {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collector/1343/');
            resource.rget('agent.lastname').done(function(name) {
                equal(requestCounter, 1);
                equal(name, 'Gorman');
                start();
            });
        });

        test('rget many-to-one', function() {
            expect(4);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('collectingevent').done(function(ce) {
                equal(requestCounter, 1);
                ok(ce instanceof api.Resource.forModel('collectingevent'));
                ok(!ce.populated);
                equal(ce.url(), '/api/specify/collectingevent/715/');
                start();
            });
        });

        test('rget inlined many-to-one', function() {
            expect(4);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collector/1343/');
            resource.rget('agent').done(function(agent) {
                equal(requestCounter, 1);
                ok(agent instanceof api.Resource.forModel('agent'));
                ok(agent.populated);
                equal(agent.url(), '/api/specify/agent/638/');
                start();
            });
        });

        test('rget one-to-many', function() {
            expect(4);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('preparations').done(function(prepCol) {
                equal(requestCounter, 1);
                ok(prepCol instanceof api.Collection.forModel('preparation'));
                ok(!prepCol.populated);
                equal(prepCol.url(), '/api/specify/preparation/?collectionobject=100');
                start();
            });
        });

        test('rget inlined one-to-many', function() {
            expect(4);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/picklist/1/');
            resource.rget('picklistitems').done(function(result) {
                equal(requestCounter, 1);
                ok(result instanceof api.Collection.forModel('picklistitem'));
                ok(result.populated);
                equal(result.url(), '/api/specify/picklistitem/?picklist=1');
                start();
            });
        });

        test('rget nested one-to-many fails', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('determinations.id').done(function(result) {
                equal(requestCounter, 1);
                equal(result, undefined);
                start();
            });
        });

        test('rget zero-to-one', function() {
            expect(3);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/locality/341/');
            resource.rget('localitydetails').done(function(result) {
                equal(requestCounter, 2);
                ok(result instanceof api.Resource.forModel('localitydetail'));
                equal(result.id, 126);
                start();
            });
        });

        test('rget zero-to-one null', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/locality/100/');
            resource.rget('localitydetails').done(function(result) {
                equal(requestCounter, 2);
                equal(result, null);
                start();
            });
        });

        test('rget many-to-one null', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/1748/');
            resource.rget('collectingevent').done(function(result) {
                equal(requestCounter, 1);
                equal(result, null);
                start();
            });
        });

        test('rget many-to-one cached', function() {
            expect(3);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('collectingevent').done(function(outer) {
                equal(requestCounter, 1);
                resource.rget('collectingevent').done(function(inner) {
                    equal(requestCounter, 1);
                    strictEqual(inner, outer);
                    start();
                });
            });
        });

        test('rget inlined many-to-one cached', function() {
            expect(3);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collector/1343/');
            resource.rget('agent').done(function(outer) {
                equal(requestCounter, 1);
                resource.rget('agent').done(function(inner) {
                    equal(requestCounter, 1);
                    strictEqual(inner, outer);
                    start();
                });
            });
        });

        test('rget one-to-many cached', function() {
            expect(3);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('preparations').done(function(outer) {
                equal(requestCounter, 1);
                resource.rget('preparations').done(function(inner) {
                    equal(requestCounter, 1);
                    strictEqual(inner, outer);
                    start();
                });
            });
        });

        test('rget zero-to-one cached', function() {
            expect(3);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/locality/341/');
            resource.rget('localitydetails').done(function(outer) {
                equal(requestCounter, 2);
                resource.rget('localitydetails').done(function(inner) {
                    equal(requestCounter, 2);
                    strictEqual(inner, outer);
                    start();
                });
            });
        });
    };
});

