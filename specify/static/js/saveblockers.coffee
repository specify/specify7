define [], () ->

    SaveBlockers: class SaveBlockers
        constructor: (@resource) ->
            @blockers = {}

        add: (key, field, reason) ->
            field = field?.toLowerCase()
            @blockers[key] = { field: field, reason: reason }
            @resource.trigger 'saveblocked', @resource
            if field? then @resource.trigger "saveblocked:#{ field }"

        remove: (key) ->
            field = @blockers[key]?.field
            delete @blockers[key]
            if field? and _.isEmpty @blockersForField field
                @resource.trigger "nosaveblockers:#{ field }"
            if @resource.needsSaved and _.isEmpty @blockers
                @resource.trigger 'saverequired', @resource

        blockersForField: (field) ->
            _.filter @blockers, (blocker) -> blocker.field is field

    FieldViewEnhancer: class FieldViewEnhancer
        constructor: (@view, fieldName, control) ->
            @field = fieldName.toLowerCase()
            @control = control or @view.$el
            @view.model.on "saveblocked:#{ @field }", @indicatorOn, @
            @view.model.on "nosaveblockers:#{ @field }", @indicatorOff, @

        indicatorOn: ->
            @savedToolTip ?= @control.attr 'title'
            reasons = _.pluck @view.model.saveBlockers.blockersForField(@field), 'reason'
            @control.addClass('saveblocked').attr 'title', reasons.join(' ')

        indicatorOff: ->
            @control.removeClass 'saveblocked'
            @control.attr 'title', @savedToolTip if @savedToolTip
