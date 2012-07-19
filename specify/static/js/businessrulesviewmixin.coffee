define [], ->
    enableBusinessRulesMixin: (fieldname, control) ->
        @_brControl = control or @$el
        @model.on "businessrule:#{ fieldname.toLowerCase() }", (resource, result) =>
            if result.valid then @_brResetInvalid() else @_brShowInvalid(result.reason)

    _brShowInvalid: (message) ->
        @_brSavedBGColor ?= @_brControl.css 'background-color'
        @_brSavedTooltip ?= @_brControl.attr 'title'
        @_brControl.css('background-color', 'red').attr('title', message)

    _brResetInvalid: ->
        @_brControl.css 'background-color', @_brSavedBGColor
        if @_brSavedTooltip
            @_brControl.attr 'title', @_brSavedTooltip
        else
            @_brControl.removeAttr 'title'
