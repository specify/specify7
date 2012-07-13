define ['jquery', 'underscore'], ($, _) ->

    class BusinessRuleMgr
        constructor: (@resource) ->
            @fieldChangeDeferreds = {}
            @rules = rules[@resource.specifyModel.name]

        getPromise: (cb) ->
            promise = $.Deferred()
            if @pending
                @resource.on 'businessrulescomplete', -> promise.resolve()
            else
                promise.resolve()
            if cb? then promise.done(cb)
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

    uniqueFor = (toOneField, resource, valueField) ->
        fieldInfo = resource.specifyModel.getField(toOneField)
        value = resource.get valueField
        sameValueP = (other) -> other.id isnt resource.id and value is other.get valueField
        valueIsDupedIn = (others) ->
            if others.filter(sameValueP).length > 0
                $.when { valid: false, reason: "Value must be unique to #{ toOneField }" }
            else
                $.when valid: true
        if fieldInfo.getRelatedModel() is resource.collection?.parent?.specifyModel
            valueIsDupedIn resource.collection
        else
            resource.rget("#{ toOneField }.#{ fieldInfo.otherSideName }").pipe (collection) ->
                others = new collection.constructor()
                others.queryParams[toOneField] = collection.parent.id
                others.queryParams[valueField] = value
                others.fetch().pipe -> valueIsDupedIn(others)

    rules =
        CollectionObject:
            fieldChange:
                catalognumber: (collectionobject) ->
                    uniqueFor 'collection', collectionobject, 'catalognumber'

        AccessionAgent:
            fieldChange:
                role: (accessionagent) ->
                    uniqueFor 'accession', accessionagent, 'role'

    businessRules =
        attachToResource: (resource) ->
            mgr = resource.businessRuleMgr = new BusinessRuleMgr resource
            resource.on 'change', mgr.changed, mgr
