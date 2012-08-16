define ['jquery', 'underscore', 'backbone', 'navigation',
    'schema', 'specifyapi', 'cs!fieldformat', 'cs!props',
    'text!context/express_search_config.xml',
    'text!context/available_related_searches.json',
    'text!properties/expresssearch_en.properties',
    'jquery-bbq', 'jquery-ui'
], ($, _, Backbone, navigation, schema, api, fieldformat, props, \
configXML, availableRelatedJson, propstext) ->
    config = $.parseXML configXML
    relatedSearches = $.parseJSON availableRelatedJson
    getProp = _.bind props.getProperty, props, propstext

    accordionOptions =
        autoHeight: false
        collapsible: true
        active: false


    SearchView: Backbone.View.extend
        events:
            'click :submit': 'search'
        search: (evt) ->
            evt.preventDefault()
            query = @$('.express-search-query').val().trim()
            if query
                url = $.param.querystring '/specify/express_search/', q: query
                navigation.go url

    ResultsView: Backbone.View.extend
        events:
            'click a.express-search-result': 'navToResult'
        render: ->
            @$el.accordion accordionOptions
            query = $.deparam.querystring().q
            $('.express-search-query').val query
            ajaxUrl = $.param.querystring '/express_search/', q: query
            $.get ajaxUrl, _.bind(@showResults, @)
            @doRelatedSearches query
            @
        searchTableOrder:
            (searchTable) -> parseInt $('displayOrder', searchTable).text(), 10

        showResults: (results) ->
            _.chain($ 'tables > searchtable', config) \
                .sortBy(@searchTableOrder) \
                .each _.bind(@showResultsForTable, @, results)

            @$el.accordion('destroy').accordion accordionOptions

        doRelatedSearches: (query) ->
            _.each relatedSearches, (rs) =>
                ajaxUrl = $.param.querystring '/express_search/related/', {
                    q: query, name: rs }
                $.get ajaxUrl, _.bind(@showRelatedResults, @)

        showRelatedResults: (relatedSearch) ->
            if relatedSearch.totalCount < 1 then return
            heading = getProp(relatedSearch.definition.name) + ' - ' + relatedSearch.totalCount
            @$el.append $('<h4>').append $('<a>').text heading
            table = $('<table width="100%">').appendTo $('<div>').appendTo @el

            model = schema.getModel(relatedSearch.definition.root)
            displayFields = _.map relatedSearch.definition.columns, _.bind(model.getField, model)

            header = $('<tr>').appendTo table
            _.each displayFields, (field) ->
                header.append $('<th>').text field.getLocalizedName()

            _.each relatedSearch.results, (values) ->
                row = $('<tr>').appendTo table
                resource = new (api.Resource.forModel model) id: values.pop()
                href = resource.viewUrl()
                _.each displayFields, (field, i) ->
                    value = fieldformat field, values[i]
                    row.append $('<td>').append \
                        $('<a>', { href: href, class: "express-search-result" }).text value

            @$el.accordion('destroy').accordion accordionOptions

        showResultsForTable: (allResults, searchTable) ->
            model = schema.getModel $('tableName', searchTable).text()
            results = _.find allResults, (__, name) ->
                name.toLowerCase() is model.name.toLowerCase()

            if results.length < 1 then return
            heading = model.getLocalizedName() + ' - ' + results.length

            @$el.append $('<h4>').append $('<a>').text heading
            table = $('<table width="100%">').appendTo $('<div>').appendTo @el

            displayFields = _.chain($ 'displayfield', searchTable).sortBy( (df) ->
                parseInt $('order', df).text(), 10 ).map( (df) ->
                    model.getField $('fieldName', df).text() ).value()

            header = $('<tr>').appendTo table
            _.each displayFields, (displayField) ->
                header.append $('<th>').text displayField.getLocalizedName()

            _.each results, (result) ->
                row = $('<tr>').appendTo table
                _.each displayFields, (field) ->
                    resource = new (api.Resource.forModel model) id: result.id
                    href = resource.viewUrl()
                    value = fieldformat field, result[field.name.toLowerCase()]
                    row.append $('<td>').append \
                        $('<a>', { href: href, class: "express-search-result" }).text value

        navToResult: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop('href')


