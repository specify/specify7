define [
       'jquery'
       'underscore'
        'specifyapi'
        'schema'
        'backbone'
        'dataobjformatters'
        'cs!saveblockers'
        'cs!agenttypepicklist'
        'cs!tooltipmgr'
        'whenall'
], ( $, _, api, schema, Backbone, dataobjformatters, saveblockers, agentTypesPL, ToolTipMgr, whenAll) ->

    objformat = dataobjformatters.format

    Backbone.View.extend
        __name__: "PickListView"
        events:
            change: 'setValueIntoModel'

        initialize: (options) ->
            @field = @model.specifyModel.getField @$el.attr 'name'
            if not @field?
                console.log "can't setup picklist for unknown field #{ @model.specifyModel.name }.#{ @$el.attr 'name' }"
                return

            @isAgentType = @model.specifyModel.name is 'Agent' and @field.name is 'agentType'
            @pickListName = @field.getPickList()

            # TODO: should check for picklist attribute on element

            if not @pickListName and not @isAgentType
                console.log "can't determine picklist for field #{ @model.specifyModel.name }.#{ @field.name }"
                return

            @initialized = true


        setValueIntoModel: ->
            value = @$el.val() or null
            if @isAgentType and value?
                value = parseInt value, 10
            @model.set @field.name, value

        setupOptions: (items, value) ->
            # value maybe undefined, null, a string, or a Backbone model
            # if the latter, we use the URL of the object to represent it
            if value?.url then value = value.url()

            if not @$el.hasClass 'specify-required-field'
                # need an option for no selection
                @$el.append '<option>'

            _(items).each (item) =>
                if item.value
                    @$el.append $('<option>', value: item.value).text item.title

            # value will be undefined when creating picklist for new resource
            # so we set the model to have whatever the select element is set to
            if _.isUndefined value
                @setValueIntoModel()
                return

            # value is now either null or a string
            value = value or ''

            if (value and _.all items, (item) -> item.value is not value)
                # current value is not in picklist
                @$el.append $('<option>', value: value).text "#{ value } (current, invalid value)"

            if (not value and @$el.hasClass 'specify-required-field')
                # value is required but missing from database
                @$el.append '<option>Invalid null selection</option>'

            @$el.val value

            # run business rules to make sure current value is acceptable
            @model.businessRuleMgr.checkField @field.name

        getPickListItems: ->
            if @isAgentType then agentTypesPL else
                api.getPickListByName(@pickListName).pipe (picklist) ->
                    limit = picklist.get 'sizelimit'
                    limit = 0 if limit < 1
                    switch picklist.get 'type'
                        when 0 # items in picklistitems table
                            picklist.rget('picklistitems').pipe (plItemCollection) ->
                                if plItemCollection.isComplete
                                     plItemCollection.toJSON()
                                else
                                     plItemCollection.fetch(limit: limit).pipe ->
                                        plItemCollection.toJSON()
                        when 1 # items are objects from a table
                            plModel = schema.getModel picklist.get 'tablename'
                            plItemCollection = new plModel.LazyCollection()
                            plItemCollection.fetch( limit: limit ).pipe ->
                                whenAll plItemCollection.map (item) ->
                                    objformat(item, picklist.get 'formatter').pipe (title) ->
                                        value: item.url()
                                        title: title
                        when 2 # items are fields from a table
                            plModel = schema.getModel picklist.get 'tablename'
                            plFieldName = picklist.get 'fieldname'
                            api.getRows(plModel, {limit: limit, fields: [plFieldName], distinct: true}).pipe (rows) ->
                                _.map rows, (row) -> {value: row[0], title: row[0]}
                        else
                            throw new Error 'unknown picklist type'

        render: ->
            if not @initialized
                console.log 'not initialized'
                return @
            if @rendered
                throw new Exception 'already rendered'
            @rendered = true

            getValue = @model.rget @field.name

            $.when(@getPickListItems(), getValue).done (items, value) =>
                @setupOptions items, value
                @model.onChange @field.name, (value) => @$el.val value

            @toolTipMgr = new ToolTipMgr(@).enable()
            @saveblockerEnhancement = new saveblockers.FieldViewEnhancer @, @field.name
            @
