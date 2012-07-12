define ['jquery', 'underscore', 'specifyapi', 'schema'], ($, _, api, schema) -> ->

    module 'collection object businessrules'
    test 'dup catalognumber', ->
        expect 2
        stop()
        collectionobject = new (api.Resource.forModel 'collectionobject') id: 100
        collectionobject.fetchIfNotPopulated().done ->
            collectionobject.on 'businessruleerror:catalognumber', (resource, result) ->
                ok (not result.valid), 'businessruleerror is triggerred'
                equal result.reason, 'Catalog number already in use', 'catalog number is dupped'
                start()
            collectionobject.set 'catalognumber',  "000037799"
