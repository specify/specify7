define ['jquery', 'underscore', 'specifyapi', 'schema', 'whenall'], ($, _, api, schema, whenAll) -> ->

    getCollectionObject = (id, callback) ->
        collectionobject = new (api.Resource.forModel 'collectionobject') id: id
        collectionobject.fetch().done callback
        collectionobject

    requireEvent = (object, event, message) ->
        deferred = $.Deferred()
        object.on event, ->
            deferred.resolve.apply deferred, arguments
            ok true, (message or event)
        deferred

    rejectEvent = (object, event, message) ->
        object.on event, -> ok false, (message or event)
        null

    module 'businessrules'
    test 'saverequired event', ->
        expect 4
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.rget('collectingevent.modifiedbyagent.remarks').done (remarks) ->
                collectingevent = collectionobject.relatedCache.collectingevent
                agent = collectingevent.relatedCache.modifiedbyagent

                checks = [
                    requireEvent collectionobject, 'saverequired', 'saverequired on CO'
                    rejectEvent collectionobject, 'change', 'change on CO'

                    requireEvent collectingevent, 'saverequired', 'saverequired on CE'
                    rejectEvent collectingevent, 'change', 'change on CE'

                    requireEvent agent, 'saverequired', 'saverequired on agent'
                    requireEvent agent, 'change', 'change on agent'
                ]
                whenAll(checks).done -> start()

                agent.set 'remarks', if remarks is 'foo' then 'bar' else 'foo'

    test 'saveblocked event', ->
        expect 7
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.rget('accession.accessionagents', true).done (AAs) ->
                accession = collectionobject.relatedCache.accession

                checks = [
                    requireEvent collectionobject, 'saveblocked', 'saveblocked reaches CO'
                    requireEvent collectionobject, 'saverequired', 'saverequired reaches CO'

                    requireEvent accession, 'saveblocked', 'saveblocked reaches accession'
                    requireEvent accession, 'saverequired', 'saverequired reaches accession'
                ]

                newagent = new (api.Resource.forModel 'accessionagent')()
                newagent.set 'accession', accession.url()
                AAs.add newagent

                checks.push(
                    requireEvent newagent, 'saverequired', 'saverequired on newagent',
                    requireEvent newagent, 'saveblocked', 'saveblocked fired on newagent'
                )

                whenAll(checks).done ->
                    ok newagent.needsSaved, 'newagent needsSaved'
                    start()

                existingRole = AAs.at(0).get 'role'
                newagent.set 'role', existingRole

    test 'delete blockers', ->
        expect 3
        stop()
        accession = new (api.Resource.forModel 'accession') id: 3
        accession.rget('collectionobjects', true).done (COs) ->
            ok (not accession.businessRuleMgr.canDelete()), 'starts with delete blocked'
            accession.on 'candelete', ->
                ok true, 'candelete event triggered'
                ok accession.businessRuleMgr.canDelete(), 'canDelete() returns true'
                start()
            orig = accession.getRelatedObjectCount
            accession.getRelatedObjectCount = (fieldname) ->
                if fieldname is 'collectionobjects' then $.when 0 else orig fieldname
            accession.trigger 'remove:collectionobjects'

    test 'checkCanDelete with block', ->
        expect 1
        stop()
        accession = new (api.Resource.forModel 'accession') id: 3
        accession.rget('collectionobjects', true).done (COs) ->
            ok (not accession.businessRuleMgr.canDelete()), 'starts with delete blocked'
            accession.on 'candelete', ->
                ok false, 'candelete event should not be triggered'
            accession.businessRuleMgr.checkCanDelete().done ->
                _.delay start, 1000

    test 'checkCanDelete with no block', ->
        expect 2
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        accession.rget('collectionobjects', true).done (COs) ->
            ok (not accession.businessRuleMgr.canDelete()), 'starts with delete blocked'
            accession.on 'candelete', ->
                ok true, 'candelete event triggered'
                start()
            accession.businessRuleMgr.checkCanDelete()

    test 'checkCanDelete with no blocking fields', ->
        expect 1
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        accession.fetch().done ->
            accession.businessRuleMgr.deleteBlockers = {}
            accession.on 'candelete', ->
                ok true, 'candelete event triggered'
                start()
            accession.businessRuleMgr.checkCanDelete()

    module 'collection object businessrules'
    test 'dup catalognumber', ->
        expect 3
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.on 'saveblocked:catalognumber', (resource) ->
                ok true, 'save is blocked by catalognumber'
                blockers = resource.saveBlockers.blockersForField 'catalognumber'
                equal blockers.length, 1, 'only one blocker'
                ok blockers[0].reason, 'reason is given'
                start()
            collectionobject.set 'catalognumber',  "000037799"

    test 'catalognumber unique', ->
        expect 3
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.on 'saveblocked', (resource) ->
                ok true, 'save is blocked'

                checks = [
                    requireEvent collectionobject, 'nosaveblockers:catalognumber', 'saveblockers cleared'
                    requireEvent collectionobject, 'oktosave', 'oktosave event triggered'
                ]
                whenAll(checks).done -> start()
                _.defer -> collectionobject.set 'catalognumber', "999999999"
            collectionobject.set 'catalognumber', "000037799"

    test 'catalognumber set to original value', ->
        expect 2
        stop()
        collectionobject = getCollectionObject 100, ->
            origCatNum = collectionobject.get 'catalognumber'
            collectionobject.on 'saveblocked', (resource) ->
                ok true, 'save is blocked'
                collectionobject.on 'oktosave', (resource) ->
                    ok true, 'oktosave after setting value back to orig'
                    start()
                _.defer -> collectionobject.set 'catalognumber', origCatNum
            collectionobject.set 'catalognumber', "000037799"

    test 'catalognumber unique in collection where some collection objects have been fetched', ->
        expect 4
        stop()
        collection = new (api.Resource.forModel 'collection') id: 4
        collection.rget('collectionobjects', true).done (COs) ->
            tests = [
                [0, '999999999', true, 'ok b/c this no. is unused'],
                [1, '000000001', true, 'this no. was in use by COs.at(0). but we just changed that one'],
                [2, '000037799', false, 'not ok b/c no. is used (even tho the conflicting CO is not fetched'],
                [3, '999999999', false, 'conflicts with the first object now.']
            ]

            nextTest = ->
                if tests.length is 0 then return start()
                [i, catNum, expectedValid, doc] = tests.shift()
                collectionobject = COs.at i
                checks = if expectedValid then [
                    requireEvent collectionobject, 'oktosave', doc
                    rejectEvent collectionobject, 'saveblocked', doc ]
                else [
                    requireEvent collectionobject, 'saveblocked', doc
                    rejectEvent collectionobject, 'oktosave', doc ]

                whenAll(checks).done -> _.defer nextTest

                collectionobject.set 'catalognumber', catNum

            nextTest()

    module 'institution business rules'
    test 'institution name is not unique', ->
        expect 4
        stop()
        institution = new (api.Resource.forModel 'institution')()
        checkReason = (resource, blocker) ->
                ok (_.isString blocker.reason), blocker.reason

        whenAll([
            (requireEvent institution, 'saveblocked', 'saveblocked triggered').done checkReason
            (requireEvent institution, 'saveblocked:name', 'field event triggered').done checkReason
        ]).done -> _.defer start

        institution.set 'name', 'Natural History Museum'

    test 'institution name is unique', ->
        expect 2
        stop()
        institution = new (api.Resource.forModel 'institution')()
        requireEvent(institution, 'saveblocked', 'saveblocked triggered').done ->
            requireEvent(institution, 'oktosave', 'oktosave').done -> _.defer start
            _.defer -> institution.set 'name', 'foobar'

        institution.set 'name', 'Natural History Museum'

    module 'collector business rules'
    test 'collector agent not unique in collectingevent', ->
        expect 4
        stop()
        collectingevent = new (api.Resource.forModel 'collectingevent') id: 715
        collectingevent.rget('collectors', true).done (collectors) ->
            newcollector = new (api.Resource.forModel 'collector')()
            newcollector.set 'collectingevent', collectingevent.url()

            requireEvent(newcollector, 'saveblocked:agent', 'saveblocked').done (resource, blocker) ->
                ok _.isString(blocker.reason), blocker.reason
                whenAll([
                    requireEvent newcollector, 'nosaveblockers:agent'
                    requireEvent newcollector, 'oktosave'
                ]).done -> _.defer start
                _.defer -> newcollector.set 'agent', '/api/specify/agent/66/'

            collectors.add newcollector
            newcollector.set 'agent', '/api/specify/agent/634/'

    module 'accessionagent business rules'
    test 'accessionagent with undefined accession', ->
        expect 1
        stop()
        accessionagent = new (api.Resource.forModel 'accessionagent')()
        whenAll([
            requireEvent accessionagent, 'saverequired'
            rejectEvent accessionagent, 'saveblocked'
        ]).done -> _.defer start

        accessionagent.set 'role', 'Donor'

    test 'accessionagent with null accession', ->
        expect 1
        stop()
        accessionagent = new (api.Resource.forModel 'accessionagent')()
        accessionagent.set 'accession', null
        whenAll([
            requireEvent accessionagent, 'saverequired'
            rejectEvent accessionagent, 'saveblocked'
        ]).done -> _.defer start
        accessionagent.set 'role', 'Donor'

    test 'accessionagent with new role in accession', ->
        expect 1
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        accession.rget('accessionagents', true).done (AAs) ->
            newagent = new (api.Resource.forModel 'accessionagent')()
            newagent.set 'accession', accession.url()
            AAs.add newagent
            whenAll([
                requireEvent newagent, 'saverequired'
                rejectEvent newagent, 'saveblocked'
            ]).done -> _.defer start
            newagent.set 'role', 'Donor'

    test 'accessionagent with duped role in accession', ->
        expect 2
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        accession.rget('accessionagents', true).done (AAs) ->
            newagent = new (api.Resource.forModel 'accessionagent')()
            newagent.set 'accession', accession.url()
            AAs.add newagent
            whenAll([
                requireEvent newagent, 'saveblocked'
                requireEvent newagent, 'saverequired'
            ]).done -> _.defer start
            newagent.set 'role', 'Collector'

    test 'accessionagent with duped role in repositoryagreement', ->
        expect 1
        stop()
        repositoryagreement = new (api.Resource.forModel 'repositoryagreement') id: 1
        repositoryagreement.rget('repositoryagreementagents', true).done (AAs) ->
            newagent1 = new (api.Resource.forModel 'accessionagent')()
            newagent1.set 'repositoryagreement', repositoryagreement.url()
            AAs.add newagent1
            newagent1.set 'role', 'Collector'

            newagent2 = new (api.Resource.forModel 'accessionagent')()
            requireEvent(newagent2, 'saveblocked:role').done -> _.defer start

            newagent2.set 'repositoryagreement', repositoryagreement.url()
            AAs.add newagent2
            newagent2.set 'role', 'Collector'

    test 'accessionagent with duped role in both accession and repositoryagreement', ->
        expect 7
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        repositoryagreement = new (api.Resource.forModel 'repositoryagreement') id: 1
        repositoryagreement.rget('repositoryagreementagents', true).done (RAAs) ->
            newagent1 = new (api.Resource.forModel 'accessionagent')()
            newagent1.set 'repositoryagreement', repositoryagreement.url()
            RAAs.add newagent1
            newagent1.set 'role', 'Collector'

            newagent = new (api.Resource.forModel 'accessionagent')()

            whenAll([
                requireEvent newagent, 'saveblocked'
                requireEvent newagent, 'saverequired'
            ]).done -> _.defer ->
                blockers = newagent.saveBlockers.getAll()
                equal _.keys(blockers).length, 1
                _(blockers).each (blocker) ->
                    equal blocker.field, 'role'
                    equal blocker.reason, "Value must be unique to accession, Value must be unique to repositoryagreement"
                start()

            newagent.set 'accession', accession.url()
            newagent.set 'repositoryagreement', repositoryagreement.url()
            RAAs.add newagent
            newagent.set 'role', 'Collector'
