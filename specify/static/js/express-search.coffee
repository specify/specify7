define ['jquery', 'underscore', 'backbone', 'navigation', 'schema',
    'text!context/express_search_config.xml',
    'jquery-bbq', 'jquery-ui'
], ($, _, Backbone, navigation, schema, configXML) ->
    config = $.parseXML configXML

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
            query = $.deparam.querystring().q
            $('.express-search-query').val query
            ajaxUrl = $.param.querystring '/express_search/', q: query
            $.get ajaxUrl, _.bind(@showResults, @)
            @

        showResults: (results) ->
            _.chain($ 'tables > searchtable', config).sortBy( (searchTable) ->
                parseInt $('displayOrder', searchTable).text(), 10
                ).each _.bind(@showResultsForTable, @, results)

            @$el.accordion
                autoHeight: false
                collapsible: true
                active: false

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
                _.each displayFields, (displayField) ->
                    href = "/specify/view/#{ model.name.toLowerCase() }/#{ result.id }/"
                    row.append $('<td>').append \
                        $('<a>', { href: href, class: "express-search-result" }).text \
                            result[displayField.name.toLowerCase()]

        navToResult: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop('href')


