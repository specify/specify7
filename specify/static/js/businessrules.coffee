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
            _(options.changes).each (wasChanged, fieldName) =>
                if wasChanged
                    rule = @rules?.fieldChange[fieldName]
                    if rule?
                        deferred = @fieldChangeDeferreds[fieldName] = rule resource
                        @pending = true
                        deferred.done (result) =>
                            if deferred is @fieldChangeDeferreds[fieldName]
                                delete @fieldChangeDeferreds[fieldName]
                                @resource.trigger "businessrule:#{ fieldName }", @resource, result
                                if _.isEmpty @fieldChangeDeferreds
                                    @pending = false
                                    @resource.trigger "businessrulescomplete", @resource
    rules =
        CollectionObject:
            fieldChange:
                catalognumber: (collectionobject) ->
                    collectionobject.rget('collection.collectionobjects').pipe (COs) ->
                        otherCOs = new COs.constructor()
                        _.extend otherCOs.queryParams,
                            collection: COs.parent.id
                            catalognumber: collectionobject.get 'catalognumber'
                        otherCOs.fetch().pipe ->
                            if otherCOs.totalCount is 0
                                valid: true
                            else if otherCOs.totalCount is 1 and otherCOs.at(0).id is collectionobject.id
                                valid: true
                            else
                                valid: false, reason: 'Catalog number already in use'
        AccessionAgent:
            fieldChange:
                role: (accessionagent) ->
                    role = accessionagent.get 'role'
                    sameRoleP = (agent) -> accessionagent.id isnt agent.id and role is agent.get 'role'
                    roleIsDupped = (others) ->
                        if others.filter(sameRoleP).length > 0
                            $.when { valid: false, reason: 'Agent with role already exists' }
                        else
                            $.when valid: true

                    if accessionagent.collection?
                        roleIsDupped(accessionagent.collection)
                    else
                        accessionagent.rget('accession.accessionagents').pipe (AAs) ->
                            others = new AAs.constructor()
                            _.extend others.queryParams,
                                accession: AAs.parent.id,
                                role: role
                            others.fetch().pipe -> roleIsDupped(others)

    businessRules =
        attachToResource: (resource) ->
            mgr = resource.businessRuleMgr = new BusinessRuleMgr resource
            resource.on 'change', mgr.changed, mgr
