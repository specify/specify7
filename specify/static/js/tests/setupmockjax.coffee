define ['jquery', 'underscore', 'jquery-mockjax', 'jquery-bbq'], ($, _) -> ->

    $.mockjax (settings) ->
        if settings.type is "POST"
            response: ->
                @.responseText = JSON.parse settings.data
                @.responseText.id = 'mocked'
        else
            match = settings.url.match /^\/api\/specify\/(\w+)\/(\d+)\/$/

            if match?
                proxy: "/static/js/tests/fixtures/#{ match[1] }.#{ match[2] }.json"
            else
                match = settings.url.match /^\/api\/specify\/(\w+)\/$/
                if match? then proxy: $.param.querystring("/static/js/tests/fixtures/#{ match[1] }", settings.data).replace('?', '.') + '.json'

    $.mockjaxSettings.responseTime = 10;

