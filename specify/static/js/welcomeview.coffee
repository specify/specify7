define [
    'jquery'
    'underscore'
    'backbone'
    'templates'
    'specifyapi'
    'schema'
    'navigation'
    'icons'
    'specifyform'
    'cs!domain'
    'text!context/app.resource?name=DataEntryTaskInit!noinline'
], ($, _, Backbone, templates, api, schema, navigation, icons, specifyform, domain, formsXML) ->

    formsList = $.parseXML formsXML

    FormsList = Backbone.View.extend
        events:
            'click a': 'navToForm'

        render: ->
            @$el.empty()
            _.each $('view', formsList), (view) =>
                @$el.append @formListItem view
            @

        formListItem: (viewnode) ->
            view = $ viewnode
            domainField = specifyform.getModelForView(view.attr 'view').orgRelationship()
            href = if domainField and domainField.otherSideName
                domain[domainField.name].viewUrl() + domainField.otherSideName + '/new/'
            link = $('<a>', href: href, title: view.attr 'tooltip')
                .text(view.attr 'title')
                .prepend($ '<img>', src: icons.getIcon view.attr 'iconname')

            $('<li>').append link

        navToForm: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop 'href'

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
            new FormsList(el: @$('.forms ul')).render()
            @
