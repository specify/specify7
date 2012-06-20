define ['jquery', 'underscore', 'jquery-mockjax', 'jquery-bbq'], ($, _) -> ->

    $.mockjax (settings) ->
        match = settings.url.match /^\/api\/specify\/(\w+)\/(\d+)\/$/

        if match? then proxy: "/static/js/tests/fixtures/#{ match[1] }.#{ match[2] }.json"
        else
            match = settings.url.match /^\/api\/specify\/(\w+)\/$/
            if match? then proxy: $.param.querystring("/static/js/tests/fixtures/#{ match[1] }", settings.data).replace('?', '.') + '.json'

    $.mockjaxSettings.responseTime = 10;

