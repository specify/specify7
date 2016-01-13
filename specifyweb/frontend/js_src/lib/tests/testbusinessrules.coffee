define ['jquery', 'underscore', 'schema', 'whenall'], ($, _, schema, whenAll) -> ->

    getCollectionObject = (id, callback) ->
        collectionobject = new schema.models.CollectionObject.Resource id: id
        collectionobject.fetch().done callback
        collectionobject

    requireEvent = (object, event, message) ->
        deferred = $.Deferred().done -> ok true, (message or event)
        object.on event, -> deferred.resolve.apply deferred, arguments
        deferred

    rejectEvent = (object, event, message) ->
        object.on event, -> ok false, (message or event)
        null

    module 'businessrules'
    asyncTest 'saverequired event', ->
        expect 3
        collectionobject = new schema.models.CollectionObject.Resource id: 100
        collectionobject.rget('collectionobjectattribute').done (coa) ->
            checks = [
                requireEvent collectionobject, 'saverequired', 'saverequired on CO'
                rejectEvent collectionobject, 'change', 'change on CO'
                requireEvent coa, 'saverequired', 'saverequired on COA'
                requireEvent coa, 'change', 'change on COA'
            ]

            whenAll(checks).done -> start()

            coa.set 'remarks', 'foobar'

    asyncTest 'saveblocked event', ->
        expect 5
        collectionobject = new schema.models.CollectionObject.Resource id: 100
        collectionobject.rget('accession', true).done (accession) ->
            accession.rget('accessionagents').done (AAs) ->
                checks = [
                    rejectEvent collectionobject, 'saveblocked', 'saveblocked reaches CO'
                    rejectEvent collectionobject, 'saverequired', 'saverequired reaches CO'

                    requireEvent accession, 'saveblocked', 'saveblocked reaches accession'
                    requireEvent accession, 'saverequired', 'saverequired reaches accession'
                ]

                newagent = new schema.models.AccessionAgent.Resource()
                newagent.set 'accession', accession.url()
                AAs.add newagent

                checks.push(
                    (requireEvent newagent, 'saverequired', 'saverequired on newagent'),
                    (requireEvent newagent, 'saveblocked', 'saveblocked fired on newagent')
                )

                whenAll(checks).done ->
                    ok newagent.needsSaved, 'newagent needsSaved'
                    start()

                existingRole = AAs.at(0).get 'role'
                newagent.set 'role', existingRole

    asyncTest 'delete blockers', ->
        expect 3
        accession = new schema.models.Accession.Resource id: 3
        accession.rget('collectionobjects').done (COs) ->
            ok (not accession.businessRuleMgr.canDelete()), 'starts with delete blocked'
            accession.on 'candelete', ->
                ok true, 'candelete event triggered'
                ok accession.businessRuleMgr.canDelete(), 'canDelete() returns true'
                start()
            orig = accession.getRelatedObjectCount
            accession.getRelatedObjectCount = (fieldname) ->
                if fieldname is 'collectionobjects' then $.when 0 else orig fieldname
            accession.trigger 'remove:collectionobjects'

    asyncTest 'checkCanDelete with block', ->
        expect 1
        accession = new schema.models.Accession.Resource id: 3
        accession.rget('collectionobjects').done (COs) ->
            ok (not accession.businessRuleMgr.canDelete()), 'starts with delete blocked'
            accession.on 'candelete', ->
                ok false, 'candelete event should not be triggered'
            accession.businessRuleMgr.checkCanDelete().done ->
                _.delay start, 1000

    asyncTest 'checkCanDelete with no block', ->
        expect 2
        accession = new schema.models.Accession.Resource id: 1
        accession.rget('collectionobjects', true).done (COs) ->
            ok (not accession.businessRuleMgr.canDelete()), 'starts with delete blocked'
            accession.on 'candelete', ->
                ok true, 'candelete event triggered'
                start()
            accession.businessRuleMgr.checkCanDelete()

    asyncTest 'checkCanDelete with no blocking fields', ->
        expect 1
        accession = new schema.models.Accession.Resource id: 1
        accession.fetch().done ->
            accession.businessRuleMgr.deleteBlockers = {}
            accession.on 'candelete', ->
                ok true, 'candelete event triggered'
                start()
            accession.businessRuleMgr.checkCanDelete()

    module 'collection object businessrules'
    asyncTest 'dup catalognumber', ->
        expect 3
        collectionobject = new schema.models.CollectionObject.Resource id: 100
        collectionobject.fetch().done ->
            collectionobject.on 'saveblocked:catalognumber', (blocker) ->
                ok true, 'save is blocked by catalognumber'
                blockers = blocker.resource.saveBlockers.blockersForField 'catalognumber'
                equal blockers.length, 1, 'only one blocker'
                ok blockers[0].reason, 'reason is given'
                start()
            collectionobject.set 'catalognumber',  "000037799"

    asyncTest 'catalognumber unique', ->
        expect 3
        collectionobject = new schema.models.CollectionObject.Resource id: 100
        collectionobject.fetch().done ->
            collectionobject.on 'saveblocked', (resource) ->
                ok true, 'save is blocked'

                checks = [
                    requireEvent collectionobject, 'nosaveblockers:catalognumber', 'saveblockers cleared'
                    requireEvent collectionobject, 'oktosave', 'oktosave event triggered'
                ]
                whenAll(checks).done -> start()
                _.defer -> collectionobject.set 'catalognumber', "999999999"
            collectionobject.set 'catalognumber', "000037799"

    asyncTest 'catalognumber set to original value', ->
        expect 2
        collectionobject = new schema.models.CollectionObject.Resource id: 100
        collectionobject.fetch().done ->
            origCatNum = collectionobject.get 'catalognumber'
            collectionobject.on 'saveblocked', (resource) ->
                ok true, 'save is blocked'
                collectionobject.on 'oktosave', (resource) ->
                    ok true, 'oktosave after setting value back to orig'
                    start()
                _.defer -> collectionobject.set 'catalognumber', origCatNum
            collectionobject.set 'catalognumber', "000037799"

    asyncTest 'catalognumber unique in collection where some collection objects have been fetched', ->
        expect 6
        collection = new schema.models.Collection.Resource id: 4
        collection.rget('collectionobjects').done (COs) -> COs.fetch().done ->
            tests = [
                #i, catNumber,  [required events], [reject events], doc string

                [0, '999999999', ['saverequired'], ['saveblocked', 'oktosave'],
                    'ok b/c this no. is unused']

                [1, '000000001', ['saverequired'], ['saveblocked', 'oktosave'],
                    'this no. was in use by COs.at(0). but we just changed that one']

                [2, '000037799', ['saverequired', 'saveblocked'], ['oktosave'],
                    'not ok b/c no. is used (even tho the conflicting CO is not fetched)']

                [3, '999999999', ['saverequired', 'saveblocked'], ['oktosave'],
                    'conflicts with the first object now.']
            ]

            nextTest = ->
                if tests.length is 0 then return start()
                [i, catNum, require, reject, doc] = tests.shift()
                message = (event) -> "(#{i}) #{event}: #{doc}"
                collectionobject = COs.at i
                checks = _.flatten [
                    _.map require, (event) ->  requireEvent collectionobject, event, message(event)
                    _.map reject, (event) -> rejectEvent collectionobject, event, message(event)
                ]

                whenAll(checks).done -> _.defer nextTest

                collectionobject.set 'catalognumber', catNum

            nextTest()

    module 'institution business rules'
    asyncTest 'institution name is not unique', ->
        expect 4
        institution = new schema.models.Institution.Resource()
        checkReason = (blocker) ->
                ok (_.isString blocker.reason), blocker.reason

        whenAll([
            (requireEvent institution, 'saveblocked', 'saveblocked triggered').done checkReason
            (requireEvent institution, 'saveblocked:name', 'field event triggered').done checkReason
        ]).done -> _.defer start

        institution.set 'name', 'Natural History Museum'

    asyncTest 'institution name is unique', ->
        expect 2
        institution = new schema.models.Institution.Resource()
        requireEvent(institution, 'saveblocked', 'saveblocked triggered').done ->
            requireEvent(institution, 'oktosave', 'oktosave').done -> _.defer start
            _.defer -> institution.set 'name', 'foobar'

        institution.set 'name', 'Natural History Museum'

    module 'collector business rules'
    asyncTest 'collector agent not unique in collectingevent', ->
        expect 4
        collectingevent = new schema.models.CollectingEvent.Resource id: 715
        collectingevent.rget('collectors').done (collectors) ->
            newcollector = new schema.models.Collector.Resource()
            newcollector.set 'collectingevent', collectingevent.url()

            requireEvent(newcollector, 'saveblocked:agent', 'saveblocked').done (blocker) ->
                ok _.isString(blocker.reason), blocker.reason
                whenAll([
                    requireEvent newcollector, 'nosaveblockers:agent'
                    requireEvent newcollector, 'oktosave'
                ]).done -> _.defer start
                _.defer -> newcollector.set 'agent', '/api/specify/agent/66/'

            collectors.add newcollector
            newcollector.set 'agent', '/api/specify/agent/634/'

    module 'accessionagent business rules'
    asyncTest 'accessionagent with undefined accession', ->
        expect 1
        accessionagent = new schema.models.AccessionAgent.Resource()
        whenAll([
            requireEvent accessionagent, 'saverequired'
            rejectEvent accessionagent, 'saveblocked'
        ]).done -> _.defer start

        accessionagent.set 'role', 'Donor'

    asyncTest 'accessionagent with null accession', ->
        expect 1
        accessionagent = new schema.models.AccessionAgent.Resource()
        accessionagent.set 'accession', null
        whenAll([
            requireEvent accessionagent, 'saverequired'
            rejectEvent accessionagent, 'saveblocked'
        ]).done -> _.defer start
        accessionagent.set 'role', 'Donor'

    asyncTest 'accessionagent with new role in accession', ->
        expect 1
        accession = new schema.models.Accession.Resource id: 1
        accession.rget('accessionagents').done (AAs) ->
            newagent = new schema.models.AccessionAgent.Resource()
            newagent.set 'accession', accession.url()
            AAs.add newagent
            whenAll([
                requireEvent newagent, 'saverequired'
                rejectEvent newagent, 'saveblocked'
            ]).done -> _.defer start
            newagent.set 'role', 'Donor'

    asyncTest 'accessionagent with duped role in accession', ->
        expect 2
        accession = new schema.models.Accession.Resource id: 1
        accession.rget('accessionagents').done (AAs) ->
            newagent = new schema.models.AccessionAgent.Resource()
            newagent.set 'accession', accession.url()
            AAs.add newagent
            whenAll([
                requireEvent newagent, 'saveblocked'
                requireEvent newagent, 'saverequired'
            ]).done -> _.defer start
            newagent.set 'role', 'Collector'

    asyncTest 'accessionagent with duped role in repositoryagreement', ->
        expect 1
        repositoryagreement = new schema.models.RepositoryAgreement.Resource id: 1
        repositoryagreement.rget('repositoryagreementagents').done (AAs) ->
            newagent1 = new schema.models.AccessionAgent.Resource()
            newagent1.set 'repositoryagreement', repositoryagreement.url()
            AAs.add newagent1
            newagent1.set 'role', 'Collector'

            newagent2 = new schema.models.AccessionAgent.Resource()
            requireEvent(newagent2, 'saveblocked:role').done -> _.defer start

            newagent2.set 'repositoryagreement', repositoryagreement.url()
            AAs.add newagent2
            newagent2.set 'role', 'Collector'

    asyncTest 'accessionagent with duped role in both accession and repositoryagreement', ->
        expect 5
        accession = new schema.models.Accession.Resource id: 1
        repositoryagreement = new schema.models.RepositoryAgreement.Resource id: 1
        repositoryagreement.rget('repositoryagreementagents').done (RAAs) ->
            newagent1 = new schema.models.AccessionAgent.Resource()
            newagent1.set 'repositoryagreement', repositoryagreement.url()
            RAAs.add newagent1
            newagent1.set 'role', 'Collector'

            newagent = new schema.models.AccessionAgent.Resource()

            whenAll([
                requireEvent newagent, 'saveblocked newagent'
                requireEvent newagent, 'saverequired newagent'
            ]).done -> _.defer ->
                blockers = newagent.saveBlockers.getAll()
                equal _.keys(blockers).length, 1, "one blocker"
                _(blockers).each (blocker) ->
                    equal blocker.field, 'role', "blocker field is 'role'"
                    equal blocker.reason, "Value must be unique to accession, Value must be unique to repositoryagreement",
                        'blocker reason is correct'
                start()

            newagent.set 'accession', accession.url()
            newagent.set 'repositoryagreement', repositoryagreement.url()
            RAAs.add newagent
            newagent.set 'role', 'Collector'
