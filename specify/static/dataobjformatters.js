(function (specify, $, undefined) {
    "use strict";
    var formatters;

    specify.dataObjFormat = function (modelName, obj) {
        var sw = formatters.find('format[name="' + modelName + '"]').find('switch');
        // external dataobjFormatters not supported
        if (!sw.length || sw.find('external').length)
            return obj;

        function doIt(obj) {
            // doesn't support switch fields that are in child objects
            var fields = (sw.attr('field') ?
                          sw.find('fields[value="' + obj[sw.attr('field').toLowerCase()] + '"]').first() :
                          sw.find('fields').first()).find('field');

            var deferreds = fields.map(function () {
                return specify.getDataFromResource(obj, $(this).text());
            });

            return $.when.apply($, deferreds).pipe(function () {
                var data = arguments, result = [];
                fields.each(function (index) {
                    var field = $(this);
                    field.attr('sep') && result.push(field.attr('sep'));
                    result.push(data[index]);
                });
                return result.join('');
            }).promise();
        }

        return ($.isPlainObject(obj)) ? doIt(obj) : $.get(obj).pipe(doIt)
    };

    specify.addInitializer(function() {
        return $.get('/static/resources/dataobj_formatters.xml',
                     function(data) { formatters = $(data); });
    });

} (window.specify = window.specify || {}, jQuery));
