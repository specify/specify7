define ['jquery', 'underscore', 'backbone', 'navigation',
    'text!context/express_search_config.xml',
    'jquery-bbq'
], ($, _, Backbone, navigation, configXML) ->
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
        render: ->
            query = $.deparam.querystring().q
            ajaxUrl = $.param.querystring '/express_search/', q: query
            $.get ajaxUrl, _.bind(@showResults, @)
            @

        showResults: (results) ->
            _.chain($ 'tables > searchtable', config).sortBy( (searchTable) ->
                parseInt $('displayOrder', searchTable).text(), 10
                ).each _.bind(@showResultsForTable, @, results)

        showResultsForTable: (results, searchTable) ->
            tableName = $('tableName', searchTable).text()
            table = $('<table>').appendTo @el

            displayFields = _($ 'displayfield', searchTable).sortBy (displayField) ->
                parseInt $('order', displayField).text(), 10

            header = $('<tr>').appendTo table
            _.each displayFields, (displayField) ->
                header.append $('<th>').text $('fieldName', displayField).text()

            _.each (_.find results, (__, tname)  -> tname.toLowerCase() is tableName.toLowerCase()), (result) ->
                row = $('<tr>').appendTo table
                _.each displayFields, (displayField) ->
                    row.append $('<td>').text result[$('fieldName', displayField).text().toLowerCase()]

