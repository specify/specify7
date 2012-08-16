define ['jquery', 'underscore'], ($, _) ->

    (field, value) ->
        if field.getFormat() is 'CatalogNumberNumeric'
            asInt = parseInt(value, 10)
            if _.isNaN asInt then value else asInt
        else if field.name in ['timestampModified', 'timestampCreated']
            value and value.split('T')[0] or ''
        else
            value or ''
