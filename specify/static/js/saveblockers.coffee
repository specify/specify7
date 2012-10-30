define ['jquery', 'underscore'], ($, _) ->

    SaveBlockers: class SaveBlockers
        constructor: (@resource) ->
            @blockers = {}
            @resource.on 'saveblocked', (source, blocker) =>
                @resource.parent?.trigger 'saveblocked', source, blocker
                @resource.collection?.parent?.trigger 'saveblocked', source, blocker
            @resource.on 'oktosave', (source) =>
                @resource.parent?.trigger 'oktosave', source
                @resource.collection?.parent.trigger 'oktosave', source

        add: (key, field, reason) ->
            field = field?.toLowerCase()
            @blockers[key] = blocker = { field: field, reason: reason }
            @resource.trigger 'saveblocked', @resource, blocker
            if field? then @resource.trigger "saveblocked:#{ field }", @resource, blocker

        remove: (key) ->
            if not @blockers[key]? then return
            field = @blockers[key]?.field
            delete @blockers[key]
            if field? and _.isEmpty @blockersForField field
                @resource.trigger "nosaveblockers:#{ field }"
            if  _.isEmpty @blockers
                @resource.trigger 'oktosave', @resource

        getAll: -> @blockers

        blockersForField: (field) ->
            _.filter @blockers, (blocker) -> blocker.field is field

    FieldViewEnhancer: class FieldViewEnhancer
        constructor: (@view, fieldName, control) ->
            @field = fieldName.toLowerCase()
            @control = control or @view.$el
            @view.model.on "saveblocked:#{ @field }", @indicatorOn, @
            @view.model.on "nosaveblockers:#{ @field }", @indicatorOff, @
            @view.on 'requestfortooltips', @sendToolTips, @

        indicatorOn: ->
            @control.addClass 'saveblocked'

        indicatorOff: ->
            @control.removeClass 'saveblocked'

        sendToolTips: ->
            _.each @view.model.saveBlockers.blockersForField(@field), (blocker) =>
                @view.trigger 'tooltipitem', blocker.reason
