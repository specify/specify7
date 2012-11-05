define ['jquery', 'underscore', 'backbone', 'navigation', 'cs!appresource',
    'schema', 'specifyapi', 'cs!fieldformat', 'cs!props', 'whenall',
    'text!context/available_related_searches.json!noinline',
    'text!properties/expresssearch_en.properties!noinline',
    'jquery-bbq', 'jquery-ui'
], ($, _, Backbone, navigation, getAppResource, schema, api, fieldformat, props, whenAll, availableRelatedJson, propstext) ->

    configFetch = getAppResource 'ExpressSearchConfig'

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
            @$el.append '<h3>Primary Search</h3><p class="status primary">Running...</p><div class="results primary"></div>'
            @$el.append '<h3>Secondary Search</h3><p class="status related">Running...</p><div class="results related"></div>'
            @$('.results').accordion accordionOptions
            query = $.deparam.querystring().q
            $('.express-search-query').val query
            ajaxUrl = $.param.querystring '/express_search/', q: query
            $.get ajaxUrl, _.bind(@showResults, @)
            @doRelatedSearches query
            @
        searchTableOrder:
            (searchTable) -> parseInt $('displayOrder', searchTable).text(), 10

        showResults: (results) -> configFetch.done (config) =>
            totalResults = _.chain($ 'tables > searchtable', config) \
                .sortBy(@searchTableOrder) \
                .map(_.bind @showResultsForTable, @, results) \
                .reduce ((a, b) -> (a + b)), 0

            if totalResults.value() is 0 then @$('.primary.status').text('No Matches')
            else @$('.primary.status').hide()

            @$('.results.primary').accordion('destroy').accordion accordionOptions

        doRelatedSearches: (query) ->
            deferreds = _.map relatedSearches, (rs) =>
                ajaxUrl = $.param.querystring '/express_search/related/', {
                    q: query, name: rs }
                $.get(ajaxUrl).pipe _.bind(@showRelatedResults, @)
            whenAll(deferreds).then (counts) =>
                if  _.reduce(counts, ((a, b) -> a + b), 0) is 0
                    @$('.related.status').text('No Matches')
                else
                    @$('.related.status').hide()

        showRelatedResults: (relatedSearch) ->
            if relatedSearch.totalCount < 1 then return 0

            rsName = relatedSearch.definition.name
            heading = (getProp(rsName) or rsName) + ' - ' + relatedSearch.totalCount
            @$('.related.results').append $('<h4>').append $('<a>').text heading
            table = $('<table width="100%">').appendTo $('<div>').appendTo @$('.related.results')

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

            @$('.results.related').accordion('destroy').accordion accordionOptions
            relatedSearch.totalCount

        showResultsForTable: (allResults, searchTable) ->
            model = schema.getModel $('tableName', searchTable).text()
            results = _.find allResults, (__, name) ->
                name.toLowerCase() is model.name.toLowerCase()

            if results.length < 1 then return 0
            heading = model.getLocalizedName() + ' - ' + results.length

            @$('.primary.results').append $('<h4>').append $('<a>').text heading
            table = $('<table width="100%">').appendTo $('<div>').appendTo @$('.primary.results')

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
            results.length

        navToResult: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop('href')


