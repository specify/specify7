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

            @model.businessRuleMgr.checkCanDelete().done => @setToolTip()
            @

        openDialog: (evt) ->
            evt.preventDefault()
            dialog = $(templates.confirmdelete()).appendTo(@el).dialog
                resizable: false
                close: -> dialog.remove()
                modal: true
                buttons:
                    'Delete': =>
                        @doDelete()
                        dialog.dialog 'close'
                    'Cancel': -> dialog.dialog 'close'


        doDelete: ->
            @model.destroy().done => @trigger 'deleted'

        setToolTip: ->
            blockers = _.map @model.businessRuleMgr.deleteBlockers, (__, field) -> field
            @button.attr 'title', blockers.join ', '
