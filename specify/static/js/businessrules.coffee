define ['jquery', 'underscore'], ($, _) ->

    class BusinessRuleMgr
        constructor: (@resource) ->
            @fieldChangeDeferreds = {}
            @rules = rules[@resource.specifyModel.name]

        getPromise: (callback) ->
            promise = $.Deferred()
            if @pending
                @resource.on 'businessrulescomplete', -> promise.resolve()
            else
                promise.resolve()
            if callback? then promise.done callback
            promise

        changed: (resource, options) ->
            _.each options.changes, (wasChanged, fieldName) => @checkField fieldName if wasChanged

        checkField: (fieldName) ->
            fieldName = fieldName.toLowerCase()
            rule = @rules?.fieldChange[fieldName]
            if rule?
                deferred = @fieldChangeDeferreds[fieldName] = rule @resource
                @pending = true
                deferred.done (result) =>
                    if deferred is @fieldChangeDeferreds[fieldName]
                        delete @fieldChangeDeferreds[fieldName]
                        @resource.trigger "businessrule:#{ fieldName }", @resource, result
                        if _.isEmpty @fieldChangeDeferreds
                            @pending = false
                            @resource.trigger "businessrulescomplete", @resource

    uniqueIn = (toOneField, resource, valueField) ->
        fieldInfo = resource.specifyModel.getField toOneField
        value = resource.get valueField
        sameValueP = (other) -> other.id isnt resource.id and value is other.get valueField
        valueIsDupedIn = (others) -> (_.filter others, sameValueP).length > 0
        haveLocalColl = fieldInfo.getRelatedModel() is resource.collection?.parent?.specifyModel
        resource.rget("#{ toOneField }.#{ fieldInfo.otherSideName }").pipe (collection) ->
            others = new collection.constructor()
            others.queryParams[toOneField] = collection.parent.id
            others.queryParams[valueField] = value
            others.fetch().pipe ->
                databaseOnly = others.chain().compact().filter( (other) ->
                    # remove fetched objects that are in our local collection
                    (not haveLocalColl) || (not (resource.collection.get other.id))
                ).value()
                localCollection = if haveLocalColl then (_.compact resource.collection.models) else []
                if (valueIsDupedIn databaseOnly) or (valueIsDupedIn localCollection)
                    { valid: false, reason: "Value must be unique to #{ toOneField }" }
                else
                    valid: true

    rules =
        CollectionObject:
            fieldChange:
                catalognumber: (collectionobject) ->
                    uniqueIn 'collection', collectionobject, 'catalognumber'

        AccessionAgent:
            fieldChange:
                role: (accessionagent) ->
                    uniqueIn 'accession', accessionagent, 'role'

    businessRules =
        attachToResource: (resource) ->
            mgr = resource.businessRuleMgr = new BusinessRuleMgr resource
            resource.on 'change', mgr.changed, mgr
