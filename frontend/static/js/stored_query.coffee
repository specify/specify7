define ['jquery', 'underscore', 'backbone', 'navigation', 'cs!appresource',
    'schema', 'specifyapi', 'cs!fieldformat', 'cs!props', 'whenall',
    'jquery-bbq', 'jquery-ui'
], ($, _, Backbone, navigation, getAppResource, schema, api, fieldformat, props, whenAll) ->

    Backbone.View.extend
        attributes:
                ViewType: 'StoredQuery'
                
        events:
            'click a.query-result': 'navToResult'
        render: ->
            query = @options.query
            model = schema.getModel query.get 'contextname'

            @$el.append $('<h2>').text query.get('name')
            @$el.append '<p class="status">Running...</p>'
            table = $('<table class="results" width="100%"></div>').appendTo @el

            ajaxUrl = "/stored_query/query/#{query.id}/"
            $.when( $.get(ajaxUrl), query.rget('fields', true) ).done (ajaxResult, fields) =>
                results = ajaxResult[0]
                @renderHeader fields
                columns = results.shift()
                fieldToCol = (field) -> _(columns).indexOf field.id

                if results.length == 0 then @$('.status').text('No Matches')
                else @$('.status').hide()

                _.each results, (result) ->
                    row = $('<tr>').appendTo table
                    resource = new (api.Resource.forModel model) id: result[0]
                    href = resource.viewUrl()
                    fields.each (field) ->
                        value = result[fieldToCol field]
                        row.append $('<td>').append \
                            $('<a>', { href: href, class: "query-result" }).text value

        renderHeader: (fields) ->
            header = $('<tr>').appendTo @$('.results')
            fields.each (field) ->
                header.append $('<th>').text field.get('columnalias')

        navToResult: (evt) ->
            evt.preventDefault()
            navigation.go $(evt.currentTarget).prop('href')


