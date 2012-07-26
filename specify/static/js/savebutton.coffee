define ['jquery', 'underscore', 'backbone', 'templates'], ($, _, Backbone, templates) ->

    Backbone.View.extend
        events:
            click: 'submit'
        initialize: (options) ->
            @blockers = {}
            @model.on 'saverequired', (blocker) =>
                @$el.prop 'disabled', false
                delete @blockers[blocker.cid]
                if _.isEmpty @blockers
                    @$el.removeClass 'saveblocked'
            @model.on 'saveblocked', (blocker) =>
                @blockers[blocker.cid] = blocker
                @$el.prop 'disabled', false
                @$el.addClass 'saveblocked'
        render: ->
            @$el.prop 'disabled', true
            @dialog = $(templates.saveblocked()).insertAfter(@el).dialog
                resizable: false
                autoOpen: false
            @dialog.parent('.ui-dialog').insertAfter(@el)
        submit: (evt) ->
            evt.preventDefault()
            if _.isEmpty @blockers
                @$el.prop 'disabled', true
                @model.rsave().done => @trigger 'savecomplete'
            else
                list = @dialog.find '.saveblockers'
                list.empty()
                _.each @blockers, (blocker) =>
                    li = $('<li>').appendTo list
                    li.append $('<h3>').text(blocker.specifyModel.getLocalizedName())
                    dl = $('<dl>').appendTo li
                    _.each blocker.businessRuleMgr.fieldResults, (result, fieldName) ->
                        if result.valid then return
                        field = blocker.specifyModel.getField fieldName
                        $('<dt>').text(field.getLocalizedName()).appendTo dl
                        $('<dd>').text(result.reason).appendTo dl
                @dialog.dialog 'open'

