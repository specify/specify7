define(['underscore', 'backbone', 'specifyapi'], function(_, Backbone, api) {
    "use strict";
    return function() {
        var requestCounter = 0;
        $('body').ajaxSend(function() {
            requestCounter++;
        });

        var justOk = _.bind(ok, this, true);
        var notOk = _.bind(ok, this, false);

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

        test('needsSaved', function() {
            expect(7);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            equal(resource.needsSaved, false);
            resource.rget('catalognumber').done(function(original) {
                equal(resource.needsSaved, false);
                resource.set('catalognumber', original + 'foo');
                equal(resource.needsSaved, true);
                resource.save().done(function() {
                    equal(resource.needsSaved, false);
                    resource.set('catalognumber', original);
                    resource.set('version', resource.get('version') + 1);
                    equal(resource.needsSaved, true);
                    resource.save().done(function() {
                        equal(resource.needsSaved, false);
                        equal(requestCounter, 3);
                        start();
                    });
                });
            });
        });

        test('rsave', function() {
            expect(2);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('catalognumber').done(function(original) {
                resource.set('catalognumber', original + 'foo');
                resource.rsave().done(function() {
                    ok(!resource.needsSaved);
                    equal(requestCounter, 2);
                    resource.set('catalognumber', original);
                    resource.set('version', resource.get('version') + 1);
                    resource.save().done(function() { start(); });
                });
            });
        });

        test('rsave child', function() {
            expect(4);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.rget('collectingevent.remarks').done(function(original) {
                equal(requestCounter, 2);
                var ce = resource.get('collectingevent');
                ce.set('remarks', original + 'foo');
                ok(ce.needsSaved);
                resource.rsave().done(function() {
                    equal(requestCounter, 3);
                    ok(!ce.needsSaved);
                    ce.set('remarks', original);
                    ce.set('version', ce.get('version') + 1);
                    ce.save().done(function () { start(); });
                });
            });
        });

        test('rchange event', function() {
            expect(13); // 3 agent.set X 3 callbacks + 3 needsSaved checks + 1 requestCounter check
            stop();
            var resource = api.Resource.fromUri('/api/specify/collectionobject/100/');
            resource.on('rchange', justOk);
            resource.on('change', notOk);
            resource.rget('collectingevent.modifiedbyagent.remarks').done(function(original) {
                var ce = resource.get('collectingevent');
                ce.on('rchange', justOk);
                ce.on('change', notOk);
                var agent = ce.get('modifiedbyagent');
                agent.on('rchange', notOk);
                agent.on('change', justOk);
                agent.set('remarks', original + 'foo');
                ok(agent.needsSaved);
                ok(!ce.needsSaved);
                ok(!resource.needsSaved);
                requestCounter = 0;
                resource.rsave().done(function() {
                    equal(requestCounter, 1);
                    agent.set('remarks', original);
                    agent.set('version', agent.get('version') + 1);
                    agent.save().done(function() { start(); });
                });
            });
        });

        module('specifyapi.Collection');
        test('forModel', function() {
            var Collection = api.Collection.forModel('agent');
            var collection = new Collection();
            equal(collection.model, api.Resource.forModel('agent'));
            ok(collection instanceof api.Collection);
            ok(collection instanceof api.Collection.forModel('agent'));
            equal(collection.url(), '/api/specify/agent/');
            ok(!collection.populated);
        });

        test('fromUri', function() {
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            equal(collection.url(), url);
            ok(!collection.populated);
        });

        test('fetch', function() {
            expect(8);
            stop();
            requestCounter = 0;
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            collection.fetch().done(function() {
                equal(requestCounter, 1);
                equal(collection.totalCount, 285);
                equal(collection.length, collection.totalCount);
                equal(collection.models.length, collection.length);
                equal(collection.limit, 20);
                ok(!collection.chain().first(collection.limit).any(_.isUndefined).value());
                ok(collection.chain().tail(collection.limit).all(_.isUndefined).value());
                equal(_(collection.models).compact().length, collection.limit);
                start();
            });
        });

        test('fetch at', function() {
            expect(9);
            stop();
            requestCounter = 0;
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            var at = 100;
            collection.fetch({at: at}).done(function() {
                equal(requestCounter, 1);
                equal(collection.totalCount, 285);
                equal(collection.length, collection.totalCount);
                equal(collection.models.length, collection.length);
                equal(collection.limit, 20);
                ok(collection.chain().first(at).all(_.isUndefined).value());
                ok(!collection.chain().tail(at).first(collection.limit).any(_.isUndefined).value());
                ok(collection.chain().tail(at+collection.limit).all(_.isUndefined).value());
                equal(_(collection.models).compact().length, collection.limit);
                start();
            });
        });

        test('fetch then fetch at', function() {
            expect(10);
            stop();
            requestCounter = 0;
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            var at = 100;
            collection.fetch().done(function() { collection.fetch({at: at}).done(function() {
                equal(requestCounter, 2);
                equal(collection.totalCount, 285);
                equal(collection.length, collection.totalCount);
                equal(collection.models.length, collection.length);
                equal(collection.limit, 20);
                ok(!collection.chain().first(collection.limit).any(_.isUndefined).value());
                ok(collection.chain().first(at).tail(collection.limit).all(_.isUndefined).value());
                ok(!collection.chain().tail(at).first(collection.limit).any(_.isUndefined).value());
                ok(collection.chain().tail(at+collection.limit).all(_.isUndefined).value());
                equal(_(collection.models).compact().length, 2*collection.limit);
                start();
            });});
        });

        test('fetch past end', function() {
            expect(3);
            stop();
            var url = '/api/specify/agent/';
            var collection = api.Collection.fromUri(url);
            collection.fetch().done(function() {
                var totalCount = collection.length;
                collection.fetch({at: totalCount + 10}).done(function() {
                    equal(collection.length, totalCount);
                    equal(collection.models.length, totalCount);
                    equal(_(collection.models).compact().length, collection.limit);
                    start();
                });
            });
        });

        test('rchange event', function() {
            expect(3);
            stop();
            var resource = api.Resource.fromUri('/api/specify/collectionobject/102/');
            resource.on('change', notOk);
            resource.on('rchange', justOk);
            resource.rget('preparations').done(function(preps) {
                preps.on('change', justOk);
                preps.on('rchange', notOk);
                preps.fetch().done(function() {
                    var prep = preps.at(1);
                    prep.on('change', justOk);
                    prep.on('rchange', notOk);
                    prep.set('remarks', prep.get('remarks') + 'foo');
                    start();
                });
            });
        });

        test('rchange event deep', function() {
            expect(4);
            stop();
            var resource = api.Resource.fromUri('/api/specify/collectionobject/102/');
            resource.on('change', notOk);
            resource.on('rchange', justOk);
            resource.rget('determinations').done(function(dets) {
                dets.on('change', notOk);
                dets.on('rchange', justOk);
                dets.fetch().done(function() {
                    var det = dets.at(1);
                    det.on('change', notOk);
                    det.on('rchange', justOk);
                    det.rget('determiner.lastname').done(function(original) {
                        var agent = det.get('determiner');
                        agent.on('change', justOk);
                        agent.on('rchange', notOk);
                        agent.set('lastname', original + 'foo');
                        start();
                    });
                });
            });
        });

        test('rsave', function() {
            expect(6);
            stop();
            requestCounter = 0;
            var resource = api.Resource.fromUri('/api/specify/collectionobject/102/');
            resource.rget('determinations').done(function(dets) {
                equal(requestCounter, 1);
                dets.fetch().done(function() {
                    equal(requestCounter, 2);
                    var det = dets.at(1);
                    det.rget('determiner.remarks').done(function(original) {
                        var agent = det.get('determiner');
                        equal(requestCounter, 3);
                        agent.set('remarks', original === 'foo' ? 'bar' : 'foo');
                        ok(agent.needsSaved);
                        resource.rsave().done(function() {
                            equal(requestCounter, 4);
                            ok(!agent.needsSaved);
                            start();
                        });
                    });
                });
            });
        });
    };
});

