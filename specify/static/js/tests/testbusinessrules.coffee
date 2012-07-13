define ['jquery', 'underscore', 'specifyapi', 'schema'], ($, _, api, schema) -> ->

    getCollectionObject = (id, callback) ->
        collectionobject = new (api.Resource.forModel 'collectionobject') id: id
        collectionobject.fetch().done callback
        collectionobject

    module 'businessrules'
    test 'business rules pending flag', ->
        expect 3
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.businessRuleMgr.getPromise ->
                collectionobject.on 'businessrulescomplete', (resource) ->
                    ok (not collectionobject.businessRuleMgr.pending), 'not pending'
                    start()
                ok (not collectionobject.businessRuleMgr.pending), 'not pending'
                collectionobject.set 'catalognumber', "999999999"
                ok (collectionobject.businessRuleMgr.pending), 'is pending'

    module 'collection object businessrules'
    test 'dup catalognumber', ->
        expect 3
        stop()
        collectionobject = getCollectionObject 100, ->
            collectionobject.on 'businessrule:catalognumber', (resource, result) ->
                ok true, 'businessrule event is triggered'
                ok (not result.valid), 'field is in valid'
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