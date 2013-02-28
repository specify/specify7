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
    'cs!appresource'
    'jquery-bbq'
], ($, _, Backbone, templates, api, schema, navigation, icons, specifyform, getAppResource) ->

    formsList = getAppResource 'DataEntryTaskInit'

    FormsList = Backbone.View.extend
        render: ->
            @$el.empty()
            formsList.done (forms) => _.each $('view', forms), (view) =>
                @$el.append (new FormListItem el: '<li>', viewNode: view).render().el
            @


    FormListItem = Backbone.View.extend
        events:
            'click a': 'clicked'

        initialize: (options) ->
            @viewListNode = $ @options.viewNode

        render: ->
            @$el.empty()
            specifyform.getView(@viewListNode.attr 'view').done (view) =>
                @view = view
                @model = schema.getModel view.class.split('.').pop()
                @$el.append $('<a>', title: @viewListNode.attr 'tooltip')
                    .text(@viewListNode.attr 'title')
                    .prepend($ '<img>', src: icons.getIcon @viewListNode.attr 'iconname')
            @

        url: (recordsetid) ->
            $.param.querystring "/specify/view/#{ @model.name.toLowerCase() }/new/",
                view: @view.name
                recordsetid: recordsetid

        clicked: (evt) ->
            evt.preventDefault()
            if @recordsets then return

            @recordsets = new (api.Collection.forModel 'recordset')()
            _.extend @recordsets.queryParams,
                domainfilter: true
                dbtableid: @model.tableId
            @recordsets.fetch().done () => @makeDialog()

        makeDialog: ->
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
                            @createRecordSet(name).done (recordset) =>
                                navigation.go @url recordset.id
                        when "none"
                            navigation.go @url()
                        else
                            navigation.go @url choice
                close: =>
                    dialog.remove()
                    @recordsets = null

        createRecordSet: (name) ->
            recordset = new (api.Resource.forModel 'recordset')
                dbtableid: @model.tableId
                name: name
                type: 0
            recordset.save().pipe -> recordset

    RecordSetsList = Backbone.View.extend
        render: ->
            @$el.empty()

            recordsets = new (api.Collection.forModel 'recordset')()
            recordsets.queryParams.domainfilter = true
            recordsets.fetch().done => recordsets.each (recordset) =>
                rsli = new RecordSetsListItem
                    el: $ '<li>'
                    recordset: recordset
                @$el.append rsli.render().el
            @

    RecordSetsListItem = Backbone.View.extend
        events:
            'click a.recordset-name': 'navToRecordSet'
            'click a.recordset-edit': 'editRecordSet'

        initialize: (options) ->
            @recordset = options.recordset
            @recordset.on 'sync', @render, @
            @recordset.on 'destroy', => @$el.remove()

        render: ->
            # TODO: This should be a template.
            @$el.html """
                <a class=\"recordset-edit\">
                    <span class=\"ui-icon ui-icon-pencil\">edit</span>
                </a>
                <img><a class=\"recordset-name\" />
            """
            @$('.recordset-name').text(@recordset.get 'name').prop 'href', "/specify/recordset/#{ @recordset.id }/"
            @$('img').prop 'src', schema.getModelById(@recordset.get 'dbtableid').getIcon()
            @$('.recordset-edit').data 'recordset', @recordset
            @

        editRecordSet: (evt) ->
            evt.preventDefault()
            # TODO: This should make use of the forms system.
            dialog = $ """
                <div title=\"Edit Record Set\">
                    <p>
                        <label>Name</label>
                        <input type=\"text\" name=\"name\">
                    </p><p>
                        <label>Remarks</label>
                        <input type=\"textarea\" name=\"remarks\">
                    </p>
                </div>
            """

            nameEl = dialog.find('[name="name"]').val(@recordset.get 'name').change =>
                @recordset.set 'name', nameEl.val()
            remarksEl = dialog.find('[name="remarks"]').val(@recordset.get 'remarks').change =>
                @recordset.set 'remarks', remarksEl.val()

            dialog.dialog
                buttons:
                    Save: =>
                        @recordset.save().done -> dialog.dialog 'close'
                    Delete: =>
                        @recordset.destroy(wait: true).done -> dialog.dialog 'close'
                    Cancel: =>
                        @recordset.fetch().done -> dialog.dialog 'close'
                close: ->
                    dialog.remove()

        navToRecordSet: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop 'href'


    WelcomeView = Backbone.View.extend
        attributes:
                ViewType: 'WelcomeView'
        render: ->
            @$el.addClass "welcome"
            @$el.append templates.welcome()
            new RecordSetsList(el: @$('.recordsets ul')).render()
            new FormsList(el: @$('.forms ul')).render()
            @
