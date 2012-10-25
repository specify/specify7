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
    'text!context/app.resource?name=DataEntryTaskInit!noinline'
    'jquery-bbq'
], ($, _, Backbone, templates, api, schema, navigation, icons, specifyform, formsXML) ->

    formsList = $.parseXML formsXML

    FormsList = Backbone.View.extend
        events:
            'click a': 'clicked'

        render: ->
            @$el.empty()
            _.each $('view', formsList), (view) =>
                @$el.append @formListItem view
            @

        formListItem: (viewnode) ->
            view = $ viewnode
            href = @urlForView view.attr 'view'
            link = $('<a>', href: href, title: view.attr 'tooltip')
                .text(view.attr 'title')
                .prepend($ '<img>', src: icons.getIcon view.attr 'iconname')

            $('<li>').append link

        urlForView: (view, recordsetid) ->
            model = specifyform.getModelForView view
            $.param.querystring "/specify/view/#{ model.name.toLowerCase() }/new/",
                view: view
                recordsetid: recordsetid

        clicked: (evt) ->
            evt.preventDefault()
            if @recordsets then return

            params = $.deparam.querystring $(evt.currentTarget).prop 'href'
            model = specifyform.getModelForView params.view
            @recordsets = new (api.Collection.forModel 'recordset')()
            _.extend @recordsets.queryParams,
                domainfilter: true
                dbtableid: model.tableId
            @recordsets.fetch().done => @makeDialog(params.view)

        makeDialog: (view) ->
            dialog = $ templates.recordsetchooser()
            tmpl = dialog.find('input[value="template"]').parent()
            @recordsets.each (recordset) ->
                newLi = tmpl.clone().insertBefore tmpl
                newLi.find('input').prop 'value', recordset.id
                newLi.find('.recordset-name').text recordset.get 'name'
            tmpl.remove()

            dialog.dialog
                buttons: ok: =>
                    choice = dialog.find('input:checked').val()
                    switch choice
                        when "new"
                            name = dialog.find('[name="name"]').val()
                            @createRecordSet(name, view).done (recordset) =>
                                navigation.go @urlForView view, recordset.id
                        when "none"
                            navigation.go @urlForView view
                        else
                            navigation.go @urlForView view, choice
                close: =>
                    dialog.remove()
                    @recordsets = null

        createRecordSet: (name, view) ->
            model = specifyform.getModelForView view
            recordset = new (api.Resource.forModel 'recordset')
                dbtableid: model.tableId
                name: name
                type: 0
            recordset.save().pipe -> recordset


    RecordSetsList = Backbone.View.extend
        events:
            'click a': 'navToRecordSet'

        render: ->
            @$el.empty()

            recordsets = new (api.Collection.forModel 'recordset')()
            recordsets.queryParams.domainfilter = true
            recordsets.fetch().done => recordsets.each (recordset) =>
                @$el.append @recordSetListItem recordset
            @

        recordSetListItem: (recordset) ->
            icon = schema.getModelById(recordset.get 'dbtableid').getIcon()
            $('<li>').append $('<a>', href: "/specify/recordset/#{ recordset.id }/")
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
