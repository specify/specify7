define ['jquery', 'underscore'], ($, _) ->

    reForKey: (key) ->
        RegExp('^' + key + '\\s*[\\s=:]\\s*(.*)$', 'm')

    unescape: (value) ->
        $.parseJSON '"' + value.replace(/\"/g, '\\"') + '"'

    getProperty: (properties, key) ->
        value = (@reForKey key).exec(properties)?[1]
        value && @unescape value
