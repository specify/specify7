define ['jquery', 'underscore', 'backbone', 'templates'], ($, _, Backbone, templates) ->

    Backbone.View.extend
        events:
            'click :submit': 'submit'

        initialize: (options) ->
            @blockingResources = {}
            @saveBlocked = false
            @buttonsDisabled = true

            if @model.isNew() then @setButtonsDisabled false

            @model.on 'saverequired', (resource) =>
                @setButtonsDisabled false

            @model.on 'oktosave', (resource) =>
                @removeBlocker resource

            @model.on 'saveblocked', (blocker) =>
                @blockingResources[blocker.resource.cid] ?=
                    blocker.resource.on 'destroy', @removeBlocker, @
                @setButtonsDisabled true if not blocker.deferred
                @setSaveBlocked true if not blocker.deferred

        setButtonsDisabled: (state) ->
            @buttonsDisabled = state
            @buttons?.prop 'disabled', state

        setSaveBlocked: (saveBlocked) ->
            @saveBlocked = saveBlocked
            @buttons?[if saveBlocked then 'addClass' else 'removeClass'] 'saveblocked'

        removeBlocker: (resource) ->
            delete @blockingResources[resource.cid]
            onlyDeferreds = _.all @blockingResources, (br) -> br.saveBlockers.hasOnlyDeferredBlockers()
            @setSaveBlocked false if onlyDeferreds

        render: ->
            @$el.addClass 'savebutton'
            @$el.append $ '<input>'
                type: "submit"
                class: "save-button"
                value: "Save"

            if @options.addAnother then @$el.append $ '<input>'
                type: "submit"
                class: "save-and-add-button"
                value: "Save and Add Another"

            @buttons = @$(':submit')
            @buttons.appendTo(@el)

            # get buttons to match current state
            @setButtonsDisabled @buttonsDisabled
            @setSaveBlocked @saveBlocked
            @

        submit: (evt) ->
            evt.preventDefault()

            _.each @blockingResources, (resource) ->
                resource.saveBlockers.fireDeferredBlockers()

            if _.isEmpty @blockingResources
                @setButtonsDisabled true
                addAnother = $(evt.currentTarget).is '.save-and-add-button'

                # This has to be done before saving so that the data we get back isn't copied.
                # Eg. autonumber fields, the id, etc.
                newResource = @model.clone() if addAnother
                wasNew = @model.isNew()

                @model.save().done => @trigger 'savecomplete',
                    addAnother: addAnother
                    newResource: newResource
                    wasNew: wasNew
            else
                dialog = $(templates.saveblocked()).appendTo(@el).dialog
                    resizable: false
                    close: -> dialog.remove()

                list = dialog.find '.saveblockers'
                list.empty()
                _.each @blockingResources, (resource) =>
                    li = $('<li>').appendTo list
                    li.append $('<h3>').text(resource.specifyModel.getLocalizedName())
                    dl = $('<dl>').appendTo li
                    _.each resource.saveBlockers.getAll(), (blocker) ->
                        field = resource.specifyModel.getField blocker.field if blocker.field?
                        $('<dt>').text(field?.getLocalizedName() or '').appendTo dl
                        $('<dd>').text(blocker.reason).appendTo dl

