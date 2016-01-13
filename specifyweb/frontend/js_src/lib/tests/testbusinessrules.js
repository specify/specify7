(function() {

  define(['jquery', 'underscore', 'schema', 'whenall'], function($, _, schema, whenAll) {
    return function() {
      var getCollectionObject, rejectEvent, requireEvent;
      getCollectionObject = function(id, callback) {
        var collectionobject;
        collectionobject = new schema.models.CollectionObject.Resource({
          id: id
        });
        collectionobject.fetch().done(callback);
        return collectionobject;
      };
      requireEvent = function(object, event, message) {
        var deferred;
        deferred = $.Deferred().done(function() {
          return ok(true, message || event);
        });
        object.on(event, function() {
          return deferred.resolve.apply(deferred, arguments);
        });
        return deferred;
      };
      rejectEvent = function(object, event, message) {
        object.on(event, function() {
          return ok(false, message || event);
        });
        return null;
      };
      module('businessrules');
      asyncTest('saverequired event', function() {
        var collectionobject;
        expect(3);
        collectionobject = new schema.models.CollectionObject.Resource({
          id: 100
        });
        return collectionobject.rget('collectionobjectattribute').done(function(coa) {
          var checks;
          checks = [requireEvent(collectionobject, 'saverequired', 'saverequired on CO'), rejectEvent(collectionobject, 'change', 'change on CO'), requireEvent(coa, 'saverequired', 'saverequired on COA'), requireEvent(coa, 'change', 'change on COA')];
          whenAll(checks).done(function() {
            return start();
          });
          return coa.set('remarks', 'foobar');
        });
      });
      asyncTest('saveblocked event', function() {
        var collectionobject;
        expect(5);
        collectionobject = new schema.models.CollectionObject.Resource({
          id: 100
        });
        return collectionobject.rget('accession', true).done(function(accession) {
          return accession.rget('accessionagents').done(function(AAs) {
            var checks, existingRole, newagent;
            checks = [rejectEvent(collectionobject, 'saveblocked', 'saveblocked reaches CO'), rejectEvent(collectionobject, 'saverequired', 'saverequired reaches CO'), requireEvent(accession, 'saveblocked', 'saveblocked reaches accession'), requireEvent(accession, 'saverequired', 'saverequired reaches accession')];
            newagent = new schema.models.AccessionAgent.Resource();
            newagent.set('accession', accession.url());
            AAs.add(newagent);
            checks.push(requireEvent(newagent, 'saverequired', 'saverequired on newagent'), requireEvent(newagent, 'saveblocked', 'saveblocked fired on newagent'));
            whenAll(checks).done(function() {
              ok(newagent.needsSaved, 'newagent needsSaved');
              return start();
            });
            existingRole = AAs.at(0).get('role');
            return newagent.set('role', existingRole);
          });
        });
      });
      asyncTest('delete blockers', function() {
        var accession;
        expect(3);
        accession = new schema.models.Accession.Resource({
          id: 3
        });
        return accession.rget('collectionobjects').done(function(COs) {
          var orig;
          ok(!accession.businessRuleMgr.canDelete(), 'starts with delete blocked');
          accession.on('candelete', function() {
            ok(true, 'candelete event triggered');
            ok(accession.businessRuleMgr.canDelete(), 'canDelete() returns true');
            return start();
          });
          orig = accession.getRelatedObjectCount;
          accession.getRelatedObjectCount = function(fieldname) {
            if (fieldname === 'collectionobjects') {
              return $.when(0);
            } else {
              return orig(fieldname);
            }
          };
          return accession.trigger('remove:collectionobjects');
        });
      });
      asyncTest('checkCanDelete with block', function() {
        var accession;
        expect(1);
        accession = new schema.models.Accession.Resource({
          id: 3
        });
        return accession.rget('collectionobjects').done(function(COs) {
          ok(!accession.businessRuleMgr.canDelete(), 'starts with delete blocked');
          accession.on('candelete', function() {
            return ok(false, 'candelete event should not be triggered');
          });
          return accession.businessRuleMgr.checkCanDelete().done(function() {
            return _.delay(start, 1000);
          });
        });
      });
      asyncTest('checkCanDelete with no block', function() {
        var accession;
        expect(2);
        accession = new schema.models.Accession.Resource({
          id: 1
        });
        return accession.rget('collectionobjects', true).done(function(COs) {
          ok(!accession.businessRuleMgr.canDelete(), 'starts with delete blocked');
          accession.on('candelete', function() {
            ok(true, 'candelete event triggered');
            return start();
          });
          return accession.businessRuleMgr.checkCanDelete();
        });
      });
      asyncTest('checkCanDelete with no blocking fields', function() {
        var accession;
        expect(1);
        accession = new schema.models.Accession.Resource({
          id: 1
        });
        return accession.fetch().done(function() {
          accession.businessRuleMgr.deleteBlockers = {};
          accession.on('candelete', function() {
            ok(true, 'candelete event triggered');
            return start();
          });
          return accession.businessRuleMgr.checkCanDelete();
        });
      });
      module('collection object businessrules');
      asyncTest('dup catalognumber', function() {
        var collectionobject;
        expect(3);
        collectionobject = new schema.models.CollectionObject.Resource({
          id: 100
        });
        return collectionobject.fetch().done(function() {
          collectionobject.on('saveblocked:catalognumber', function(blocker) {
            var blockers;
            ok(true, 'save is blocked by catalognumber');
            blockers = blocker.resource.saveBlockers.blockersForField('catalognumber');
            equal(blockers.length, 1, 'only one blocker');
            ok(blockers[0].reason, 'reason is given');
            return start();
          });
          return collectionobject.set('catalognumber', "000037799");
        });
      });
      asyncTest('catalognumber unique', function() {
        var collectionobject;
        expect(3);
        collectionobject = new schema.models.CollectionObject.Resource({
          id: 100
        });
        return collectionobject.fetch().done(function() {
          collectionobject.on('saveblocked', function(resource) {
            var checks;
            ok(true, 'save is blocked');
            checks = [requireEvent(collectionobject, 'nosaveblockers:catalognumber', 'saveblockers cleared'), requireEvent(collectionobject, 'oktosave', 'oktosave event triggered')];
            whenAll(checks).done(function() {
              return start();
            });
            return _.defer(function() {
              return collectionobject.set('catalognumber', "999999999");
            });
          });
          return collectionobject.set('catalognumber', "000037799");
        });
      });
      asyncTest('catalognumber set to original value', function() {
        var collectionobject;
        expect(2);
        collectionobject = new schema.models.CollectionObject.Resource({
          id: 100
        });
        return collectionobject.fetch().done(function() {
          var origCatNum;
          origCatNum = collectionobject.get('catalognumber');
          collectionobject.on('saveblocked', function(resource) {
            ok(true, 'save is blocked');
            collectionobject.on('oktosave', function(resource) {
              ok(true, 'oktosave after setting value back to orig');
              return start();
            });
            return _.defer(function() {
              return collectionobject.set('catalognumber', origCatNum);
            });
          });
          return collectionobject.set('catalognumber', "000037799");
        });
      });
      asyncTest('catalognumber unique in collection where some collection objects have been fetched', function() {
        var collection;
        expect(6);
        collection = new schema.models.Collection.Resource({
          id: 4
        });
        return collection.rget('collectionobjects').done(function(COs) {
          return COs.fetch().done(function() {
            var nextTest, tests;
            tests = [[0, '999999999', ['saverequired'], ['saveblocked', 'oktosave'], 'ok b/c this no. is unused'], [1, '000000001', ['saverequired'], ['saveblocked', 'oktosave'], 'this no. was in use by COs.at(0). but we just changed that one'], [2, '000037799', ['saverequired', 'saveblocked'], ['oktosave'], 'not ok b/c no. is used (even tho the conflicting CO is not fetched)'], [3, '999999999', ['saverequired', 'saveblocked'], ['oktosave'], 'conflicts with the first object now.']];
            nextTest = function() {
              var catNum, checks, collectionobject, doc, i, message, reject, require, _ref;
              if (tests.length === 0) return start();
              _ref = tests.shift(), i = _ref[0], catNum = _ref[1], require = _ref[2], reject = _ref[3], doc = _ref[4];
              message = function(event) {
                return "(" + i + ") " + event + ": " + doc;
              };
              collectionobject = COs.at(i);
              checks = _.flatten([
                _.map(require, function(event) {
                  return requireEvent(collectionobject, event, message(event));
                }), _.map(reject, function(event) {
                  return rejectEvent(collectionobject, event, message(event));
                })
              ]);
              whenAll(checks).done(function() {
                return _.defer(nextTest);
              });
              return collectionobject.set('catalognumber', catNum);
            };
            return nextTest();
          });
        });
      });
      module('institution business rules');
      asyncTest('institution name is not unique', function() {
        var checkReason, institution;
        expect(4);
        institution = new schema.models.Institution.Resource();
        checkReason = function(blocker) {
          return ok(_.isString(blocker.reason), blocker.reason);
        };
        whenAll([(requireEvent(institution, 'saveblocked', 'saveblocked triggered')).done(checkReason), (requireEvent(institution, 'saveblocked:name', 'field event triggered')).done(checkReason)]).done(function() {
          return _.defer(start);
        });
        return institution.set('name', 'Natural History Museum');
      });
      asyncTest('institution name is unique', function() {
        var institution;
        expect(2);
        institution = new schema.models.Institution.Resource();
        requireEvent(institution, 'saveblocked', 'saveblocked triggered').done(function() {
          requireEvent(institution, 'oktosave', 'oktosave').done(function() {
            return _.defer(start);
          });
          return _.defer(function() {
            return institution.set('name', 'foobar');
          });
        });
        return institution.set('name', 'Natural History Museum');
      });
      module('collector business rules');
      asyncTest('collector agent not unique in collectingevent', function() {
        var collectingevent;
        expect(4);
        collectingevent = new schema.models.CollectingEvent.Resource({
          id: 715
        });
        return collectingevent.rget('collectors').done(function(collectors) {
          var newcollector;
          newcollector = new schema.models.Collector.Resource();
          newcollector.set('collectingevent', collectingevent.url());
          requireEvent(newcollector, 'saveblocked:agent', 'saveblocked').done(function(blocker) {
            ok(_.isString(blocker.reason), blocker.reason);
            whenAll([requireEvent(newcollector, 'nosaveblockers:agent'), requireEvent(newcollector, 'oktosave')]).done(function() {
              return _.defer(start);
            });
            return _.defer(function() {
              return newcollector.set('agent', '/api/specify/agent/66/');
            });
          });
          collectors.add(newcollector);
          return newcollector.set('agent', '/api/specify/agent/634/');
        });
      });
      module('accessionagent business rules');
      asyncTest('accessionagent with undefined accession', function() {
        var accessionagent;
        expect(1);
        accessionagent = new schema.models.AccessionAgent.Resource();
        whenAll([requireEvent(accessionagent, 'saverequired'), rejectEvent(accessionagent, 'saveblocked')]).done(function() {
          return _.defer(start);
        });
        return accessionagent.set('role', 'Donor');
      });
      asyncTest('accessionagent with null accession', function() {
        var accessionagent;
        expect(1);
        accessionagent = new schema.models.AccessionAgent.Resource();
        accessionagent.set('accession', null);
        whenAll([requireEvent(accessionagent, 'saverequired'), rejectEvent(accessionagent, 'saveblocked')]).done(function() {
          return _.defer(start);
        });
        return accessionagent.set('role', 'Donor');
      });
      asyncTest('accessionagent with new role in accession', function() {
        var accession;
        expect(1);
        accession = new schema.models.Accession.Resource({
          id: 1
        });
        return accession.rget('accessionagents').done(function(AAs) {
          var newagent;
          newagent = new schema.models.AccessionAgent.Resource();
          newagent.set('accession', accession.url());
          AAs.add(newagent);
          whenAll([requireEvent(newagent, 'saverequired'), rejectEvent(newagent, 'saveblocked')]).done(function() {
            return _.defer(start);
          });
          return newagent.set('role', 'Donor');
        });
      });
      asyncTest('accessionagent with duped role in accession', function() {
        var accession;
        expect(2);
        accession = new schema.models.Accession.Resource({
          id: 1
        });
        return accession.rget('accessionagents').done(function(AAs) {
          var newagent;
          newagent = new schema.models.AccessionAgent.Resource();
          newagent.set('accession', accession.url());
          AAs.add(newagent);
          whenAll([requireEvent(newagent, 'saveblocked'), requireEvent(newagent, 'saverequired')]).done(function() {
            return _.defer(start);
          });
          return newagent.set('role', 'Collector');
        });
      });
      asyncTest('accessionagent with duped role in repositoryagreement', function() {
        var repositoryagreement;
        expect(1);
        repositoryagreement = new schema.models.RepositoryAgreement.Resource({
          id: 1
        });
        return repositoryagreement.rget('repositoryagreementagents').done(function(AAs) {
          var newagent1, newagent2;
          newagent1 = new schema.models.AccessionAgent.Resource();
          newagent1.set('repositoryagreement', repositoryagreement.url());
          AAs.add(newagent1);
          newagent1.set('role', 'Collector');
          newagent2 = new schema.models.AccessionAgent.Resource();
          requireEvent(newagent2, 'saveblocked:role').done(function() {
            return _.defer(start);
          });
          newagent2.set('repositoryagreement', repositoryagreement.url());
          AAs.add(newagent2);
          return newagent2.set('role', 'Collector');
        });
      });
      return asyncTest('accessionagent with duped role in both accession and repositoryagreement', function() {
        var accession, repositoryagreement;
        expect(5);
        accession = new schema.models.Accession.Resource({
          id: 1
        });
        repositoryagreement = new schema.models.RepositoryAgreement.Resource({
          id: 1
        });
        return repositoryagreement.rget('repositoryagreementagents').done(function(RAAs) {
          var newagent, newagent1;
          newagent1 = new schema.models.AccessionAgent.Resource();
          newagent1.set('repositoryagreement', repositoryagreement.url());
          RAAs.add(newagent1);
          newagent1.set('role', 'Collector');
          newagent = new schema.models.AccessionAgent.Resource();
          whenAll([requireEvent(newagent, 'saveblocked newagent'), requireEvent(newagent, 'saverequired newagent')]).done(function() {
            return _.defer(function() {
              var blockers;
              blockers = newagent.saveBlockers.getAll();
              equal(_.keys(blockers).length, 1, "one blocker");
              _(blockers).each(function(blocker) {
                equal(blocker.field, 'role', "blocker field is 'role'");
                return equal(blocker.reason, "Value must be unique to accession, Value must be unique to repositoryagreement", 'blocker reason is correct');
              });
              return start();
            });
          });
          newagent.set('accession', accession.url());
          newagent.set('repositoryagreement', repositoryagreement.url());
          RAAs.add(newagent);
          return newagent.set('role', 'Collector');
        });
      });
    };
  });

}).call(this);
