define [], ->
    onBR: (resource, result) ->
        if result.valid then @resetInvalid() else @showInvalid(result.reason)

    showInvalid: (message) ->
        @_savedBGColor ?= @$el.css 'background-color'
        @_savedTooltip ?= @$el.attr 'title'
        @$el.css('background-color', 'red').attr('title', message)

    resetInvalid: ->
        @$el.css 'background-color', @_savedBGColor
        if @_savedTooltip
            @$el.attr 'title', @_savedTooltip
        else
            @$el.removeAttr 'title'
