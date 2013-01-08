define ['jquery', 'underscore', 'cs!agenttypepicklist'], ($, _, agenttypes) ->

    (field, value) ->
        asInt = parseInt(value, 10)
        if field.getFormat() is 'CatalogNumberNumeric'
            if _.isNaN asInt then value else asInt
        else if field.name in ['timestampModified', 'timestampCreated']
            value and value.split('T')[0] or value
        else if field.name is 'agentType' and field.model.name is 'Agent'
            _.find(agenttypes, (type) -> type.value is asInt)?.title or value
        else
            value or ''
