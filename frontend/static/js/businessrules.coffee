define ['jquery', 'underscore', 'specifyapi', 'whenall', 'cs!saveblockers'], ($, _, api, whenAll, saveblockers) ->
    enabled = true

    treeBusinessRules =
        isTreeNode: (resource) ->
            model = resource.specifyModel
            _.all ['parent', 'definition', 'definitionitem'], (field) -> model.getField(field)?

        run: (resource, fieldName) ->
            if not treeBusinessRules.isTreeNode resource then return
            if not (fieldName in ['parent', 'definitionitem', 'name']) then return
            treeBusinessRules.buildFullName(resource, [], true).pipe (acc) ->
                valid: true
                action: -> resource.set 'fullname', acc.reverse().join(' ')

        buildFullName: (resource, acc, start) ->
            recur = (parent, defitem) ->
                if start or defitem.get('isinfullname') then acc.push resource.get 'name'
                if not parent? then acc
                else treeBusinessRules.buildFullName(parent, acc)

            $.when(resource.rget('parent', true), resource.rget('definitionitem', true)).pipe recur


    api.on 'initresource', (resource) ->
        if enabled and not resource.noBusinessRules then attachTo resource

    attachTo = (resource) ->
        mgr = resource.businessRuleMgr = new BusinessRuleMgr resource
        mgr.setupEvents()
        resource.saveBlockers = new saveblockers.SaveBlockers resource
        mgr.doCustomInit()

    class BusinessRuleMgr
        constructor: (@resource) ->
            @rules = rules[@resource.specifyModel.name]
            @fieldChangeDeferreds = {}
            @watchers = {}
            @deleteBlockers = {}
            _.each @rules?.deleteBlockers, (fieldname) =>
                 @deleteBlockers[fieldname] = true

            @isTreeNode = treeBusinessRules.isTreeNode @resource

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

        doCustomInit: -> @rules?.customInit? @resource

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

        changed: (resource) -> if not resource._fetch and not resource._save
            _.each resource.changed, (__, fieldName) => @checkField fieldName

        checkField: (fieldName) ->
            fieldName = fieldName.toLowerCase()
            @fieldChangeDeferreds[fieldName] = deferred = whenAll [
                @doCustomCheck fieldName
                @checkUnique fieldName
                treeBusinessRules.run @resource, fieldName if @isTreeNode
            ]
            deferred.done (results) => if deferred is @fieldChangeDeferreds[fieldName]
                delete @fieldChangeDeferreds[fieldName]
                _.each _.compact(results), (result) =>
                    if not result.valid
                        @resource.saveBlockers.add(result.key, fieldName, result.reason)
                    else
                        @resource.saveBlockers.remove(result.key)
                    result.action?()

        doCustomCheck: (fieldName) -> @rules?.customChecks?[fieldName]? @resource

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

            result = combineUniquenessResults results
            result.key = 'br-uniqueness-' + fieldName
            result

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
                parseInt(otherVal.id, 10) is parseInt(valueId, 10)
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
            others = new resource.specifyModel.Collection()
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

        Determination:
            # these business rules assume the collection of determinations will be fully populated
            customInit: (determination) -> if determination.isNew()
                setCurrentIfNoneIsSet = ->
                    if not (determination.collection.any (other) -> other.get 'iscurrent')
                        determination.set 'iscurrent', true

                if determination.collection? then setCurrentIfNoneIsSet()
                determination.on 'add', setCurrentIfNoneIsSet


            customChecks:
                taxon: (determination) -> determination.rget('taxon', true).pipe (taxon) ->
                    if not taxon?
                        determination.set 'preferredtaxon', null
                        return valid: true

                    recur = (taxon) ->
                        if not taxon.get('isaccepted') and taxon.get('acceptedtaxon')
                            taxon.rget('acceptedtaxon', true).pipe recur
                        else
                            determination.set 'preferredtaxon', taxon
                            valid: true
                    recur taxon

                iscurrent: (determination) ->
                    if determination.get('iscurrent') and determination.collection?
                        determination.collection.each (other) ->
                            if other.cid != determination.cid then other.set 'iscurrent', false
                    valid: true

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
        enable: (e) -> enabled = e
        areEnabled: -> enabled
