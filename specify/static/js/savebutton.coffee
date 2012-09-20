define ['jquery', 'underscore', 'backbone', 'templates'], ($, _, Backbone, templates) ->

    Backbone.View.extend
        events:
            'click :submit': 'submit'

        initialize: (options) ->
            @blockers = {}

            @model.on 'saverequired', (resource) =>
                @buttons.prop 'disabled', false

            @model.on 'oktosave', (resource) =>
                @removeBlocker resource

            @model.on 'saveblocked', (resource) =>
                @blockers[resource.cid] ?= resource.on 'destroy', @removeBlocker, @
                @buttons.prop 'disabled', false
                @buttons.addClass 'saveblocked'

        removeBlocker: (resource) ->
            delete @blockers[resource.cid]
            if _.isEmpty @blockers
                @buttons.removeClass 'saveblocked'

        render: ->
            @$el.append $ '<input>'
                type: "submit"
                class: "save-button"
                value: "Save"

            if @options.addAnother then @$el.append $ '<input>'
                type: "submit"
                class: "save-and-add-button"
                value: "Save and Add Another"

            @buttons = @$(':submit')
            @buttons.appendTo(@el).prop 'disabled', true

            @dialog = $(templates.saveblocked()).appendTo(@el).dialog
                resizable: false
                autoOpen: false
            @dialog.parent('.ui-dialog').appendTo @el
            @dialog.on 'remove', -> $(@).detach()
            @

        submit: (evt) ->
            evt.preventDefault()
            if _.isEmpty @blockers
                @buttons.prop 'disabled', true
                @model.rsave().done => @trigger 'savecomplete',
                    addAnother: $(evt.currentTarget).is '.save-and-add-button'
            else
                list = @dialog.find '.saveblockers'
                list.empty()
                _.each @blockers, (resource) =>
                    li = $('<li>').appendTo list
                    li.append $('<h3>').text(resource.specifyModel.getLocalizedName())
                    dl = $('<dl>').appendTo li
                    _.each resource.saveBlockers.getAll(), (blocker) ->
                        field = resource.specifyModel.getField blocker.field if blocker.field?
                        $('<dt>').text(field?.getLocalizedName() or '').appendTo dl
                        $('<dd>').text(blocker.reason).appendTo dl
                @dialog.dialog 'open'
