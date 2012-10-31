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

            @lastFetch = fetch = @model.rget('parent.definitionitem', true).pipe (parentTreeDefItem) ->
                if not parentTreeDefItem then return _([])
                children = new (parentTreeDefItem.constructor.collectionFor())()
                children.queryParams.rankid__gt = parentTreeDefItem.get 'rankid'
                children.limit = 0
                children.fetch().pipe -> children

            fetch.done (children) =>
                if fetch is @lastFetch then children.each (child) =>
                    @$el.append $('<option>', value: child.url()).text child.get 'name'
            @