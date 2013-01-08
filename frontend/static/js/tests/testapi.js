define([
    'jquery', 'underscore', 'backbone', 'specifyapi', 'cs!businessrules'
], function($, _, Backbone, api, businessrules) {
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

        module('specifyapi.Resource');
        test('forModel', function() {
            var Resource = api.Resource.forModel('collectionobject');
            equal(Resource.specifyModel.name, 'CollectionObject');
            var resource = new Resource();
            equal(resource.specifyModel.name, 'CollectionObject');
            ok(resource instanceof api.Resource);
            ok(resource instanceof Backbone.Model);
            ok(resource instanceof api.Resource.forModel('collectionObject'));
        });

        test('forModel invalid', function() {
            var Resource = api.Resource.forModel('foobar');
            equal(Resource, null, "Resource.forModel('foobar') returns null");
        });

        test('fromUri', function() {
            var resource = api.Resource.fromUri('/api/specify/determination/100/');
            equal(resource.specifyModel.name, 'Determination', 'Resource is for the right Model');
            equal(resource.id, 100, 'Resource has the right id');
            equal(resource.populated, false, 'Resource starts unpopulated');
        });

        test('fetch', function() {
            expect(5);
            var uri = '/api/specify/collectionobject/100/';
            var resource =  new (api.Resource.forModel('collectionobject'))({id: 100});
            ok(!resource.populated, 'Resource starts out unpopulated');
            var deferred = resource.fetch();
            ok(_(deferred).has('promise'), 'resource.fetch returns deferred');
            stop();
            deferred.done(function() {
                ok(resource.populated, 'resource is populated when deferred completes');
                ok(!resource.needsSaved, 'resource doesnt need saved right after fetch');
                equal(resource.get('resource_uri'), uri, 'resource has the correct url');
                start();
            });
        });

        test('fetchIfNotPopulated', function() {
            expect(4);
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            ok(!resource.populated, 'resource starts out unpopulated');
            stop();
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

        test('rget regular field from unpopulated', function() {
            expect(3);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('catalognumber').done(function(catnumber) {
                ok(!resource.needsSaved, 'rget doesnt cause resource to need saving');
                ok(_(catnumber).isString(), 'the deferred resolves to the field requested');
                equal(requestCounter, 1, 'only one request needed');
                start();
            });
        });

        test('rget regular field from populated', function() {
            expect(3);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.fetch().done(function() {
                equal(requestCounter, 1, 'one request triggered by fetch()');
                resource.rget('catalognumber').done(function(catnumber) {
                    ok(!resource.needsSaved, 'resource still doesnt need saved');
                    equal(requestCounter, 1, 'the rget on the popd resource doesnt trigger another request');
                    start();
                });
            });
        });

        test('rget double fetch', function() {
            expect(1);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            $.when(resource.rget('catalognumber'), resource.rget('collectingevent')).done(function() {
                equal(requestCounter, 1, "after resource is fectched it is not fetched againg for another field");
                start();
            });
        });

        test('rget nested field', function() {
            expect(2);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('cataloger.lastname').done(function(name) {
                equal(requestCounter, 2, 'two requests are required to get a field on a related object');
                equal(name, 'Luttrell', 'the requested field is obtained');
                start();
            });
        });

        test('rget inline nested field', function () {
            expect(2);
            stop();
            var resource = new (api.Resource.forModel('collector'))({id: 1343});
            resource.rget('agent.lastname').done(function(name) {
                equal(requestCounter, 1, 'dont need a separate request for in-lined fields');
                equal(name, 'Gorman', 'the requested field is returned');
                start();
            });
        });

        test('rget many-to-one', function() {
            expect(6);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('collectingevent').done(function(ce) {
                equal(requestCounter, 1, 'one request to get the url for the related object');
                ok(ce instanceof api.Resource.forModel('collectingevent'), 'the correct type of resource is created for the related object');
                equal(ce.parent, resource, 'the related resource has link back to parent resource');
                ok(!ce.populated, 'the related resource is not populated');
                equal(ce.url(), '/api/specify/collectingevent/715/', 'the related resource has the correct url');
                equal(ce.parent, resource, 'parent reference is correct');
                start();
            });
        });

        test('rget inlined many-to-one', function() {
            expect(6);
            stop();
            var resource = new (api.Resource.forModel('collector'))({id: 1343});
            resource.rget('agent').done(function(agent) {
                equal(requestCounter, 1, 'one request to get the parent resource');
                ok(agent instanceof api.Resource.forModel('agent'), 'the related resource has the right type');
                equal(agent.parent, resource, 'the related resource has link back to parent')
                ok(agent.populated, 'for an in-lined field the related resource is populated');
                equal(agent.url(), '/api/specify/agent/638/', 'the related resource is the right one');
                equal(agent.parent, resource, 'parent reference is correct');
                start();
            });
        });

        test('rget one-to-many', function() {
            expect(6);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('preparations').done(function(prepCol) {
                equal(requestCounter, 1, "one request to get the parent resource");
                ok(prepCol instanceof api.Collection.forModel('preparation'), 'the result is the correct type of collection');
                equal(prepCol.parent, resource, 'the related collection has a link back to the parent resource');
                ok(!prepCol.populated, 'the collection starts out unpopulated');
                equal(prepCol.url(), '/api/specify/preparation/', 'the collection has the correct url');
                equal(prepCol.parent, resource, 'parent reference is correct');
                start();
            });
        });

        test('rget inlined one-to-many', function() {
            expect(6);
            stop();
            var resource = new (api.Resource.forModel('picklist'))({id: 1});
            resource.rget('picklistitems').done(function(result) {
                equal(requestCounter, 1);
                ok(result instanceof api.Collection.forModel('picklistitem'));
                equal(result.parent, resource, 'inlined collection also get parent link');
                ok(result.populated);
                equal(result.url(), '/api/specify/picklistitem/');
                equal(result.parent, resource, 'parent reference is correct');
                start();
            });
        });

        test('rget nested one-to-many fails', function() {
            expect(2);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('determinations.id').done(function(result) {
                equal(requestCounter, 1);
                equal(result, undefined);
                start();
            });
        });

        test('rget zero-to-one', function() {
            expect(5);
            stop();
            var resource = new (api.Resource.forModel('locality'))({id: 341});
            resource.rget('localitydetails').done(function(result) {
                equal(requestCounter, 2);
                ok(result instanceof api.Resource.forModel('localitydetail'));
                equal(result.parent, resource, 'zero-to-one related resource gets correct parent link');
                equal(result.id, 126);
                equal(result.parent, resource, 'parent reference is correct');
                start();
            });
        });

        test('rget zero-to-one null', function() {
            expect(2);
            stop();
            var resource = new (api.Resource.forModel('locality'))({id: 100});
            resource.rget('localitydetails').done(function(result) {
                equal(requestCounter, 2);
                equal(result, null);
                start();
            });
        });

        test('rget many-to-one null', function() {
            expect(2);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 1748});
            resource.rget('collectingevent').done(function(result) {
                equal(requestCounter, 1);
                equal(result, null);
                start();
            });
        });

        test('rget many-to-one cached', function() {
            expect(3);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
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
            var resource = new (api.Resource.forModel('collector'))({id: 1343});
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
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
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
            var resource = new (api.Resource.forModel('locality'))({id: 341});
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
            expect(4);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            equal(resource.needsSaved, false, 'newly declared resource does not need saved');
            resource.rget('catalognumber').done(function(original) {
                equal(resource.needsSaved, false, 'resource does not need saved after rget');
                resource.set('catalognumber', original + 'foo');
                equal(resource.needsSaved, true, 'resource needs saved after set');
                resource.save().done(function() {
                    equal(resource.needsSaved, false, 'resource no longer needs saved after save');
                    start();
                });
            });
        });

        test('rsave', function() {
            expect(2);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('catalognumber').done(function(original) {
                resource.set('catalognumber', original + 'foo');
                resource.rsave().done(function() {
                    ok(!resource.needsSaved);
                    equal(requestCounter, 2);
                    resource.set('catalognumber', original);
                    resource.save().done(function() { start(); });
                });
            });
        });

        test('rsave child', function() {
            expect(4);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('collectingevent.remarks').done(function(original) {
                equal(requestCounter, 2);
                var ce = resource.relatedCache['collectingevent'];
                ce.set('remarks', original + 'foo');
                ok(ce.needsSaved);
                resource.rsave().done(function() {
                    equal(requestCounter, 3);
                    ok(!ce.needsSaved);
                    ce.set('remarks', original);
                    ce.save().done(function () { start(); });
                });
            });
        });

        test('rsave new resource and toMany', function() {
            expect(15);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))();
            resource.rget('determinations').done(function(determinations) {
                determinations.dependent = false;
                equal(requestCounter, 0, 'no requests for new object');
                ok(determinations.isNew, 'toMany collection is marked new');
                equal(determinations.length, 0, 'nothing in collection');
                var newDetermination = new determinations.model();
                determinations.add(newDetermination);
                ok(!newDetermination.needsSaved, 'determination doesnt need saved yet');
                newDetermination.set('remarks', 'test');
                ok(newDetermination.needsSaved, 'now determination needs saved');
                resource.set('catalognumber', 'test');
                ok(resource.needsSaved, 'collectionobject needsSaved');
                resource.rsave().done(function() {
                    equal(requestCounter, 2, 'had to save both collectionobject and determination');
                    equal(requestSettings[0].url, '/api/specify/collectionobject/', 'collectionobject saved first');
                    equal(requestSettings[1].url, '/api/specify/determination/', 'determination saved next');
                    var savedData = JSON.parse(requestSettings[1].data);
                    equal(savedData.collectionobject, resource.url(), 'related field is set correctly');
                    ok(!resource.needsSaved, 'collection doesnt need saved anymore');
                    ok(!newDetermination.needsSaved, 'determination doesnt need saved anymore');
                    ok(!_.isUndefined(resource.id), 'resource id is defined');
                    ok(!_.isUndefined(newDetermination.id), 'determination id is defined');
                    equal(newDetermination.get('collectionobject'), resource.url(), 'related field is set correctly');
                    start();
                });
            });
        });

        test('saverequired event', function() {
            expect(7);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({id: 100});
            collectionobject.rget('collectingevent.modifiedbyagent.remarks').done(function(original) {
                collectionobject.on('subsaverequired', yep('subsaverequired on collectionobject'));
                collectionobject.on('saverequired', nope('saverequired on collectionobject'));
                collectionobject.on('change', nope('change on collectionobject'));

                var ce = collectionobject.relatedCache['collectingevent'];
                ce.on('subsaverequired', yep('subsaverequired on collectingevent'));
                ce.on('saverequired', nope('saverequired on collectingevent'));
                ce.on('change', nope('change on collectingevent'));

                var agent = ce.relatedCache['modifiedbyagent'];
                agent.on('saverequired', yep('saverequired on agent'));
                agent.on('subsaverequired', nope('subsaverequired on agent'));
                agent.on('change', yep('change on agent'));

                agent.set('remarks', original === 'foo'? 'bar' : 'foo');

                ok(agent.needsSaved, 'agent needs saved');
                ok(!ce.needsSaved, 'collecting event doesnt need saved');
                ok(!collectionobject.needsSaved, 'collectionobject doesnt need saved');
                start();
            });
        });

        test('rchange event', function() {
            expect(4);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('collectingevent.modifiedbyagent.remarks').done(function(original) {
                var value = original === 'foo'? 'bar' : 'foo';
                resource.on('all', function (event) {
                    if (event === 'change') {
                        ok(false, 'change on resource');
                        return;
                    }
                    var match = /^rchange:(.*)$/.exec(event);
                    if (match) {
                        equal(match[1], 'collectingevent.modifiedbyagent.remarks');
                        equal(arguments[2], value);
                    }
                });
                var ce = resource.relatedCache['collectingevent'];
                ce.on('all', function(event) {
                    if (event === 'change') {
                        ok(false, 'change on collectingevent');
                        return;
                    }
                    var match = /^rchange:(.*)$/.exec(event);
                    if (match) {
                        equal(match[1], 'modifiedbyagent.remarks');
                        equal(arguments[2], value);
                    }
                });
                var agent = ce.relatedCache['modifiedbyagent'];
                agent.on('all', function(event) {
                    var match = /^rchange:(.*)$/.exec(event);
                    match && ok(false, 'rchange on agent');
                });
                agent.set('remarks', value);
                start();
            });
        });

        test('one-to-many add event', function() {
            expect(1);
            stop();
            var resource = new (api.Resource.forModel('accession'))({ id: 3});
            resource.on('add:collectionobjects', function() {
                yep('add event triggered')();
                start();
            });
            resource.rget('collectionobjects', true).done(function(COs) {
                COs.add(new (api.Resource.forModel('collectionobject'))());
            });
        });

        test('one-to-many remove event', function() {
            expect(1);
            stop();
            var resource = new (api.Resource.forModel('accession'))({ id: 3 });
            resource.on('remove:collectionobjects', function() {
                yep('remove event triggered')();
                start();
            });
            resource.rget('collectionobjects', true).done(function(COs) {
                COs.at(0).destroy();
            });
        });

        test('onChange', function() {
            expect(3);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 100});
            resource.rget('collectingevent.modifiedbyagent.remarks').done(function(original) {
                var value = original === 'foo'? 'bar' : 'foo';
                resource.onChange(
                    'collectingevent.modifiedbyagent.remarks',
                    function (val) {
                        equal(val, value, 'onChange resource');
                    });
                var ce = resource.relatedCache['collectingevent'];
                ce.onChange('modifiedbyagent.remarks', function(val) {
                    equal(val, value, 'onChange collectingevent');
                });
                var agent = ce.relatedCache['modifiedbyagent'];
                agent.onChange('remarks', function(val) {
                    equal(val, value, 'onChange agent');
                });
                agent.set('remarks', value);
                start();
            });
        });

        test('placeInSameHierarchy', function() {
            expect(1);
            stop();
            var collectionObject = new (api.Resource.forModel('collectionobject'))({ id: 100 });
            var locality = new (api.Resource.forModel('locality'))();
            locality.placeInSameHierarchy(collectionObject).done(function() {
                equal(locality.get('discipline'), "/api/specify/discipline/3/", 'locality gets the correct discipline');
                start();
            });
        });

        test('placeInSameHierarchy fail', function() {
            var collectionObject = new (api.Resource.forModel('collectionobject'))({ id: 100 });
            var author = new (api.Resource.forModel('author'))();
            equal(author.placeInSameHierarchy(collectionObject), undefined, 'cant place object not in hierarchy');
        });

        test('placeInSameHierarchy fail another way', function() {
            var recordset = new (api.Resource.forModel('recordset'))({ id: 1 });
            var collectionObject = new (api.Resource.forModel('collectionobject'))();
            equal(collectionObject.placeInSameHierarchy(recordset), undefined, 'no reference hierarchy to use');
        });

        test('placeInSameHierearchy reference object too high', function() {
            var locality = new (api.Resource.forModel('locality'))({ id: 100 });
            var collectionObject = new (api.Resource.forModel('collectionobject'))();
            equal(collectionObject.placeInSameHierarchy(locality), undefined, 'returns undefined');
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
            equal(collection.url(), '/api/specify/collectionobject/');
            ok(!collection.populated);
        });

        test('fetch', function() {
            expect(8);
            stop();
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            collection.fetch().done(function() {
                equal(requestCounter, 1);
                equal(collection.totalCount, 285);
                equal(collection.length, collection.totalCount);
                equal(collection.models.length, collection.length);
                equal(collection.meta.limit, 20);
                ok(!collection.chain().first(collection.meta.limit).any(_.isUndefined).value());
                ok(collection.chain().tail(collection.meta.limit).all(_.isUndefined).value());
                equal(_(collection.models).compact().length, collection.meta.limit);
                start();
            });
        });

        test('fetch at', function() {
            expect(9);
            stop();
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            var at = 100;
            collection.fetch({at: at}).done(function() {
                equal(requestCounter, 1);
                equal(collection.totalCount, 285);
                equal(collection.length, collection.totalCount);
                equal(collection.models.length, collection.length);
                equal(collection.meta.limit, 20);
                ok(collection.chain().first(at).all(_.isUndefined).value());
                ok(!collection.chain().tail(at).first(collection.meta.limit).any(_.isUndefined).value());
                ok(collection.chain().tail(at+collection.meta.limit).all(_.isUndefined).value());
                equal(_(collection.models).compact().length, collection.meta.limit);
                start();
            });
        });

        test('fetch then fetch at', function() {
            expect(10);
            stop();
            var url = '/api/specify/collectionobject/?accession=62';
            var collection = api.Collection.fromUri(url);
            var at = 100;
            collection.fetch().done(function() { collection.fetch({at: at}).done(function() {
                equal(requestCounter, 2);
                equal(collection.totalCount, 285);
                equal(collection.length, collection.totalCount);
                equal(collection.models.length, collection.length);
                equal(collection.meta.limit, 20);
                ok(!collection.chain().first(collection.meta.limit).any(_.isUndefined).value());
                ok(collection.chain().first(at).tail(collection.meta.limit).all(_.isUndefined).value());
                ok(!collection.chain().tail(at).first(collection.meta.limit).any(_.isUndefined).value());
                ok(collection.chain().tail(at+collection.meta.limit).all(_.isUndefined).value());
                equal(_(collection.models).compact().length, 2*collection.meta.limit);
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
                collection.fetch({limit: 20, at: totalCount + 10}).done(function() {
                    equal(collection.length, totalCount);
                    equal(collection.models.length, totalCount);
                    equal(_(collection.models).compact().length, collection.meta.limit);
                    start();
                });
            });
        });

        test('saverequired event', function() {
            expect(5);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({id: 102});
            collectionobject.rget('preparations').done(function(preps) {
                preps.dependent = false;
                collectionobject.on('change', nope('change on collectionobject'));
                collectionobject.on('saverequired', nope('saverequired on collectionobject'));
                collectionobject.on('subsaverequired', yep('subsaverequired on collectionobject'));
                preps.fetch().done(function() {
                    preps.on('change', yep('change on preps'));
                    preps.on('saverequired', yep('saverequired on preps'));
                    var prep = preps.at(1);
                    prep.on('change', yep('change on prep'));
                    prep.on('saverequired', yep('saverequired on prep'));
                    prep.set('remarks', prep.get('remarks') + 'foo');
                    start();
                });
            });
        });

        test('saverequired event deep', function() {
            expect(5);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                collectionobject.on('change', nope('change on collectionobject'));
                collectionobject.on('saverequired', nope('saverequired on collectionobject'));
                collectionobject.on('subsaverequired', yep('subsaverequired on collectionobject'));
                dets.fetch().done(function() {
                    dets.on('change', nope('change on dets'));
                    dets.on('saverequired', nope('saverequired on dets'));
                    dets.on('subsaverequired', yep('subsaverequired on dets'));

                    var det = dets.at(1);
                    det.rget('determiner.lastname').done(function(original) {
                        det.on('change', nope('change on det'));
                        det.on('saverequired', nope('saverequired on det'));
                        det.on('subsaverequired', yep('subsaverequired on det'));

                        var agent = det.relatedCache['determiner'];
                        agent.on('change', yep('change on agent'));
                        agent.on('saverequired', yep('saverequired on agent'));
                        agent.set('lastname', original + 'foo');
                        start();
                    });
                });
            });
        });

        test('rsave', function() {
            expect(6);
            stop();
            var resource = new (api.Resource.forModel('collectionobject'))({id: 102});
            resource.rget('determinations').done(function(dets) {
                dets.dependent = false;
                equal(requestCounter, 1);
                dets.fetch().done(function() {
                    equal(requestCounter, 2);
                    var det = dets.at(1);
                    det.rget('determiner.remarks').done(function(original) {
                        var agent = det.relatedCache['determiner'];
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

        module("Dependent Fields");

        test('needsSaved set correctly for to-manys change', function() {
            expect(8);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                dets.dependent = true;
                dets.fetch().done(function() {
                    var det = dets.at(1);
                    det.on('change', yep('change on determination'));
                    det.on('saverequired', yep('saverequired on determination'));

                    dets.on('saverequired', yep('saverequired on detreminations'));

                    collectionobject.on('change', nope('change on collectionobject'));
                    collectionobject.on('saverequired', yep('saverequired on collectionobject'));

                    ok(!collectionobject.needsSaved, 'collection object doesnt need saved');
                    ok(!dets.needsSaved, 'determination doesnt need saved');

                    det.set('remarks', det.get('remarks') + ' foobar');

                    ok(det.needsSaved, 'determination needs saved');
                    ok(collectionobject.needsSaved, 'collectionobject needs saved');
                    start();
                });
            });
        });

        test('needsSaved set correctly for to-manys add', function() {
            expect(3);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                dets.dependent = true;
                dets.fetch().done(function() {
                    collectionobject.on('saverequired', yep('saverequired on collectionobject'));
                    ok(!collectionobject.needsSaved, 'collectionobject does not need saved');

                    var newDet = new (api.Resource.forModel('determination'))();
                    newDet.set('collectionobject', collectionobject.url());
                    dets.add(newDet);

                    ok(collectionobject.needsSaved, 'now collectionobject needs saved');
                    start();
                });
            });
        });

        test('needsSaved set correctly for to-manys remove', function() {
            expect(3);
            stop();
            var collectionobject = new (api.Resource.forModel('collectionobject'))({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                dets.dependent = true;
                dets.fetch().done(function() {
                    collectionobject.on('saverequired', yep('saverequired on collectionobject'));
                    ok(!collectionobject.needsSaved, 'collectionobject does not need saved');

                    dets.remove(dets.at(0));

                    ok(collectionobject.needsSaved, 'now collectionobject needs saved');
                    start();
                });
            });
        });

        test('gatherDependentFields for to-manys', function() {
            stop();
            var collectionobject = new (api.Resource.forModel("collectionobject"))({id: 102});
            collectionobject.rget('determinations').done(function(dets) {
                dets.dependent = true;
                dets.fetch().done(function() {
                    expect(2 + dets.totalCount);

                    ok(_.isString(collectionobject.get('determinations')), 'determinations field is a url');

                    var data = collectionobject.toJSON();

                    equal(data.determinations.length, dets.totalCount, 'number of determinations is correct');

                    _.each(data.determinations, function(det, i) {
                        equal(det.id, dets.at(i).id, 'ids all match');
                    });

                    start();
                });
            });
        });
    };
});

