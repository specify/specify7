(function() {

  define(['jquery', 'underscore', 'jquery-mockjax', 'jquery-bbq'], function($, _) {
    return function() {
      $.mockjax(function(settings) {
        var match;
        if (settings.type === "POST") {
          return {
            response: function() {
              this.responseText = JSON.parse(settings.data);
              return this.responseText.id = 'mocked';
            }
          };
        } else {
          match = settings.url.match(/^\/api\/specify\/(\w+)\/(\d+)\/$/);
          if (match != null) {
            return {
              proxy: "/static/js/tests/fixtures/" + match[1] + "." + match[2] + ".json"
            };
          } else {
            match = settings.url.match(/^\/api\/specify\/(\w+)\/$/);
            if (match != null) {
              return {
                proxy: $.param.querystring("/static/js/tests/fixtures/" + match[1], settings.data).replace('?', '.') + '.json'
              };
            }
          }
        }
      });
      return $.mockjaxSettings.responseTime = 10;
    };
  });

}).call(this);
