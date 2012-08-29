define [
    'jquery'
    'underscore'
    'backbone'
    'templates'
    'specifyapi'
    'schema'
    'navigation'
], ($, _, Backbone, templates, api, schema, navigation) ->

    RecordSetsList = Backbone.View.extend
        events:
            'click a': 'navToRecordSet'

        render: ->
            @$el.empty()

            recordsets = new (api.Collection.forModel 'recordset')()
            #recordsets.queryParams.domainfilter = true
            recordsets.fetch().done => recordsets.each (recordset) =>
                @$el.append @recordSetListItem recordset
            @

        recordSetListItem: (recordset) ->
            icon = schema.getModelById(recordset.get 'dbtableid').getIcon()
            $('<li>').append $('<a>', href: recordset.viewUrl())
                .text(recordset.get 'name').prepend $('<img>', src: icon)

        navToRecordSet: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop 'href'

    WelcomeView = Backbone.View.extend
        render: ->
            @$el.addClass "welcome"
            @$el.append templates.welcome()
            new RecordSetsList(el: @$('.recordsets ul')).render()
            @
