define([
    'jquery', 'underscore', 'backbone', 'schema', 'businessrules'
], function($, _, Backbone, schema, businessrules) {
    "use strict";
    return function() {
        var requestCounter = 0, requestSettings = [];
        $('body').ajaxSend(function(evt, request, settings) {
            requestCounter++;
            requestSettings.push(settings);
        });

        QUnit.testStart = function() {
            requestCounter = 0;
            requestSettings = [];
        };

        var justOk = _.bind(ok, this, true);
        var notOk = _.bind(ok, this, false);

        function nope(message) {
            return function() { ok(false, message); };
        }

        function yep(message) {
            return function() { ok(true, message); };
        }

        var module = function(title, env) {
            var wereEnabled = businessrules.areEnabled();
            window.module(title, _.extend(env || {}, {
                setup: function() { businessrules.enable(false); },
                teardown: function() { businessrules.enable(wereEnabled); }
            }));
        };

        function requireEvent(object, event, message) {
            var result = { ok: false, message: message, event: event };
            object.on(event, function() {
                result.ok = true;
                result.args = arguments;
            });
            return result;
        }

        function rejectEvent(object, event, message) {
            var result = { ok: true, message: message, event: event };
            object.on(event, function() {
                result.ok = false;
                result.args = arguments;
            });
            return result;
        }

        function checkEvents(eventWatchers) {
            _.each(eventWatchers, function(eventWatcher) {
                ok(eventWatcher.ok, eventWatcher.message || eventWatcher.event);
            });
        }

        module('resourceapi');
        test('specifyModel.Resource', function() {
            var Resource = schema.getModel('collectionobject').Resource;
            equal(Resource.specifyModel.name, 'CollectionObject');
            var resource = new Resource();
            equal(resource.specifyModel.name, 'CollectionObject');
            ok(resource instanceof Backbone.Model);
        });

        test('fromUri', function() {
            var resource = schema.models.Determination.Resource.fromUri('/api/specify/determination/100/');
            equal(resource.specifyModel.name, 'Determination', 'Resource is for the right Model');
            equal(resource.id, 100, 'Resource has the right id');
            equal(resource.populated, false, 'Resource starts unpopulated');
        });

        test('fromUri with bad URI', function() {
            throws(
                function() { schema.models.Determination.Resource.fromUri('/api/specify/foo/100'); }
            );
        });

        asyncTest('fetch', function() {
            expect(5);
            var uri = '/api/specify/collectionobject/100/';
            var resource =  new schema.models.CollectionObject.Resource({id: 100});
            ok(!resource.populated, 'Resource starts out unpopulated');
            var deferred = resource.fetch();
            ok(_(deferred).has('promise'), 'resource.fetch returns deferred');
            deferred.done(function() {
                ok(resource.populated, 'resource is populated when deferred completes');
                ok(!resource.needsSaved, 'resource doesnt need saved right after fetch');
                equal(resource.get('resource_uri'), uri, 'resource has the correct url');
                start();
            });
        });

        asyncTest('fetchIfNotPopulated', function() {
            expect(4);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            ok(!resource.populated, 'resource starts out unpopulated');
            var deferred = resource.fetchIfNotPopulated();
            deferred.done(function() {
                ok(resource.populated, 'resource is populated when fetchIfNotPopulated deferred completes');
                ok(!resource.needsSaved, 'resource doesnt need saved');
                deferred = resource.fetchIfNotPopulated();
                deferred.done(function(result) {
                    equal(result, resource, 'calling fetchIfNotPopulated on a populated resource returns deferred resolving to that resource');
                    start();
                });
            });
        });

        asyncTest('rget regular field from unpopulated', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('catalognumber').done(function(catnumber) {
                ok(!resource.needsSaved, 'rget doesnt cause resource to need saving');
                ok(_(catnumber).isString(), 'the deferred resolves to the field requested');
                equal(requestCounter, 1, 'only one request needed');
                start();
            });
        });

        asyncTest('rget regular field from populated', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.fetch().done(function() {
                equal(requestCounter, 1, 'one request triggered by fetch()');
                resource.rget('catalognumber').done(function(catnumber) {
                    ok(!resource.needsSaved, 'resource still doesnt need saved');
                    equal(requestCounter, 1, 'the rget on the popd resource doesnt trigger another request');
                    start();
                });
            });
        });

        asyncTest('rget double fetch', function() {
            expect(1);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            $.when(resource.rget('catalognumber'), resource.rget('collectingevent')).done(function() {
                equal(requestCounter, 1, "after resource is fectched it is not fetched again for another field");
                start();
            });
        });

        asyncTest('rget nested field', function() {
            expect(2);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('cataloger.lastname').done(function(name) {
                equal(requestCounter, 2, 'two requests are required to get a field on a related object');
                equal(name, 'Luttrell', 'the requested field is obtained');
                start();
            });
        });

        asyncTest('rget inline nested field', function () {
            expect(2);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectionobjectattribute.text11').done(function(name) {
                equal(requestCounter, 1, 'dont need a separate request for in-lined fields');
                equal(name, '32mm SL', 'the requested field is returned');
                start();
            });
        });

        asyncTest('rget many-to-one not dependent', function() {
            expect(5);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectingevent').done(function(ce) {
                equal(requestCounter, 1, 'one request to get the url for the related object');
                ok(ce instanceof schema.models.CollectingEvent.Resource, 'the correct type of resource is created for the related object');
                equal(ce.parent, undefined, 'the related resource has no link back to parent resource');
                ok(!ce.populated, 'the related resource is not populated');
                equal(ce.url(), '/api/specify/collectingevent/724/', 'the related resource has the correct url');
                start();
            });
        });

        asyncTest('rget many-to-one dependent', function() {
            expect(6);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectionobjectattribute').done(function(coa) {
                equal(requestCounter, 1, 'one request to get the parent resource');
                ok(coa instanceof schema.models.CollectionObjectAttribute.Resource, 'the related resource has the right type');
                equal(coa.parent, resource, 'the related resource has link back to parent');
                ok(coa.populated, 'for an in-lined field the related resource is populated');
                equal(coa.url(), '/api/specify/collectionobjectattribute/42395/', 'the related resource is the right one');
                equal(coa.parent, resource, 'parent reference is correct');
                start();
            });
        });

        asyncTest('rget one-to-many not dependent', function() {
            expect(4);
            var resource = new schema.models.Accession.Resource({id: 1});
            resource.rget('collectionobjects').done(function(collection) {
                equal(requestCounter, 1, "one request to get the parent resource");
                ok(collection instanceof schema.models.CollectionObject.ToOneCollection, 'the result is the correct type of collection');
                equal(collection.parent, undefined, 'the related collection has no link back to the parent resource');
                equal(collection.length, 0, 'the collection starts out unpopulated');
                start();
            }).fail(function() { console.log(arguments); });
        });

        asyncTest('rget one-to-many dependent', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('determinations').done(function(result) {
                equal(requestCounter, 1, "only one request");
                ok(result instanceof schema.models.Determination.DependentCollection, "result is the right type");
                ok(result.isComplete(), "collection is complete");
                start();
            });
        });

        asyncTest('rget nested one-to-many fails', function() {
            expect(2);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('determinations.id').fail(function(result) {
                equal(requestCounter, 1);
                equal(result, "can't traverse into a collection using dot notation");
                start();
            });
        });

        asyncTest('rget zero-to-one', function() {
            expect(5);
            var resource = new schema.models.Locality.Resource({id: 100});
            resource.rget('localitydetails').done(function(result) {
                equal(requestCounter, 1);
                ok(result instanceof schema.models.LocalityDetail.Resource);
                equal(result.parent, resource, 'zero-to-one related resource gets correct parent link');
                equal(result.id, 42);
                equal(result.parent, resource, 'parent reference is correct');
                start();
            });
        });

        asyncTest('rget zero-to-one null', function() {
            expect(2);
            var resource = new schema.models.Locality.Resource({id: 341});
            resource.rget('localitydetails').done(function(result) {
                equal(requestCounter, 1);
                equal(result, null);
                start();
            });
        });

        asyncTest('rget many-to-one null', function() {
            expect(2);
            var resource = new schema.models.CollectionObject.Resource({id: 1748});
            resource.rget('collectingevent').done(function(result) {
                equal(requestCounter, 1);
                equal(result, null);
                start();
            });
        });

        asyncTest('rget many-to-one same resource', function() {
            expect(4);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectingevent').done(function(outer) {
                equal(requestCounter, 1);
                resource.rget('collectingevent').done(function(inner) {
                    equal(requestCounter, 1);
                    equal(inner.id, outer.id);
                    notEqual(inner.cid, outer.cid);
                    start();
                });
            });
        });

        asyncTest('rget many-to-one same object', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectionobjectattribute').done(function(outer) {
                equal(requestCounter, 1);
                resource.rget('collectionobjectattribute').done(function(inner) {
                    equal(requestCounter, 1);
                    strictEqual(inner, outer);
                    start();
                });
            });
        });

        asyncTest('rget one-to-many cached', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('preparations').done(function(outer) {
                equal(requestCounter, 1);
                resource.rget('preparations').done(function(inner) {
                    equal(requestCounter, 1);
                    strictEqual(inner, outer);
                    start();
                });
            });
        });


        // Currently there are no zero-to-one fields that are not dependent.
        // asyncTest('rget zero-to-one cached', function() {
        //     expect(3);
        //     var resource = new schema.models.Locality.Resource({id: 341});
        //     resource.rget('localitydetails').done(function(outer) {
        //         equal(requestCounter, 2);
        //         resource.rget('localitydetails').done(function(inner) {
        //             equal(requestCounter, 2);
        //             strictEqual(inner, outer);
        //             start();
        //         });
        //     });
        // });

        asyncTest('needsSaved', function() {
            expect(4);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            equal(resource.needsSaved, false, 'newly declared resource does not need saved');
            resource.rget('catalognumber').pipe(function(original) {
                equal(resource.needsSaved, false, 'resource does not need saved after rget');
                resource.set('catalognumber', original + 'foo');
                equal(resource.needsSaved, true, 'resource needs saved after set');
                return resource.save();
            }).done(function() {
                equal(resource.needsSaved, false, 'resource no longer needs saved after save');
                start();
            });
        });

        asyncTest('save', function() {
            expect(2);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('catalognumber').pipe(function() {
                resource.set('catalognumber', 'foo');
                return resource.save();
            }).done(function() {
                ok(!resource.needsSaved);
                equal(requestCounter, 2);
                start();
            });
        });

        asyncTest('save dependent', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            var dependent;
            resource.rget('collectionobjectattribute').pipe(function(coa) {
                coa.set('remarks', 'foo');
                ok(coa.needsSaved, 'dependent resource needs saved');
                ok(resource.needsSaved, 'resource needs saved');
                dependent = coa;
                return resource.save();
            }).done(function() {
                equal(requestCounter, 2, 'another request for saving');
                // We're not updating resources on save...
                // ok(!dependent.needsSaved, 'dependent resource no longer needs saved');
                start();
            });
        });

        asyncTest('save not dependent', function() {
            expect(5);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            var dependent;
            resource.rget('cataloger', true).pipe(function(dep) {
                equal(requestCounter, 2, "two requests");
                dependent = dep;
                dependent.set('remarks', 'foo');
                ok(dependent.needsSaved, 'dependent resource needs saved');
                ok(!resource.needsSaved, "resource doesn't need saved");
                return resource.save();
            }).done(function() {
                ok(dependent.needsSaved, "dependent resource still needs saved");
                ok(!resource.needsSaved, "resource doesn't need saved");
                start();
            });
        });

        asyncTest('save new resource and dependent toMany', function() {
            expect(8);
            var resource = new schema.models.CollectionObject.Resource();
            var newDetermination;
            resource.rget('determinations').pipe(function(determinations) {
                ok(determinations instanceof schema.models.Determination.DependentCollection,
                  "Collectionobject.determinations is dependent");

                equal(requestCounter, 0, 'no requests for new object');
                equal(determinations.length, 0, 'nothing in collection');

                newDetermination = new determinations.model();
                determinations.add(newDetermination);
                ok(!newDetermination.needsSaved, 'determination doesnt need saved yet');
                newDetermination.set('remarks', 'test');
                ok(newDetermination.needsSaved, 'now determination needs saved');
                ok(resource.needsSaved, 'collectionobject needsSaved');
                return resource.save();
            }).done(function() {
                equal(requestCounter, 1, 'POST request');
                equal(requestSettings[0].url, '/api/specify/collectionobject/', 'collectionobject saved');
                // We're not updating resources on save.
                // ok(!resource.needsSaved, 'collectionobject doesnt need saved anymore');
                // ok(!newDetermination.needsSaved, 'determination doesnt need saved anymore');
                // ok(!_.isUndefined(resource.id), 'resource id is defined');
                // ok(!_.isUndefined(newDetermination.id), 'determination id is defined');
                // equal(newDetermination.get('collectionobject'), resource.url(), 'related field is set correctly');
                start();
            });
        });

        asyncTest('save new resource with independent toMany', function() {
            expect(10);
            var resource = new schema.models.CollectingEvent.Resource();
            var newCO;
            resource.rget('collectionobjects').pipe(function(collectionobjects) {
                ok(collectionobjects instanceof schema.models.CollectionObject.ToOneCollection,
                   "Collectingevent.collectionobjects is lazy collection");
                equal(requestCounter, 0, 'no requests for new object');
                equal(collectionobjects.length, 0, 'nothing in collection');

                newCO = new collectionobjects.model();
                collectionobjects.add(newCO);
                newCO.set('remarks', 'test');
                ok(newCO.needsSaved, "now collectionobject does need saved");
                ok(resource.needsSaved, "the collecting event needs saved");
                return resource.save();
            }).done(function() {
                equal(requestCounter, 1, 'one POST request');
                equal(requestSettings[0].url, '/api/specify/collectingevent/', 'collectingevent saved');
                var savedData = JSON.parse(requestSettings[0].data);
                equal(savedData.collectionobjects, undefined, 'collectionobjects not included in saved data');
                ok(!resource.needsSaved, 'collecting event no longer needs saved');
                ok(newCO.needsSaved, 'collection object still needs saved');
                start();
            });
        });

        asyncTest('saverequired event from dependent toOne', function() {
            expect(4);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectionobjectattribute').pipe(function(coa) {
                var eventWatchers = [
                    requireEvent(coa, 'change', 'change on collectionobjectattribute'),
                    requireEvent(coa, 'saverequired', 'saverequired on collectionobjectattribute'),
                    rejectEvent(resource, 'change', 'change on collectionobject'),
                    requireEvent(resource, 'saverequired', 'saverequired on collectionobject')
                ];
                coa.set('remarks', 'foo');
                _.defer(function() {
                    checkEvents(eventWatchers);
                    start();
                });
            });
        });

        asyncTest('saverequired event for independent toOne', function() {
            expect(6);
            var collectionobject = new schema.models.CollectionObject.Resource({id: 100});
            collectionobject.rget('cataloger').done(function(cataloger) {
                var eventWatchers = [
                    rejectEvent(collectionobject, 'saverequired', 'saverequired on collectionobject'),
                    rejectEvent(collectionobject, 'change', 'change on collectionobject'),

                    requireEvent(cataloger, 'saverequired','saverequired on agent'),
                    requireEvent(cataloger, 'change', 'change on agent')
                ];

                cataloger.set('remarks', 'foo');

                _.defer(function() {
                    checkEvents(eventWatchers);

                    ok(cataloger.needsSaved, 'agent needs saved');
                    ok(!collectionobject.needsSaved, 'collectionobject doesnt need saved');
                    start();
                });
            });
        });

        asyncTest('rchange event', function() {
            expect(2);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            resource.rget('collectionobjectattribute').done(function(coa) {
                resource.on('all', function (event) {
                    if (event === 'change') {
                        ok(false, 'change on resource');
                        return;
                    }
                    var match = /^rchange:(.*)$/.exec(event);
                    if (match) {
                        equal(match[1], 'collectionobjectattribute.remarks');
                        equal(arguments[2], 'foo');
                    }
                });

                coa.on('all', function(event) {
                    var match = /^rchange:(.*)$/.exec(event);
                    match && ok(false, 'rchange on collectionobjectattribute');
                });
                coa.set('remarks', 'foo');
                _.defer(start);
            });
        });

        asyncTest('dependent one-to-many add event', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            var eventWatchers = [
                requireEvent(resource, 'add:determinations', 'add event triggered'),
                requireEvent(resource, 'saverequired', 'saverequired event triggered')
            ];
            resource.rget('determinations').done(function(determinations) {
                determinations.add(new schema.models.Determination.Resource());
                _.defer(function() {
                    checkEvents(eventWatchers);
                    ok(resource.needsSaved, 'resource needs saved');
                    start();
                });
            });
        });

        asyncTest('independent one-to-many add event', function() {
            expect(3);
            var resource = new schema.models.Accession.Resource({ id: 3});
            var eventWatchers = [
                rejectEvent(resource, 'add:collectionobjects', 'add event triggered'),
                rejectEvent(resource, 'saverequired', 'saverequired triggered')
            ];
            resource.rget('collectionobjects', true).done(function(COs) {
                COs.add(new schema.models.CollectionObject.Resource());
                _.defer(function() {
                    checkEvents(eventWatchers);
                    ok(!resource.needsSaved, "resource doesn't need saved");
                    start();
                });
            });
        });

        asyncTest('dependent one-to-many remove event', function() {
            expect(3);
            var resource = new schema.models.CollectionObject.Resource({id: 100});
            var eventWatchers = [
                requireEvent(resource, 'remove:determinations', 'add event triggered'),
                requireEvent(resource, 'saverequired', 'saverequired event triggered')
            ];
            resource.rget('determinations').done(function(determinations) {
                determinations.at(0).destroy();
                _.defer(function() {
                    checkEvents(eventWatchers);
                    ok(resource.needsSaved, 'resource needs saved');
                    start();
                });
            });
        });

        asyncTest('independent one-to-many remove event', function() {
            expect(3);
            var resource = new schema.models.Accession.Resource({ id: 3 });
            var eventWatchers = [
                rejectEvent(resource, 'remove:collectionobjects', 'remove event triggered'),
                rejectEvent(resource, 'saverequired', 'saverequired triggered')
            ];
            resource.rget('collectionobjects', true).done(function(COs) {
                COs.at(0).destroy();
                _.defer(function() {
                    checkEvents(eventWatchers);
                    ok(!resource.needsSaved, "resource doesn't need saved");
                    start();
                });
            });
        });

        asyncTest('getResourceAndField', function() {
            // TODO: write this
            expect(0);
            start();
        });

        asyncTest('placeInSameHierarchy', function() {
            expect(1);
            var collectionObject = new schema.models.CollectionObject.Resource({ id: 100 });
            var locality = new schema.models.Locality.Resource();
            locality.placeInSameHierarchy(collectionObject).done(function() {
                equal(locality.get('discipline'), "/api/specify/discipline/3/", 'locality gets the correct discipline');
                start();
            });
        });

        test('placeInSameHierarchy fail', function() {
            var collectionObject = new schema.models.CollectionObject.Resource({ id: 100 });
            var author = new schema.models.Author.Resource();
            equal(author.placeInSameHierarchy(collectionObject), undefined, 'cant place object not in hierarchy');
        });

        test('placeInSameHierarchy fail another way', function() {
            var recordset = new schema.models.RecordSet.Resource({ id: 1 });
            var collectionObject = new schema.models.CollectionObject.Resource();
            equal(collectionObject.placeInSameHierarchy(recordset), undefined, 'no reference hierarchy to use');
        });

        test('placeInSameHierearchy reference object too high', function() {
            var locality = new schema.models.Locality.Resource({ id: 100 });
            var collectionObject = new schema.models.CollectionObject.Resource();
            equal(collectionObject.placeInSameHierarchy(locality), undefined, 'returns undefined');
        });

        module('specifyapi.LazyCollection');
        test('new', function() {
            var Collection = schema.models.Agent.LazyCollection;
            var collection = new Collection();
            equal(collection.model, schema.models.Agent.Resource);
            ok(collection instanceof Collection);
            equal(collection.url(), '/api/specify/agent/');
        });

        asyncTest('fetch', function() {
            expect(5);
            var collection = new schema.models.CollectionObject.LazyCollection({
                filters: { accession: 64 }
            });
            collection.fetch().done(function() {
                equal(requestCounter, 1);
                equal(requestSettings[0].url, '/api/specify/collectionobject/?accession=64&offset=0');
                equal(collection._totalCount, 1232);
                equal(collection.length, 20); // default limit
                equal(collection.models.length, collection.length);
                start();
            });
        });

        asyncTest('fetch more', function() {
            expect(8);
            var at = 100;
            var collection = new schema.models.CollectionObject.LazyCollection({
                filters: { accession: 64 }
            });
            collection.fetch().pipe(function() {
                equal(requestCounter, 1);
                equal(requestSettings[0].url, '/api/specify/collectionobject/?accession=64&offset=0');
                equal(collection._totalCount, 1232);
                equal(collection.length, 20);
                return collection.fetch();
            }).done(function() {
                equal(requestCounter, 2);
                equal(requestSettings[1].url, '/api/specify/collectionobject/?accession=64&offset=20');
                equal(collection._totalCount, 1232);
                equal(collection.length, 40);
                start();
            });
        });

        asyncTest('fetch past end', function() {
            expect(7);
            var collection = new schema.models.Collection.LazyCollection({
                filters: { discipline: 3 }
            });
            collection.fetch().pipe(function() {
                equal(requestCounter, 1, 'first request');
                ok(collection.isComplete(), 'collection is complete');
                equal(collection.length, 2);
                return collection.fetch();
            }).done(function() {
                equal(requestCounter, 2, 'second request');
                equal(requestSettings[1].url, '/api/specify/collection/?discipline=3&offset=2');
                ok(collection.isComplete(), 'collection is complete');
                equal(collection.length, 2);
                start();
            });
        });

        asyncTest('saverequired event on dependent collection', function() {
            expect(6);
            var collectionobject = new schema.models.CollectionObject.Resource({id: 102});
            collectionobject.rget('preparations').done(function(preps) {
                var prep1 = preps.at(0);

                var eventWatchers = [
                    rejectEvent(collectionobject, 'change', 'change on collectionobject'),
                    requireEvent(collectionobject, 'saverequired', 'saverequired on collectionobject'),
                    requireEvent(preps, 'change', 'change on preps'),
                    requireEvent(preps, 'saverequired', 'saverequired on preps'),
                    requireEvent(prep1, 'change', 'change on prep1'),
                    requireEvent(prep1, 'saverequired', 'saverequired on prep1')
                ];

                prep1.set('remarks', 'foobar');

                _.defer(function() {
                    checkEvents(eventWatchers);
                    start();
                });
            });
        });

        asyncTest('saverequired event on independent collection', function() {
            expect(5);
            var accession = new schema.models.Accession.Resource({id: 3});
            accession.rget('collectionobjects').pipe(function(collectionobjects) {
                return collectionobjects.fetch().done(function() {
                    var co = collectionobjects.at(0);

                    var eventWatchers = [
                        rejectEvent(accession, 'change', 'change on accession'),
                        rejectEvent(accession, 'saverequired', 'saverequired on accession'),
                        requireEvent(collectionobjects, 'change', 'change on collection objects'),
                        requireEvent(co, 'change', 'change on co'),
                        requireEvent(co, 'saverequired', 'saverequired on co')
                    ];

                    co.set('remarks', 'boo baz');

                    _.defer(function() {
                        checkEvents(eventWatchers);
                        start();
                    });
                });
            });
        });

        asyncTest('save to-many dependent field', function() {
            expect(5);
            var resource = new schema.models.CollectionObject.Resource({id: 102});
            resource.rget('determinations').done(function(dets) {
                equal(requestCounter, 1);
                var det = dets.at(0);
                det.set('remarks', 'foobar');
                ok(det.needsSaved, 'determination needs saved');
                ok(resource.needsSaved, 'collection object needs saved');
                resource.save().done(function() {
                    equal(requestCounter, 2);
                    var savedData = JSON.parse(requestSettings[1].data);
                    equal(savedData.determinations[0].remarks, 'foobar', 'check saved data');
                    start();
                });
            });
        });

        module("Dependent Fields");

        asyncTest('needsSaved set correctly for to-manys change', function() {
            expect(10);
            var collectionobject = new schema.models.CollectionObject.Resource({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                var det = dets.at(0);
                var eventWatchers = [
                    requireEvent(det, 'change', 'change on determination'),
                    requireEvent(det, 'saverequired', 'saverequired on determination'),

                    requireEvent(dets, 'saverequired', 'saverequired on detreminations'),

                    rejectEvent(collectionobject, 'change', 'change on collectionobject'),
                    requireEvent(collectionobject, 'saverequired', 'saverequired on collectionobject')
                ];

                ok(!collectionobject.needsSaved, 'collection object doesnt need saved');
                ok(!dets.needsSaved, 'determination doesnt need saved');
                ok(!det.needsSaved, "determination doesn't need saved");

                det.set('remarks', det.get('remarks') + ' foobar');

                _.defer(function() {
                    checkEvents(eventWatchers);
                    ok(det.needsSaved, 'determination needs saved');
                    ok(collectionobject.needsSaved, 'collectionobject needs saved');
                    start();
                });
            });
        });

        asyncTest('needsSaved set correctly for to-manys add', function() {
            expect(3);
            var collectionobject = new schema.models.CollectionObject.Resource({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                var eventWatchers = [
                    requireEvent(collectionobject, 'saverequired', 'saverequired on collectionobject')
                ];
                ok(!collectionobject.needsSaved, 'collectionobject does not need saved');

                var newDet = new schema.models.Determination.Resource();
                newDet.set('collectionobject', collectionobject.url());
                dets.add(newDet);

                ok(collectionobject.needsSaved, 'now collectionobject needs saved');
                checkEvents(eventWatchers);
                start();
            });
        });

        asyncTest('needsSaved set correctly for to-manys remove', function() {
            expect(3);
            var collectionobject = new schema.models.CollectionObject.Resource({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                var eventWatchers = [
                    requireEvent(collectionobject, 'saverequired', 'saverequired on collectionobject')
                ];
                ok(!collectionobject.needsSaved, 'collectionobject does not need saved');

                dets.remove(dets.at(0));

                ok(collectionobject.needsSaved, 'now collectionobject needs saved');
                checkEvents(eventWatchers);
                start();
            });
        });

        asyncTest('gatherDependentFields for to-manys', function() {
            var collectionobject = new schema.models.CollectionObject.Resource({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                expect(1 + dets.length);

                var data = collectionobject.toJSON();

                equal(data.determinations.length, dets.length, 'number of determinations is correct');

                _.each(data.determinations, function(det, i) {
                    equal(det.id, dets.at(i).id, 'ids all match');
                });

                start();
            });
        });
    };
});

