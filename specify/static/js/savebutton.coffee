define ['backbone'], (Backbone) ->

    Backbone.View.extend
        events:
            click: 'submit'
        initialize: (options) ->
            @model.on 'saverequired', =>
                @$el.prop 'disabled', false
                @$el.removeClass 'saveblocked'
            @model.on 'saveblocked', =>
                @$el.prop 'disabled', true
                @$el.addClass 'saveblocked'
        render: ->
            @$el.prop 'disabled', true
            @
        submit: (evt) ->
            evt.preventDefault()
            @$el.prop 'disabled', true
            @model.rsave().done => @trigger 'savecomplete'
