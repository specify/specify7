define ['jquery', 'underscore', 'backbone', 'templates'], ($, _, Backbone, templates) ->

    Backbone.View.extend
        events:
            'click .delete-button': 'openDialog'

        initialize: (options) ->
            @model.on 'candelete', =>
                @button.prop 'disabled', false
                @setToolTip()

            @model.on 'deleteblocked', =>
                @button.prop 'disabled', true
                @setToolTip()

        render: ->
            @button = $('<input type="button" value="Delete" class="delete-button">').appendTo @el
            @button.prop 'disabled', true
            @dialog = $(templates.confirmdelete()).appendTo(@el).dialog
                resizable: false
                autoOpen: false
                modal: true
                buttons:
                    'Delete': => @doDelete()
                    'Cancel': -> $(this).dialog 'close'

            @dialog.parent('.ui-dialog').appendTo @el
            @dialog.on 'remove', -> $(@).detach()

            @model.businessRuleMgr.checkCanDelete().done => @setToolTip()
            @

        openDialog: (evt) ->
            evt.preventDefault()
            @dialog.dialog 'open'

        doDelete: ->
            @model.destroy().done => @trigger 'deleted'
            @dialog.dialog 'close'

        setToolTip: ->
            blockers = _.map @model.businessRuleMgr.deleteBlockers, (__, field) -> field
            @button.attr 'title', blockers.join ', '
