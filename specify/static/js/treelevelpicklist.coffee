define [
    'jquery'
    'underscore'
    'backbone'
], ($, _, Backbone) ->

    Backbone.View.extend
        initialize: (options) ->
            @model.on 'change:parent', @render, @
            @lastFetch = null

        render: ->
            @$el.empty()
            @lastFetch = fetch = @model.rget('parent.definitionitem.children', true).done (options) =>
                if fetch is @lastFetch then options.each (option) =>
                    @$el.append $('<option>', value: option.url()).text option.get 'name'
            @