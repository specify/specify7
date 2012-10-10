define [
       'jquery'
       'underscore'
        'specifyapi'
        'schema'
        'backbone'
        'cs!saveblockers'
        'cs!agenttypepicklist'
        'cs!tooltipmgr'
], ( $, _, api, schema, Backbone, saveblockers, agentTypesPL, ToolTipMgr) ->

    Backbone.View.extend
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


        setValueIntoModel: -> @model.set @field.name, @$el.val()

        setupOptions: (items, value) ->
            # value maybe undefined, null, a string, or a Backbone model
            # if the latter, we use the URL of the object to represent it
            if value?.url then value = value.url()

            if not @$el.hasClass 'specify-required-field'
                # need an option for no selection
                @$el.append '<option>'

            _(items).each (item) =>
                @$el.append $('<option>', value: item.value).text item.title

            # value will be undefined when creating picklist for new resource
            # so we set the model to have whatever the select element is set to
            if _.isUndefined value
                @setValueIntoModel
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
                    plTable = picklist.get 'tablename'
                    plModel = schema.getModel plTable if plTable
                    if not plModel then picklist.get 'picklistitems' else
                        # items come from another table
                        plItemCollection = new (api.Collection.forModel plModel)()
                        plItemCollection.queryParams.limit = 0

                        plItemCollection.fetch().pipe -> plItemCollection.map (item) ->
                                value: item.url()
                                title: item.get 'name'

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