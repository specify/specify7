define [
    'jquery'
    'underscore'
    'backbone'
    'specifyapi'
], ($, _, Backbone, api) ->

    Backbone.View.extend
        events: change: 'changed'

        initialize: (options) ->
            @model.on 'change:parent', @render, @
            @lastFetch = null

        render: ->
            @$el.empty()

            @lastFetch = fetch = @model.rget('parent.definitionitem', true).pipe (parentTreeDefItem) ->
                if not parentTreeDefItem then return _([])
                children = new (parentTreeDefItem.constructor.collectionFor())()
                children.queryParams.rankid__gt = parentTreeDefItem.get 'rankid'
                children.fetch(limit: 0).pipe -> children

            fetch.done (children) => if fetch is @lastFetch
                children.each (child) =>
                    @$el.append $('<option>', value: child.url()).text child.get 'name'
                @model.setToOneField @$el.attr('name'), children.first()
            @

        changed: ->
            selected = api.Resource.fromUri @$el.val()
            @model.setToOneField @$el.attr('name'), selected