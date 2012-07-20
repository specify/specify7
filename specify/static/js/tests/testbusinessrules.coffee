define ['jquery', 'underscore', 'specifyapi', 'schema'], ($, _, api, schema) -> ->

    getCollectionObject = (id, callback) ->
        collectionobject = new (api.Resource.forModel 'collectionobject') id: id
        collectionobject.fetch().done callback
        collectionobject

    module 'businessrules'
    test 'saverequired event', ->
        expect 4
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.rget('collectingevent.modifiedbyagent.remarks').done (remarks) ->
                collectionobject.on 'saverequired', ->
                    ok true, 'saverequired on CO'
                    _.delay start, 1000

                collectionobject.on 'change', -> ok false, 'change on CO'

                collectingevent = collectionobject.relatedCache.collectingevent
                collectingevent.on 'saverequired', -> ok true, 'saverequired on CE'
                collectingevent.on 'change', -> ok false, 'change on CE'

                agent = collectingevent.relatedCache.modifiedbyagent
                agent.on 'saverequired', -> ok true, 'saverequired on agent'
                agent.on 'change', -> ok true, 'change on agent'

                agent.set 'remarks', if remarks is 'foo' then 'bar' else 'foo'

    test 'saverequired blocked', ->
        expect 2
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.rget('accession.accessionagents', true).done (AAs) ->
                collectionobject.on 'saverequired', -> ok false, 'saverequired on CO'

                accession = collectionobject.relatedCache.accession
                accession.on 'saverequired', -> ok false, 'saverequired on accession'

                existingRole = AAs.at(0).get 'role'

                newagent = new (api.Resource.forModel 'accessionagent')()
                newagent.set 'accession', accession.url()
                AAs.add newagent

                newagent.on 'saverequired', -> ok false, 'saverequired on newagent'

                newagent.on 'businessrulescomplete', ->
                    ok true, 'businessrulescomplete'
                    ok newagent.needsSaved, 'newagent needsSaved'
                    _.delay start, 1000

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
            collectionobject.on 'businessrule:catalognumber', (resource, result) ->
                ok true, 'businessrule event is triggered'
                ok (not result.valid), 'field is invalid'
                ok _(result.reason).isString(), 'reason is given'
                start()
            collectionobject.set 'catalognumber',  "000037799"

    test 'catalognumber unique', ->
        expect 2
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.on 'businessrule:catalognumber', (resource, result) ->
                ok true, 'businessrule event is triggered'
                ok result.valid, 'catalog number is valid'
                start()
            collectionobject.set 'catalognumber', "999999999"

    test 'catalognumber set to original value', ->
        expect 4
        stop()
        collectionobject = getCollectionObject 102, ->
            origCatNum = collectionobject.get 'catalognumber'
            collectionobject.on 'businessrule:catalognumber', (resource, result) ->
                ok true, 'businessrule event triggered'
                ok result.valid, 'is valid'
                if (collectionobject.get 'catalognumber') is "999999999"
                    collectionobject.set 'catalognumber', origCatNum
                else
                    start()
            collectionobject.set 'catalognumber', "999999999"

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
                COs.at(i).on 'businessrule:catalognumber', (resource, result) ->
                    equal result.valid, expectedValid, doc
                    nextTest()
                COs.at(i).set 'catalognumber', catNum

            nextTest()

    module 'institution business rules'
    test 'institution name is not unique', ->
        expect 2
        stop()
        institution = new (api.Resource.forModel 'institution')()
        institution.on 'businessrule:name', (resource, result) ->
            console.log result
            ok (not result.valid), 'business rule is violated'
            ok (_.isString result.reason), result.reason
            start()
        institution.set 'name', 'Natural History Museum'

    test 'institution name is unique', ->
        expect 1
        stop()
        institution = new (api.Resource.forModel 'institution')()
        institution.on 'businessrule:name', (resource, result) ->
            console.log result
            ok result.valid, 'business rule is valid'
            start()
        institution.set 'name', 'foobar'

    module 'collector business rules'
    test 'collector agent unique in collectingevent', ->
        expect 1
        stop()
        collectingevent = new (api.Resource.forModel 'collectingevent') id: 715
        collectingevent.rget('collectors', true).done (collectors) ->
            newcollector = new (api.Resource.forModel 'collector')()
            newcollector.set 'collectingevent', collectingevent.url()
            newcollector.on 'businessrule:agent', (resource, result) ->
                ok result.valid, 'business rule is valid'
                start()
            collectors.add newcollector
            newcollector.set 'agent', '/api/specify/agent/66/'

    test 'collector agent not unique in collectingevent', ->
        expect 1
        stop()
        collectingevent = new (api.Resource.forModel 'collectingevent') id: 715
        collectingevent.rget('collectors', true).done (collectors) ->
            newcollector = new (api.Resource.forModel 'collector')()
            newcollector.set 'collectingevent', collectingevent.url()
            newcollector.on 'businessrule:agent', (resource, result) ->
                ok (not result.valid), result.reason
                start()
            collectors.add newcollector
            newcollector.set 'agent', '/api/specify/agent/634/'

    module 'accessionagent business rules'
    test 'accessionagent with undefined accession', ->
        expect 1
        stop()
        accessionagent = new (api.Resource.forModel 'accessionagent')()
        accessionagent.on 'businessrule:role', (resource, result) ->
            ok result.valid, 'business rule is valid'
            start()
        accessionagent.set 'role', 'Donor'

    test 'accessionagent with null accession', ->
        expect 1
        stop()
        accessionagent = new (api.Resource.forModel 'accessionagent')()
        accessionagent.set 'accession', null
        accessionagent.on 'businessrule:role', (resource, result) ->
            ok result.valid, 'business rule is valid'
            start()
        accessionagent.set 'role', 'Donor'

    test 'accessionagent with new role in accession', ->
        expect 1
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        accession.rget('accessionagents', true).done (AAs) ->
            newagent = new (api.Resource.forModel 'accessionagent')()
            newagent.on 'businessrule:role', (__, result) ->
                ok result.valid, 'business is ok'
                start()
            newagent.set 'accession', accession.url()
            AAs.add newagent
            newagent.set 'role', 'Donor'

    test 'accessionagent with duped role in accession', ->
        expect 1
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        accession.rget('accessionagents', true).done (AAs) ->
            newagent = new (api.Resource.forModel 'accessionagent')()
            newagent.on 'businessrule:role', (__, result) ->
                ok (not result.valid), 'business rule is violated'
                start()
            newagent.set 'accession', accession.url()
            AAs.add newagent
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
            newagent2.on 'businessrule:role', (__, result) ->
                ok (not result.valid), 'business rule violated'
                start()

            newagent2.set 'repositoryagreement', repositoryagreement.url()
            AAs.add newagent2
            newagent2.set 'role', 'Collector'

    test 'accessionagent with duped role in both accession and repositoryagreement', ->
        expect 2
        stop()
        accession = new (api.Resource.forModel 'accession') id: 1
        repositoryagreement = new (api.Resource.forModel 'repositoryagreement') id: 1
        repositoryagreement.rget('repositoryagreementagents', true).done (RAAs) ->
            newagent1 = new (api.Resource.forModel 'accessionagent')()
            newagent1.set 'repositoryagreement', repositoryagreement.url()
            RAAs.add newagent1
            newagent1.set 'role', 'Collector'

            newagent = new (api.Resource.forModel 'accessionagent')()
            newagent.on 'businessrule:role', (__, result) ->
                ok (not result.valid), 'business rule is not ok'
                equal result.reason, 'Value must be unique to accession, Value must be unique to repositoryagreement',
                    'reasons are joined'
                start()

            newagent.set 'accession', accession.url()
            newagent.set 'repositoryagreement', repositoryagreement.url()
            RAAs.add newagent
            newagent.set 'role', 'Collector'
