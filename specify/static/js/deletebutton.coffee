define ['jquery', 'underscore', 'backbone', 'templates'], ($, _, Backbone, templates) ->

    Backbone.View.extend
        events:
            click: 'openDialog'

        initialize: (options) ->
            @model.on 'candelete', =>
                @button.prop 'disabled', false
                @setToolTip()

            @model.on 'deleteblocked', =>
                @button.prop 'disabled', true
                @setToolTip()

        render: ->
            @button = $('<input type="button" value="Delete">').appendTo @el
            @button.prop 'disabled', true
            @dialog = $(templates.confirmdelete()).appendTo(@el).dialog
                resizable: false
                autoOpen: false
                modal: true
                buttons:
                    'Delete': => @doDelete()
                    'Cancel': => @dialog.dialog 'close'

            @dialog.parent('.ui-dialog').appendTo @el
            @dialog.on 'remove', -> $(@).detach()

            @model.businessRuleMgr.checkCanDelete().done => @setToolTip()
            @

        openDialog: (evt) ->
            evt.preventDefault()
            @dialog.dialog 'open'

        doDelete: ->
            $.when(@model.destroy()).done => @trigger 'deleted'
            @dialog.dialog 'close'

        setToolTip: ->
            title = _.map(@model.businessRuleMgr.deleteBlockers, (__, field) -> field).join(', ')
            @button.attr 'title', title
