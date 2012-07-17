define ['jquery', 'underscore', 'whenall'], ($, _, whenAll) ->

    class BusinessRuleMgr
        constructor: (@resource) ->
            @rules = rules[@resource.specifyModel.name]
            @fieldChangeDeferreds = {}
            @deleteBlockers = {}
            _.each @rules?.deleteBlockers, (fieldname) =>
                 @deleteBlockers[fieldname] = true

        setupEvents: ->
            @resource.on 'change', @changed, @
            _.each @resource.specifyModel.getAllFields(), (field) =>
                fieldname = field.name.toLowerCase()
                if field.type is 'one-to-many' and fieldname in (@rules?.deleteBlockers or [])
                    @resource.on "add:#{ fieldname }", => @addDeleteBlocker fieldname
                    # possible race condition if getRelatedObject count goes through before
                    # the deletion associated following remove event occurs
                    # a work around might be to always do destroy({ wait: true })
                    @resource.on "remove:#{ fieldname }", => @tryToRemDeleteBlocker fieldname

        checkCanDelete: ->
            if @canDelete()
                @resource.trigger 'candelete'
                $.when true
            else whenAll(
                _.map @deleteBlockers, (__, fieldname) => @tryToRemDeleteBlocker fieldname)

        canDelete: -> _.isEmpty @deleteBlockers

        addDeleteBlocker: (fieldname) ->
            @deleteBlockers[fieldname] = true
            @resource.trigger 'deleteblocked'

        tryToRemDeleteBlocker: (fieldname) ->
            @resource.getRelatedObjectCount(fieldname).done (count) =>
                if count < 1
                    delete @deleteBlockers[fieldname]
                    if @canDelete() then @resource.trigger 'candelete'

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
            rule = @rules?.fieldChange?[fieldName]
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
        CollectingEvent:
            deleteBlockers: ['collectionobjects']

        Accession:
            deleteBlockers: ['collectionobjects']

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
            mgr.setupEvents()
