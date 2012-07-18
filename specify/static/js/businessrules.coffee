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
            @checkUnique fieldName

        checkUnique: (fieldName) ->
            deferred = if fieldName in (@rules?.unique or [])
                uniqueIn null, @resource, fieldName
            else
                toOneField = @rules?.uniqueIn?[fieldName]
                uniqueIn toOneField, @resource, fieldName if toOneField?

            if deferred
                @fieldChangeDeferreds[fieldName] = deferred
                @pending = true
                deferred.done (result) =>
                    if deferred is @fieldChangeDeferreds[fieldName]
                        delete @fieldChangeDeferreds[fieldName]
                        @resource.trigger "businessrule:#{ fieldName }", @resource, result
                        if _.isEmpty @fieldChangeDeferreds
                            @pending = false
                            @resource.trigger "businessrulescomplete", @resource

    uniqueIn = (toOneField, resource, valueField) ->
        valid = valid: true
        invalid = { valid: false, reason: "Value must be unique to #{ toOneField or 'database' }" }
        value = resource.get valueField
        sameValueP = (other) -> other.id isnt resource.id and value is other.get valueField
        valueIsDupedIn = (others) -> (_.filter others, sameValueP).length > 0
        if toOneField?
            fieldInfo = resource.specifyModel.getField toOneField
            haveLocalColl = fieldInfo.getRelatedModel() is resource.collection?.parent?.specifyModel
            localCollection = if haveLocalColl then (_.compact resource.collection.models) else []
            if valueIsDupedIn localCollection then return $.when invalid
            resource.rget("#{ toOneField }.#{ fieldInfo.otherSideName }").pipe (collection) ->
                others = new collection.constructor()
                others.queryParams[toOneField] = collection.parent.id
                others.queryParams[valueField] = value
                others.fetch().pipe ->
                    database = others.chain().compact().filter( (other) ->
                        # remove fetched objects that are in our local collection
                        (not haveLocalColl) || (not (resource.collection.get other.id))
                    ).value()
                    if valueIsDupedIn database then invalid else valid
        else
            # no toOneField indicates globally unique field
            others = new (resource.constructor.collectionFor())()
            others.queryParams[valueField] = value
            others.fetch().pipe -> if valueIsDupedIn others.models then invalid else valid

    rules =
        Accession:
            deleteBlockers: ['collectionobjects']
            uniqueIn:
                accessionnumber: 'division'

        AccessionAgent:
            uniqueIn:
                role: 'accession'

        Appraisal:
            uniqueIn:
                appraisalnumber: 'accession'

        Author:
            uniqueIn:
                agent: 'referencework'

        BorrowAgent:
            uniqueIn:
                role: 'borrow'

        Collection:
            deleteBlockers: ['collectionobjects']
            uniqueIn:
                name: 'discipline'

        CollectingEvent:
            deleteBlockers: ['collectionobjects']

        CollectionObject:
            uniqueIn:
                catalognumber: 'collection'

        Collector:
            uniqueIn:
                agent: 'collectingevent'

        Discipline:
            uniqueIn:
                name: 'division'

        Division:
            uniqueIn:
                name: 'institution'

        Gift:
            uniqueIn:
                giftnumber: 'discipline'

        Institution:
            unique: ['name']

        Journal:
            deleteBlockers: ['referenceworks']

        Loan:
            uniqueIn:
                loannumber: 'discipline'

        # Locality:
        #     # deleteBlockers: ['collectingevents'] # this relationship is missing from the datamodel

        # # Permit:
        # #     uniqueIn:
        # #         permitnumber: '' # no to-one field!!!

        Picklist:
            uniqueIn:
                name: 'collection'

        Preparation:
            deleteBlockers: ['preparationattachments']

        Preptype:
            deletBlockers: ['preparations']
            uniqueIn:
                name: 'collection'

        Repositoryagreement:
            deleteBlockers: ['accessions']
            uniqueIn:
                repositoryagreementnumber: 'division'

    businessRules =
        attachToResource: (resource) ->
            mgr = resource.businessRuleMgr = new BusinessRuleMgr resource
            mgr.setupEvents()
