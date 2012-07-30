define ['jquery', 'underscore', 'whenall'], ($, _, whenAll) ->

    class BusinessRuleMgr
        constructor: (@resource) ->
            @rules = rules[@resource.specifyModel.name]
            @fieldChangeDeferreds = {}
            @deleteBlockers = {}
            @fieldResults = {}
            @watchers = {}
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
                _.map @deleteBlockers, (__, fieldname) => @tryToRemDeleteBlocker fieldname
            )

        canDelete: -> _.isEmpty @deleteBlockers

        addDeleteBlocker: (fieldname) ->
            @deleteBlockers[fieldname] = true
            @resource.trigger 'deleteblocked'

        tryToRemDeleteBlocker: (fieldname) ->
            @resource.getRelatedObjectCount(fieldname).done (count) =>
                if count < 1
                    delete @deleteBlockers[fieldname]
                    if @canDelete() then @resource.trigger 'candelete'

        changed: (resource, options) ->
            _.each options.changes, (wasChanged, fieldName) => @checkField fieldName if wasChanged

        checkField: (fieldName) ->
            fieldName = fieldName.toLowerCase()
            @fieldChangeDeferreds[fieldName] = deferred = @checkUnique fieldName
            deferred.done (result) =>
                if deferred is @fieldChangeDeferreds[fieldName]
                    delete @fieldChangeDeferreds[fieldName]
                    @fieldResults[fieldName] = result
                    @resource.trigger "businessrule:#{ fieldName }", @resource, result
                    if _.isEmpty @fieldChangeDeferreds
                        @resource.trigger "businessrulescomplete", @resource
                        if @resource.needsSaved then @resource.trigger (
                            if (_.all @fieldResults, (result) -> result.valid)
                                'saverequired'
                            else
                                'saveblocked'
                        ), @resource

        checkUnique: (fieldName) ->
            results = if fieldName in (@rules?.unique or [])
                [uniqueIn null, @resource, fieldName]
            else
                toOneFields = @rules?.uniqueIn?[fieldName] or []
                if not _.isArray toOneFields
                    toOneFields = [toOneFields]
                _.map toOneFields, (field) => uniqueIn field, @resource, fieldName

            whenAll(results).done (results) =>
                _.chain(results).pluck('localDupes').compact().flatten().each (dup) =>
                    @watchers[dup.cid + ':' + fieldName] ?= dup.on 'change remove', =>
                        @checkField fieldName

            combineUniquenessResults results

    combineUniquenessResults = (deferredResults) -> whenAll(deferredResults).pipe (results) ->
        invalids = _.filter results, (result) -> not result.valid
        if invalids.length < 1
            valid: true
        else
            valid: false, reason: _(invalids).pluck('reason').join ', '

    uniqueIn = (toOneField, resource, valueField) ->
        valid = valid: true
        invalid = { valid: false, reason: "Value must be unique to #{ toOneField or 'database' }" }

        value = resource.get valueField
        valueIsToOne = resource.specifyModel.getField(valueField).type is 'many-to-one'
        if valueIsToOne
            # kinda kludgy way to get id
            valueId = if _.isString value then resource.constructor.fromUri(value).id else value.id

        hasSameValue = (other) ->
            if other.id? and other.id is resource.id then return false
            if other.cid is resource.cid then return false
            otherVal = other.get valueField
            if valueIsToOne and not (_.isString otherVal)
                otherVal.id is valueId
            else
                value is other.get valueField

        if toOneField?
            fieldInfo = resource.specifyModel.getField toOneField
            haveLocalColl = fieldInfo.getRelatedModel() is resource.collection?.parent?.specifyModel
            localCollection = if haveLocalColl then (_.compact resource.collection.models) else []

            dupes = _.filter localCollection, hasSameValue
            if dupes.length > 0
                invalid.localDupes = dupes
                return $.when invalid

            resource.rget("#{ toOneField }.#{ fieldInfo.otherSideName }").pipe (collection) ->
                if not collection? then return valid
                others = new collection.constructor()
                others.queryParams[toOneField] = collection.parent.id
                others.queryParams[valueField] = valueId or value
                others.fetch().pipe ->
                    inDatabase = others.chain().compact()
                    inDatabase = if haveLocalColl
                        # remove items that we have locally
                        inDatabase.filter((other) -> not (resource.collection.get other.id)).value()
                    else inDatabase.value()
                    if _.any inDatabase, hasSameValue then invalid else valid
        else
            # no toOneField indicates globally unique field
            others = new (resource.constructor.collectionFor())()
            others.queryParams[valueField] = valueId or value
            others.fetch().pipe -> if _.any others.models, hasSameValue then invalid else valid

    rules =
        Accession:
            deleteBlockers: ['collectionobjects']
            uniqueIn:
                accessionnumber: 'division'

        AccessionAgent:
            uniqueIn:
                role: ['accession', 'repositoryagreement']

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

        PrepType:
            deleteBlockers: ['preparations']
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
