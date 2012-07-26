define [], ->
    enableBusinessRulesMixin: (fieldname, control) ->
        @_brControl = control or @$el
        @model.on "businessrule:#{ fieldname.toLowerCase() }", (resource, result) =>
            if result.valid then @_brResetInvalid() else @_brShowInvalid(result.reason)

    _brShowInvalid: (message) ->
        @_brSavedTooltip ?= @_brControl.attr 'title'
        @_brControl.addClass('businessruleviolated').attr('title', message)

    _brResetInvalid: ->
        @_brControl.removeClass('businessruleviolated')
        if @_brSavedTooltip
            @_brControl.attr 'title', @_brSavedTooltip
        else
            @_brControl.removeAttr 'title'
