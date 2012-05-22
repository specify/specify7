define([
    'jquery', 'underscore', 'jquery-ui'
], function($, _) {
    "use strict";
    var origParseDate = $.datepicker.parseDate;

    $.datepicker.parseDate = function(format, value, settings) {
        switch (format) {
        case "yy":
            value += "-01";
            format += "-mm";
        case "yy-mm":
            value += "-01";
            format += "-dd";
            break;
        }
        return origParseDate.call($.datepicker, format, value, settings);
    };
});
